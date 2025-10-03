// app/api/interview-column/route.js

// Next.js のサーバーサイドAPIルートのレスポンスを扱うためのモジュール
import { NextResponse } from "next/server";
// HTTPリクエストを行うためのライブラリ (推し楽APIへのリクエストに使用)
import axios from "axios";
// HTMLをパースして要素を抽出するためのライブラリ (静的記事のスクレイピングに使用)
import * as cheerio from "cheerio";
// ファイルパスを扱うためのNode.js組み込みモジュール
import path from "path";
// ファイルシステム操作のためのNode.js組み込みモジュール (promisified版)
import { promises as fs } from "fs";

// --- 設定値 ---
// 推し楽APIのエンドポイントURL
const OSHIRAKU_API_ENDPOINT = "https://rdc-api-catalog-gateway-api.rakuten.co.jp/oshiraku/search/v1/article";
// 静的ニュースのURLリストが記述された設定ファイルのパス
// process.cwd() はカレントワーキングディレクトリ (プロジェクトのルート) を指す
const STATIC_NEWS_CONFIG_PATH = path.join(process.cwd(), "config", "staticNewsUrls.json");
// 推し楽APIにアクセスするためのAPIキー (環境変数から取得)
// .env.local ファイルなどに OSHIRAKU_API_KEY=YOUR_API_KEY_HERE と記述する必要がある
const OSHIRAKU_API_KEY = process.env.OSHIRAKU_API_KEY;

// 推し楽APIが一度に取得できる記事の最大件数
const OSHIRAKU_MAX_PAGE_SIZE = 100;

// CORS (Cross-Origin Resource Sharing) の許可オリジン設定
// クライアントのオリジン (例: VercelデプロイURL) を指定することで、セキュリティを確保しつつアクセスを許可する
const ALLOWED_ORIGIN = "https://syncpower.vercel.app"; // 本番環境のURLに置き換える

// --- キャッシュ関連の変数 ---
// 全ての結合・ソート済み記事データを保持するインメモリキャッシュ
// Node.jsのプロセスが存続する限り、このデータはメモリ上に保持される
let cachedArticles = null;
// キャッシュが作成されたタイムスタンプ
let cacheTimestamp = 0;
// キャッシュの有効期間 (ミリ秒)。ここでは1時間 (60分 * 60秒 * 1000ミリ秒) に設定
const CACHE_LIFETIME = 60 * 60 * 1000;

// --- ヘルパー関数 ---

/**
 * 静的記事のURLからHTMLをフェッチし、解析して記事データを抽出する非同期関数。
 * @param {string} pageUrl - スクレイピング対象の静的記事のURL。
 * @returns {Promise<object|null>} 抽出された記事データオブジェクト、またはエラー時にnull。
 */
async function fetchAndParseStaticNews(pageUrl) {
  let htmlContent = "";
  try {
    // 指定されたURLからHTMLコンテンツをフェッチ
    const response = await fetch(pageUrl);
    // HTTPステータスコードが200番台以外の場合、警告ログを出力してnullを返す
    if (!response.ok) {
      console.warn(`[interview-column API] Failed to fetch static news ${pageUrl}: HTTP Status ${response.status}`);
      return null;
    }
    // レスポンスボディをテキストとして取得
    htmlContent = await response.text();
  } catch (fetchError) {
    // フェッチ中にネットワークエラーなどが発生した場合、エラーログを出力してnullを返す
    console.error(`[interview-column API] Error fetching static news ${pageUrl}:`, fetchError.message);
    return null;
  }

  // cheerio を使用してHTMLコンテンツをロードし、jQueryライクなセレクタで要素を操作できるようにする
  const $ = cheerio.load(htmlContent);

  // URLから記事IDを抽出 (例: example.com/column01/index.html -> column01)
  const urlParts = pageUrl.split("/");
  const id = urlParts[urlParts.length - 2];

  // 記事タイトルを抽出 (優先順位: <title>タグ -> <h1>タグの最初の要素 -> デフォルトタイトル)
  const title = $("title").text() || $("h1").first().text() || `No Title (${id})`;
  // 記事の説明を抽出 (最初の<p>タグの内容を100文字に制限 -> デフォルト説明)
  const description = $("p").first().text().substring(0, 100) + "..." || "No description available.";

  // 公開日を抽出 (優先順位: <meta name="date" content="..."> -> <time datetime="...">)
  let publishDateStr = $('meta[name="date"]').attr("content") || $("time[datetime]").attr("datetime") || null;
  let publishDate = null;
  if (publishDateStr) {
    try {
      // 抽出した文字列をDateオブジェクトに変換
      publishDate = new Date(publishDateStr);
      // 変換結果が無効な日付 (Invalid Date) でないかを確認
      if (isNaN(publishDate.getTime())) {
        publishDate = null; // 無効な場合はnullに設定
      }
    } catch (e) {
      // 日付パース中にエラーが発生した場合、警告ログを出力
      console.warn(`[interview-column API] Could not parse publishDate '${publishDateStr}' for ${pageUrl}:`, e);
      publishDate = null;
    }
  }

  // サムネイル画像のURLを抽出 (figure.biography__image クラス内の最初の<img>タグ)
  let thumbnailUrl = null;
  const imgTag = $("figure.biography__image img").first();
  if (imgTag.length > 0) {
    const src = imgTag.attr("src");
    if (src) {
      try {
        let effectiveSrc = src;
        // URLが "//" で始まる場合 (プロトコル相対URL) は "https:" を付加
        if (src.startsWith("//")) {
          effectiveSrc = `https:${src}`;
        }
        // 相対URLを絶対URLに解決
        thumbnailUrl = new URL(effectiveSrc, pageUrl).href;
      } catch (urlResolveError) {
        console.warn(`[interview-column API] Could not resolve thumbnail URL ${src} for ${pageUrl}:`, urlResolveError.message);
        thumbnailUrl = null;
      }
    }
  }

  // ソート用にDateオブジェクトを生成 (日付がない場合はエポックタイム: 1970/1/1)
  const sortDate = publishDate || new Date(0);
  // 表示用に整形された日付文字列を生成 (例: 2023年1月1日)
  const displayDate = publishDate ? publishDate.toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" }) : "日付不明";

  // 抽出した記事データをオブジェクトとして返す
  return {
    id: id, // 記事の一意なID
    type: "static", // 記事の種別 (静的記事であることを示す)
    title: title, // 記事タイトル
    description: description, // 記事の説明
    url: pageUrl, // 記事のURL
    thumbnailImage: thumbnailUrl ? { url: thumbnailUrl } : null, // サムネイル画像情報
    sortDate: sortDate, // ソート用Dateオブジェクト
    displayDate: displayDate, // 表示用日付文字列
  };
}

