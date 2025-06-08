// app/api/music-news/[news_id]/route.js
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { news_id } = params; // URLパラメータから news_id を取得
  const accessToken = request.headers.get("Authorization")?.split(" ")[1]; // Authorizationヘッダーからアクセストークンを取得

  if (!accessToken) {
    return NextResponse.json(
      { message: "認証トークンが必要です" },
      { status: 401 }
    ); // アクセストークンがない場合はエラーを返す
  }

  try {
    const apiUrl = `https://md.syncpower.jp/api/v1/data/music_news?news_id=${news_id}&offset=0&limit=1`; // 特定のニュースを取得するためのAPI URL

    console.log(`APIからデータを取得中: ${apiUrl}`); // API URLをログに出力

    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`, // Authorizationヘッダーにアクセストークンを設定
        "Content-Type": "application/json", // リクエストのContent-TypeをJSONに設定
        Accept: "application/json", // レスポンスとしてJSONを明示的に要求
      },
    });

    console.log(`レスポンスステータス: ${res.status}`); // レスポンスステータスをログに出力

    if (!res.ok) {
      // エラーレスポンスの内容をテキストとして取得
      const errorText = await res.text();
      console.error(
        "APIエラー (HTTPステータス):",
        res.status,
        "レスポンス内容:",
        errorText
      );

      return NextResponse.json(
        {
          error: "音楽ニュースの取得に失敗しました",
          details: `HTTP ${res.status}: ${errorText}`,
        },
        { status: res.status }
      );
    }

    const contentType = res.headers.get("Content-Type");
    console.log(`Content-Type: ${contentType}`); // Content-Typeをログに出力

    try {
      const data = await res.json(); // JSONとしてレスポンスを解析
      return NextResponse.json(data); // 解析したデータをJSONとして返す
    } catch (jsonError) {
      // JSONパースエラーが発生した場合
      console.error("JSON解析エラー:", jsonError);
      return NextResponse.json(
        {
          error: "JSONデータの解析に失敗しました",
          details: jsonError.message,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("サーバーエラー:", error);
    return NextResponse.json(
      { error: "サーバーエラー: " + error.message },
      { status: 500 }
    );
  }
}
