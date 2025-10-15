// app/api/interview-column/route.js
// このファイルはNext.jsのAPIルートであり、サーバーサイドで実行されます。
// クライアントからのリクエストに応じて、インタビューやコラム記事のデータを返します。

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
// ★追加★ 推し楽APIから取得する記事の最大件数
// 例えば、最新の300件だけを取得したい場合は 300 に設定します。
// 0 に設定すると推し楽記事は取得されません。
const OSHIRAKU_FETCH_LIMIT = 100;

// CORS (Cross-Origin Resource Sharing) の許可オリジン設定
// クライアントのオリジン (例: VercelデプロイURL) を指定することで、セキュリティを確保しつつアクセスを許可する
// 環境変数 VERCEL_URL があればそれを使用し、なければローカル開発用のURLをフォールバックとして使用
const ALLOWED_ORIGIN = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";

// --- キャッシュ関連の変数 ---
// User-Agentのカテゴリ（'mobile'または'pc'）ごとに記事データをキャッシュするMap
// Node.jsのプロセスが存続する限り、このデータはメモリ上に保持される
const cachedArticlesByUA = new Map(); // Map<string (userAgentCategory), { articles: Article[], timestamp: number }>
// キャッシュの有効期間 (ミリ秒)。ここでは1時間 (60分 * 60秒 * 1000ミリ秒) に設定
const CACHE_LIFETIME = 60 * 60 * 1000;

// --- ヘルパー関数 ---

/**
 * User-Agent ヘッダーからモバイルデバイスかどうかを判定する関数。
 * @param {string | null | undefined} userAgent - リクエストのUser-Agent文字列。
 * @returns {boolean} モバイルデバイスからのアクセスであれば true、そうでなければ false。
 */
function isMobileUserAgent(userAgent) {
  if (!userAgent) return false;
  // 一般的なモバイルデバイスのキーワードを正規表現でチェック
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Mobi/i.test(userAgent);
}

/**
 * 静的記事のURLからHTMLをフェッチし、解析して記事データを抽出する非同期関数。
 * OGPメタタグ、特定のセレクタ、または本文中の最初の画像からサムネイルURLを試行する。
 * @param {string} pageUrl - スクレイピング対象の静的記事のURL。
 * @returns {Promise<object|null>} 抽出された記事データオブジェクト、またはエラー時にnull。
 */
