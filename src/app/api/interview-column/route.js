// app/api/interview-column/route.js

import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import path from "path";
import { promises as fs } from "fs";

// --- 設定値 ---
const OSHIRAKU_API_ENDPOINT = "https://rdc-api-catalog-gateway-api.rakuten.co.jp/oshiraku/search/v1/article";
const STATIC_NEWS_CONFIG_PATH = path.join(process.cwd(), "config", "staticNewsUrls.json");
const OSHIRAKU_API_KEY = process.env.OSHIRAKU_API_KEY;

// 推し楽APIのpageSize最大値
const OSHIRAKU_MAX_PAGE_SIZE = 100;

// CORS設定
const ALLOWED_ORIGIN = "https://syncpower.vercel.app";

// --- ヘルパー関数 ---

// 日付文字列を 'YYYY-MM-DD' 形式に整形する関数
function formatDateToYYYYMMDD(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    return null;
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 静的記事のスクレイピング関数
async function fetchAndParseStaticNews(pageUrl) {
  let htmlContent = "";
  try {
    const response = await fetch(pageUrl);
    if (!response.ok) {
      console.warn(`[interview-column API] Failed to fetch static news ${pageUrl}: HTTP Status ${response.status}`);
      return null;
    }
    htmlContent = await response.text();
  } catch (fetchError) {
    console.error(`[interview-column API] Error fetching static news ${pageUrl}:`, fetchError.message);
    return null;
  }

  const $ = cheerio.load(htmlContent);

  const urlParts = pageUrl.split("/");
  const id = urlParts[urlParts.length - 2]; // index.html の前のディレクトリ名を取得 (例: "column01")

  const title = $("title").text() || $("h1").first().text() || `No Title (${id})`;
  const description = $("p").first().text().substring(0, 100) + "..." || "No description available.";

  // ⭐ 修正点1: publishDateの取得を強化 ⭐
  // <meta name="date" content="2023-01-01"> または <time datetime="2023-01-01">
  let publishDateStr = $('meta[name="date"]').attr("content") || $("time[datetime]").attr("datetime") || null;
  let publishDate = null;
  if (publishDateStr) {
    try {
      publishDate = new Date(publishDateStr);
      // 無効な日付の場合のチェック
      if (isNaN(publishDate.getTime())) {
        publishDate = null;
      }
    } catch (e) {
      console.warn(`[interview-column API] Could not parse publishDate '${publishDateStr}' for ${pageUrl}:`, e);
      publishDate = null;
    }
  }

  let thumbnailUrl = null;
  const imgTag = $("figure.biography__image img").first();

  if (imgTag.length > 0) {
    const src = imgTag.attr("src");
    if (src) {
      try {
        let effectiveSrc = src;
        if (src.startsWith("//")) {
          effectiveSrc = `https:${src}`;
        }
        thumbnailUrl = new URL(effectiveSrc, pageUrl).href;
      } catch (urlResolveError) {
        console.warn(`[interview-column API] Could not resolve thumbnail URL ${src} for ${pageUrl}:`, urlResolveError.message);
        thumbnailUrl = null;
      }
    }
  }

  const sortDate = publishDate || new Date(0); // 無効な日付の場合はエポックタイム
  const displayDate = publishDate ? publishDate.toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" }) : "日付不明";

  return {
    id: id,
    type: "static",
    title: title,
    description: description,
    url: pageUrl,
    thumbnailImage: thumbnailUrl ? { url: thumbnailUrl } : null,
    // publishDate: publishDateStr, // 元の文字列も保持しておくとデバッグに便利
    sortDate: sortDate,
    displayDate: displayDate, // ⭐ 修正点2: displayDate をここで設定 ⭐
  };
}

// --- GET リクエストハンドラ ---
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

  // 1. 推し楽記事の取得 (全件取得し、後でソート・ページング)
  // 推し楽APIのpageSizeは最大100。全ての記事を取得するために、pageSizeを最大値に設定し、複数のページをリクエスト
  try {
    let currentOshirakuPage = 1;
    let hasMoreOshiraku = true;
    while (hasMoreOshiraku) {
      const oshirakuRes = await axios.get(OSHIRAKU_API_ENDPOINT, {
        headers: {
          apikey: OSHIRAKU_API_KEY,
        },
        params: {
          oshTagId: 1, // 固定
          page: currentOshirakuPage,
          pageSize: OSHIRAKU_MAX_PAGE_SIZE, // 最大件数でリクエスト
          sortType: "opendate",
        },
      });

      const fetchedArticles = (oshirakuRes.data.articles || []).map((article) => ({
        ...article,
        id: article.articleId,
        type: "oshiraku",
        sortDate: article.openDate ? new Date(article.openDate) : new Date(0),
        displayDate: article.openDate ? new Date(article.openDate).toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" }) : "日付不明",
      }));

      allCombinedArticles = allCombinedArticles.concat(fetchedArticles);

      // 取得した記事数がpageSizeより少なければ、もう次のページはないと判断
      if (fetchedArticles.length < OSHIRAKU_MAX_PAGE_SIZE) {
        hasMoreOshiraku = false;
      } else {
        currentOshirakuPage++;
      }
    }
    console.log(`[interview-column API] Fetched ${allCombinedArticles.filter((a) => a.type === "oshiraku").length} Oshiraku articles.`);
  } catch (err) {
    console.error("Failed to fetch Oshiraku articles:", err.message);
    oshirakuFetchError = "推し楽ニュースの取得に失敗しました。";
  }

  // 2. 静的記事の取得 (全件スクレイピング)
  let EXTERNAL_STATIC_PAGE_URLS = [];
  try {
    const fileContent = await fs.readFile(STATIC_NEWS_CONFIG_PATH, "utf8");
    EXTERNAL_STATIC_PAGE_URLS = JSON.parse(fileContent);
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
    return dateB - dateA; // 新しい順
  });

  // 4. ページング処理
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedArticles = allCombinedArticles.slice(startIndex, endIndex);

  // 5. 総件数 (結合された全記事の数)
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

// --- OPTIONS リクエストハンドラ (CORS対応) ---
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
