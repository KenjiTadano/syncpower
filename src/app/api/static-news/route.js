// app/api/static-news/route.js

import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import path from "path"; // ⭐ path モジュールをインポート ⭐
import { promises as fs } from "fs"; // ⭐ fs/promises をインポート ⭐

// ⭐ 設定ファイルのパスを定義 ⭐
// プロジェクトルートからの相対パスで指定します。
const CONFIG_FILE_PATH = path.join(process.cwd(), "config", "staticNewsUrls.json");

export async function GET(request) {
  let EXTERNAL_STATIC_PAGE_URLS = [];

  try {
    // ⭐ JSONファイルを読み込む ⭐
    const fileContent = await fs.readFile(CONFIG_FILE_PATH, "utf8");
    EXTERNAL_STATIC_PAGE_URLS = JSON.parse(fileContent);
    console.log(`[static-news API] Loaded ${EXTERNAL_STATIC_PAGE_URLS.length} URLs from config.`);
  } catch (readError) {
    console.error(`[static-news API] Failed to read or parse config file ${CONFIG_FILE_PATH}:`, readError);
    // ファイル読み込み失敗時は、空のリストで続行するか、エラーを返すか選択
    // ここではエラーを返し、APIが機能しないことを明確にする
    return NextResponse.json({ error: "Failed to load static news URLs configuration" }, { status: 500 });
  }

  try {
    const newsData = await Promise.all(
      EXTERNAL_STATIC_PAGE_URLS.map(async (pageUrl) => {
        let htmlContent = "";

        try {
          const response = await fetch(pageUrl);
          if (!response.ok) {
            console.warn(`[static-news API] Failed to fetch ${pageUrl}: HTTP Status ${response.status}`);
            return null;
          }
          htmlContent = await response.text();
        } catch (fetchError) {
          console.error(`[static-news API] Error fetching ${pageUrl}:`, fetchError.message);
          return null;
        }

        const $ = cheerio.load(htmlContent);

        const urlParts = pageUrl.split("/");
        // index.html の前のディレクトリ名を取得 (例: "column01")
        const id = urlParts[urlParts.length - 2];

        const title = $("title").text() || $("h1").first().text() || `No Title (${id})`;
        const description = $("p").first().text().substring(0, 100) + "..." || "No description available.";
        const publishDate = $('meta[name="date"]').attr("content") || null;

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
              console.warn(`[static-news API] Could not resolve thumbnail URL ${src} for ${pageUrl}:`, urlResolveError.message);
              thumbnailUrl = null;
            }
          }
        }

        return {
          id: id,
          type: "static",
          title: title,
          description: description,
          url: pageUrl,
          thumbnailImage: thumbnailUrl ? { url: thumbnailUrl } : null,
          publishDate: publishDate,
        };
      })
    );

    const filteredNewsData = newsData.filter((item) => item !== null);

    console.log(`[static-news API] Successfully processed ${filteredNewsData.length} static news items.`);
    return NextResponse.json({ staticNews: filteredNewsData });
  } catch (error) {
    console.error("Error fetching and parsing external static news:", error);
    return NextResponse.json({ error: "Failed to fetch external static news" }, { status: 500 });
  }
}