async function fetchAndParseStaticNews(pageUrl) {
  let htmlContent = "";
  console.log(`[fetchAndParseStaticNews] Attempting to fetch: ${pageUrl}`);

  try {
    const response = await fetch(pageUrl);
    if (!response.ok) {
      console.warn(`[fetchAndParseStaticNews] Failed to fetch static news ${pageUrl}: HTTP Status ${response.status}`);
      return null;
    }
    htmlContent = await response.text();
    console.log(`[fetchAndParseStaticNews] Successfully fetched HTML for ${pageUrl}, content length: ${htmlContent.length}`);
  } catch (fetchError) {
    console.error(`[fetchAndParseStaticNews] Error fetching static news ${pageUrl}:`, fetchError.message);
    return null;
  }

  const $ = cheerio.load(htmlContent);

  const urlParts = pageUrl.split("/");
  const lastPart = urlParts[urlParts.length - 1];
  const id = lastPart.includes(".") ? lastPart.split(".")[0] : lastPart;

  const title = $("title").text() || $("h1").first().text() || `No Title (${id})`;
  const description = $("p").first().text().substring(0, 100) + "..." || "No description available.";

  let publishDateStr = $('meta[name="date"]').attr("content") || $("time[datetime]").attr("datetime") || null;
  let publishDate = null;
  if (publishDateStr) {
    try {
      publishDate = new Date(publishDateStr);
      if (isNaN(publishDate.getTime())) {
        publishDate = null;
        console.warn(`[fetchAndParseStaticNews] Parsed date is Invalid Date for ${pageUrl}.`);
      } else {
        console.log(`[fetchAndParseStaticNews] Parsed publishDate for ${pageUrl}: ${publishDate.toISOString()}`);
      }
    } catch (e) {
      console.warn(`[fetchAndParseStaticNews] Could not parse publishDate '${publishDateStr}' for ${pageUrl}:`, e);
      publishDate = null;
    }
  }
  if (!publishDate) {
    console.warn(`[fetchAndParseStaticNews] No valid publish date found for ${pageUrl}. Using default (epoch time).`);
  }

  let thumbnailUrl = null;

  // --- サムネイル取得ロジック (OGP優先、フォールバックあり) ---

  // 1. OGP メタタグからサムネイルURLを抽出 (最優先)
  const ogImage = $('meta[property="og:image"]').attr("content");
  console.log(`[fetchAndParseStaticNews] OGP og:image raw content for ${pageUrl}: '${ogImage}'`);
  if (ogImage) {
    try {
      thumbnailUrl = new URL(ogImage, pageUrl).href;
      console.log(`[fetchAndParseStaticNews] Found OGP image for ${pageUrl}: ${thumbnailUrl}`);
    } catch (ogUrlResolveError) {
      console.warn(`[fetchAndParseStaticNews] Could not resolve OGP image URL ${ogImage} for ${pageUrl}:`, ogUrlResolveError.message);
      thumbnailUrl = null;
    }
  }

  // 2. OGP画像が見つからない場合、特定のセレクタから抽出 (フォールバック1)
  if (!thumbnailUrl) {
    const imgTag = $("figure.biography__image img").first();
    const specificImgSrc = imgTag.length > 0 ? imgTag.attr("src") : "N/A";
    console.log(`[fetchAndParseStaticNews] Specific selector (figure.biography__image img) src for ${pageUrl}: '${specificImgSrc}'`);
    if (imgTag.length > 0) {
      const src = imgTag.attr("src");
      if (src) {
        try {
          let effectiveSrc = src;
          if (src.startsWith("//")) {
            effectiveSrc = `https:${src}`;
          }
          thumbnailUrl = new URL(effectiveSrc, pageUrl).href;
          console.log(`[fetchAndParseStaticNews] Found specific image for ${pageUrl}: ${thumbnailUrl}`);
        } catch (urlResolveError) {
          console.warn(`[fetchAndParseStaticNews] Could not resolve specific image URL ${src} for ${pageUrl}:`, urlResolveError.message);
          thumbnailUrl = null;
        }
      }
    }
  }

  // 3. それでも見つからない場合、本文中の最初の画像を探す (最終フォールバック)
  if (!thumbnailUrl) {
    const firstImg = $("img").first();
    const firstImgSrc = firstImg.length > 0 ? firstImg.attr("src") : "N/A";
    console.log(`[fetchAndParseStaticNews] First img tag src for ${pageUrl}: '${firstImgSrc}'`);
    if (firstImg.length > 0) {
      const src = firstImg.attr("src");
      if (src) {
        try {
          let effectiveSrc = src;
          if (src.startsWith("//")) {
            effectiveSrc = `https:${src}`;
          }
          thumbnailUrl = new URL(effectiveSrc, pageUrl).href;
          console.log(`[fetchAndParseStaticNews] Found first img tag for ${pageUrl}: ${thumbnailUrl}`);
        } catch (firstImgResolveError) {
          console.warn(`[fetchAndParseStaticNews] Could not resolve first img tag URL ${src} for ${pageUrl}:`, firstImgResolveError.message);
          thumbnailUrl = null;
        }
      }
    }
  }

  if (!thumbnailUrl) {
    console.warn(`[fetchAndParseStaticNews] No thumbnail found for ${pageUrl}.`);
  }

  const sortDate = publishDate || new Date(0);
  const displayDate = publishDate ? publishDate.toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" }) : "日付不明";

  console.log(`[fetchAndParseStaticNews] Final article data for ${pageUrl}:`, {
    id: id,
    title: title,
    url: pageUrl,
    thumbnailImage: thumbnailUrl,
    sortDate: sortDate.toISOString(),
    displayDate: displayDate,
  });

  return {
    id: id,
    type: "static",
    title: title,
    description: description,
    url: pageUrl,
    thumbnailImage: thumbnailUrl ? { url: thumbnailUrl } : null,
    sortDate: sortDate,
    displayDate: displayDate,
  };
}