/**
 * GET リクエストハンドラ。
 * インタビュー・コラム記事を統合し、ページネーションされたデータを返す。
 * @param {Request} request - Next.js の Request オブジェクト。
 * @returns {NextResponse} 記事データ、総件数、エラー情報を含むJSONレスポンス。
 */
export async function GET(request) {
  // リクエストURLからクエリパラメータを抽出
  const { searchParams } = new URL(request.url);
  // page と pageSize クエリパラメータを取得し、整数に変換。デフォルト値は1と10。
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

  // page または pageSize が不正な数値の場合、400 Bad Request を返す
  if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
    return NextResponse.json({ error: "Invalid page or pageSize parameters." }, { status: 400 });
  }

  let allCombinedArticles = []; // 推し楽と静的記事を結合した全記事を格納する配列
  let oshirakuFetchError = null; // 推し楽APIからのエラーメッセージ
  let staticFetchError = null; // 静的記事スクレイピングからのエラーメッセージ

  // 💡 キャッシュのチェックと利用
  const now = Date.now(); // 現在のタイムスタンプを取得
  // キャッシュが存在し、かつ有効期間内であれば、キャッシュされたデータを使用
  if (cachedArticles && now - cacheTimestamp < CACHE_LIFETIME) {
    console.log("[interview-column API] Using cached data.");
    allCombinedArticles = cachedArticles; // キャッシュされたデータを全記事として設定
  } else {
    // キャッシュがない、または期限切れの場合、新規にデータをフェッチ
    console.log("[interview-column API] Cache expired or not found. Fetching new data...");

    // 1. 推し楽記事の取得 (全件取得)
    // 推し楽APIはpageSize最大100。全ての記事を取得するため、ループで複数ページをリクエスト
    try {
      let currentOshirakuPage = 1; // 推し楽APIのリクエスト開始ページ番号
      let hasMoreOshiraku = true; // 次のページがあるかどうかのフラグ
      let tempOshirakuArticles = []; // 今回のフェッチで取得した推し楽記事を一時的に格納

      // 記事がなくなるまでループ
      while (hasMoreOshiraku) {
        // 推し楽APIへGETリクエストを送信
        const oshirakuRes = await axios.get(OSHIRAKU_API_ENDPOINT, {
          headers: {
            apikey: OSHIRAKU_API_KEY, // APIキーをヘッダーに含める
          },
          params: {
            oshTagId: 1, // 固定のタグID
            page: currentOshirakuPage, // 現在の推し楽APIページ番号
            pageSize: OSHIRAKU_MAX_PAGE_SIZE, // 最大件数でリクエスト
            sortType: "opendate", // 公開日順でソート
            label: "report,interview,exclusive,public_relations",
          },
        });

        // レスポンスから記事データを抽出し、共通フォーマットに変換
        const fetchedArticles = (oshirakuRes.data.articles || []).map((article) => ({
          ...article, // 元の記事データを展開
          id: article.articleId, // IDを正規化
          type: "oshiraku", // 記事の種別
          sortDate: article.openDate ? new Date(article.openDate) : new Date(0), // ソート用Dateオブジェクト
          displayDate: article.openDate ? new Date(article.openDate).toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" }) : "日付不明", // 表示用日付文字列
        }));

        // 一時配列に取得した記事を追加
        tempOshirakuArticles = tempOshirakuArticles.concat(fetchedArticles);

        // 取得した記事数がpageSizeより少なければ、もう次のページはないと判断しループを終了
        if (fetchedArticles.length < OSHIRAKU_MAX_PAGE_SIZE) {
          hasMoreOshiraku = false;
        } else {
          // 次のページをリクエストするためにページ番号をインクリメント
          currentOshirakuPage++;
        }
      }
      // 最終的な推し楽記事を全結合記事配列に追加
      allCombinedArticles = allCombinedArticles.concat(tempOshirakuArticles);
      console.log(`[interview-column API] Fetched ${tempOshirakuArticles.length} Oshiraku articles.`);
    } catch (err) {
      // 推し楽APIからの取得中にエラーが発生した場合
      console.error("Failed to fetch Oshiraku articles:", err.message);
      oshirakuFetchError = "推し楽ニュースの取得に失敗しました。";
    }

    // 2. 静的記事の取得 (全件スクレイピング)
    let EXTERNAL_STATIC_PAGE_URLS = []; // 静的記事のURLリスト
    try {
      // 設定ファイルから静的記事のURLリストを読み込む
      const fileContent = await fs.readFile(STATIC_NEWS_CONFIG_PATH, "utf8");
      EXTERNAL_STATIC_PAGE_URLS = JSON.parse(fileContent);
    } catch (readError) {
      // ファイルの読み込みやパースに失敗した場合
      console.error(`Failed to read or parse static news config file ${STATIC_NEWS_CONFIG_PATH}:`, readError);
      staticFetchError = "静的ニュース設定の読み込みに失敗しました。";
    }

    // URLリストが存在する場合のみスクレイピングを実行
    if (EXTERNAL_STATIC_PAGE_URLS.length > 0) {
      try {
        // 各URLに対して fetchAndParseStaticNews を並列で実行 (Promise.all)
        const staticArticles = await Promise.all(EXTERNAL_STATIC_PAGE_URLS.map((url) => fetchAndParseStaticNews(url)));
        // スクレイピング結果を全結合記事配列に追加 (nullでないものだけ)
        allCombinedArticles = allCombinedArticles.concat(staticArticles.filter((item) => item !== null));
        console.log(`[interview-column API] Fetched ${staticArticles.filter((a) => a !== null).length} static articles.`);
      } catch (err) {
        // スクレイピング中にエラーが発生した場合
        console.error("Failed to fetch and parse static articles:", err.message);
        staticFetchError = "静的ニュース記事の取得に失敗しました。";
      }
    }

    // 3. データの結合、ソート
    // 全ての記事 (推し楽 + 静的) を公開日 (sortDate) の新しい順にソート
    allCombinedArticles.sort((a, b) => {
      // 日付が有効なDateオブジェクトであることを確認し、タイムスタンプを取得。無効なら0。
      const dateA = a.sortDate instanceof Date && !isNaN(a.sortDate) ? a.sortDate.getTime() : 0;
      const dateB = b.sortDate instanceof Date && !isNaN(b.sortDate) ? b.sortDate.getTime() : 0;
      // 降順ソート (新しい日付が前に来るように)
      return dateB - dateA;
    });

    // 💡 キャッシュに保存
    // 次回のリクエストのために、取得・ソート済みの全記事データと現在のタイムスタンプをキャッシュに保存
    cachedArticles = allCombinedArticles;
    cacheTimestamp = now;
  }

  // 4. ページング処理
  // キャッシュから取得した、または新たにフェッチ・ソートされた全記事データから、
  // クライアントが要求したページに該当する記事を抽出
  const startIndex = (page - 1) * pageSize; // 開始インデックス
  const endIndex = startIndex + pageSize; // 終了インデックス
  const paginatedArticles = allCombinedArticles.slice(startIndex, endIndex); // 抽出された記事

  // 5. 総件数
  // 結合された全記事の総件数 (ページング前の全データ数)
  const totalCount = allCombinedArticles.length;

  // 6. エラーメッセージの結合
  // 推し楽APIと静的記事スクレイピングの両方で発生したエラーメッセージを結合
  const combinedErrorMessage = [oshirakuFetchError, staticFetchError].filter(Boolean).join(" ");

  // レスポンスを構築して返す
  return new NextResponse(
    JSON.stringify({
      articles: paginatedArticles, // ページングされた記事リスト
      total_count: totalCount, // 全記事の総件数
      error: combinedErrorMessage || null, // エラーメッセージ (エラーがなければnull)
    }),
    {
      // エラーメッセージがあればHTTP 500、なければ200 OK
      status: combinedErrorMessage ? 500 : 200,
      headers: {
        // CORSヘッダーを設定
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    }
  );
}

/**
 * OPTIONS リクエストハンドラ (CORSプリフライトリクエスト対応)。
 * @returns {NextResponse} CORSヘッダーを含む空のレスポンス。
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204, // No Content
    headers: {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
