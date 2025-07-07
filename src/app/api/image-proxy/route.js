// app/api/image-proxy/route.js

import { NextResponse } from "next/server"; // Next.js の NextResponse をインポート

export async function GET(request) {
  // GET リクエストを処理する関数
  const { searchParams } = new URL(request.url); // リクエスト URL から検索パラメータを取得
  const imageUrl = searchParams.get("url"); // URL パラメータから画像の URL を取得
  const accessToken = request.headers.get("Authorization")?.split(" ")[1]; // リクエストヘッダーからアクセストークンを取得

  if (!imageUrl || !accessToken) {
    // 画像 URL またはアクセストークンが存在しない場合
    return NextResponse.json({ message: "url と accessToken は必須パラメータです" }, { status: 400 }); // エラーレスポンスを返す (HTTP 400 Bad Request)
  }

  try {
    // 画像の取得を試みる
    const response = await fetch(imageUrl, {
      // 画像 URL から画像を取得
      headers: {
        Authorization: `Bearer ${accessToken}`, // Authorization ヘッダーにアクセストークンを設定
      },
    });

    if (!response.ok) {
      // レスポンスがエラーの場合
      throw new Error(`Failed to fetch image: ${response.status}`); // エラーをスロー
    }

    const blob = await response.blob(); // レスポンスを Blob として取得

    // レスポンスヘッダーを設定
    const headers = new Headers(); // 新しい Headers オブジェクトを作成
    headers.append("Content-Type", blob.type); // Content-Type ヘッダーを設定 (Blob の型を使用)
    headers.append("Cache-Control", "public, max-age=31536000"); // Cache-Control ヘッダーを設定 (1年間キャッシュ)

    return new NextResponse(blob, {
      // 新しい NextResponse オブジェクトを作成
      status: 200, // HTTP ステータスコード 200 OK
      headers: headers, // ヘッダーを設定
    });
  } catch (error) {
    // エラーが発生した場合
    console.error("APIリクエストエラー:", error); // エラーをコンソールに出力
    return NextResponse.json({ message: error.message }, { status: 500 }); // エラーレスポンスを返す (HTTP 500 Internal Server Error)
  }
}