/**
 * GET リクエストハンドラ。
 * インタビュー・コラム記事を統合し、ページネーションされたデータを返す。
 * @param {Request} request - Next.js の Request オブジェクト。
 * @returns {NextResponse} 記事データ、総件数、エラー情報を含むJSONレスポンス。
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "10", 10);

  if (isNaN(page) || page < 1 || isNaN(pageSize) || pageSize < 1) {
    return NextResponse.json({ error: "Invalid page or pageSize parameters." }, { status: 400 });
  }

  let allCombinedArticles = [];
  let oshirakuFetchError = null;
  let staticFetchError = null;

  const now = Date.now();
  const userAgent = request.headers.get("user-agent");
  const userAgentCategory = isMobileUserAgent(userAgent) ? "mobile" : "pc"; // 'mobile' or 'pc'

  // 💡 キャッシュのチェックと利用 (User-Agentごとのキャッシュ)
  const cachedData = cachedArticlesByUA.get(userAgentCategory);

  if (cachedData && now - cachedData.timestamp < CACHE_LIFETIME) {
    console.log(`[interview-column API] Using cached data for ${userAgentCategory}. Cache timestamp: ${new Date(cachedData.timestamp).toLocaleString()}.`);
    allCombinedArticles = cachedData.articles;
  } else {
    console.log(`[interview-column API] Cache expired or not found for ${userAgentCategory}. Fetching new data...`);

    // 1. 推し楽記事の取得 (全件取得)
    try {
      let currentOshirakuPage = 1;
      let hasMoreOshiraku = true;
      let tempOshirakuArticles = [];
      let totalFetchedOshiraku = 0; // ★追加★ 取得済みの推し楽記事総数

      // 記事がなくなるまで、または取得制限に達するまでループ
      while (hasMoreOshiraku && totalFetchedOshiraku < OSHIRAKU_FETCH_LIMIT) {
        // ★修正★
        // 1回のAPI呼び出しで取得する件数
        // 残りの取得制限数を考慮して pageSize を調整
        const currentFetchSize = Math.min(OSHIRAKU_MAX_PAGE_SIZE, OSHIRAKU_FETCH_LIMIT - totalFetchedOshiraku);

        // currentFetchSize が 0 以下なら、もう取得する必要がない
        if (currentFetchSize <= 0) {
          hasMoreOshiraku = false;
          break;
        }
        const oshirakuRes = await axios.get(OSHIRAKU_API_ENDPOINT, {
          headers: {
            apikey: OSHIRAKU_API_KEY,
          },
          params: {
            oshTagId: 3,
            page: currentOshirakuPage,
            pageSize: currentFetchSize,
            sortType: "opendate",
          },
        });

        const fetchedArticles = (oshirakuRes.data.articles || []).map((article) => ({
          ...article,
          id: article.articleId,
          type: "oshiraku",
          thumbnailImage: article.thumbnailImage || null, // 推し楽APIのレスポンスから直接使用
          sortDate: article.openDate ? new Date(article.openDate) : new Date(0),
          displayDate: article.openDate ? new Date(article.openDate).toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" }) : "日付不明",
        }));

        tempOshirakuArticles = tempOshirakuArticles.concat(fetchedArticles);
        totalFetchedOshiraku += fetchedArticles.length; // ★追加★ 取得総数を更新

        // 取得した記事数がリクエストした pageSize より少なければ、もう次のページはない
        // または、取得総数が制限に達していればループを終了
        if (fetchedArticles.length < currentFetchSize || totalFetchedOshiraku >= OSHIRAKU_FETCH_LIMIT) {
          // ★修正★
          hasMoreOshiraku = false;
        } else {
          currentOshirakuPage++;
        }
      }
      // 最終的に取得制限を超えてしまった場合のために切り詰める
      allCombinedArticles = allCombinedArticles.concat(tempOshirakuArticles.slice(0, OSHIRAKU_FETCH_LIMIT)); // ★修正★
      console.log(`[interview-column API] Fetched ${allCombinedArticles.filter((a) => a.type === "oshiraku").length} Oshiraku articles (up to limit).`);
    } catch (err) {
      console.error("Failed to fetch Oshiraku articles:", err.message);
      oshirakuFetchError = "推し楽ニュースの取得に失敗しました。";
    }

    // 2. 静的記事の取得 (全件スクレイピング)
    let EXTERNAL_STATIC_PAGE_URLS = [];

    try {
      const fileContent = await fs.readFile(STATIC_NEWS_CONFIG_PATH, "utf8");
      const staticUrlsConfig = JSON.parse(fileContent);

      console.log(`[interview-column API] Request User-Agent: '${userAgent}', Is Mobile: ${isMobileUserAgent(userAgent)}`);

      if (userAgentCategory === "mobile") {
        EXTERNAL_STATIC_PAGE_URLS = staticUrlsConfig.mobileUrls || [];
        console.log(`[interview-column API] Using mobileUrls: ${EXTERNAL_STATIC_PAGE_URLS.length} URLs.`);
      } else {
        // 'pc'
        EXTERNAL_STATIC_PAGE_URLS = staticUrlsConfig.pcUrls || [];
        console.log(`[interview-column API] Using pcUrls: ${EXTERNAL_STATIC_PAGE_URLS.length} URLs.`);
      }
    } catch (readError) {
      console.error(`Failed to read or parse static news config file ${STATIC_NEWS_CONFIG_PATH}:`, readError);
      staticFetchError = "静的ニュース設定の読み込みに失敗しました。";
    }

    if (EXTERNAL_STATIC_PAGE_URLS.length > 0) {
      try {
        const staticArticles = await Promise.all(EXTERNAL_STATIC_PAGE_URLS.map((url) => fetchAndParseStaticNews(url)));
        allCombinedArticles = allCombinedArticles.concat(staticArticles.filter((item) => item !== null));
        console.log(`[interview-column API] Fetched ${staticArticles.filter((a) => a !== null).length} static articles.`);
      } catch (err) {
        console.error("Failed to fetch and parse static articles:", err.message);
        staticFetchError = "静的ニュース記事の取得に失敗しました。";
      }
    }

    // 3. データの結合、ソート
    allCombinedArticles.sort((a, b) => {
      const dateA = a.sortDate instanceof Date && !isNaN(a.sortDate) ? a.sortDate.getTime() : 0;
      const dateB = b.sortDate instanceof Date && !isNaN(b.sortDate) ? b.sortDate.getTime() : 0;
      return dateB - dateA;
    });
    console.log(`[interview-column API] Total articles after sort: ${allCombinedArticles.length}`);

    // 💡 キャッシュに保存
    cachedArticlesByUA.set(userAgentCategory, { articles: allCombinedArticles, timestamp: now });
    console.log(`[interview-column API] Cached data for ${userAgentCategory}.`);
  }

  // 4. ページング処理
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedArticles = allCombinedArticles.slice(startIndex, endIndex);

  // 5. 総件数
  const totalCount = allCombinedArticles.length;

  // 6. エラーメッセージの結合
  const combinedErrorMessage = [oshirakuFetchError, staticFetchError].filter(Boolean).join(" ");

  return new NextResponse(
    JSON.stringify({
      articles: paginatedArticles,
      total_count: totalCount,
      error: combinedErrorMessage || null,
    }),
    {
      status: combinedErrorMessage ? 500 : 200,
      headers: {
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
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
