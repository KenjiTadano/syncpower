// src/app/api/today-what-day/route.js

import { NextResponse } from "next/server"; // Next.jsのNextResponseをインポート

const API_ENDPOINT = "https://md.syncpower.jp/api/v1/data/what_day"; // APIのエンドポイントURL

export async function GET(request) {
  // GETリクエストを処理する非同期関数

  const { searchParams } = new URL(request.url); // リクエストURLから検索パラメータを取得

  const day = searchParams.get("day"); // 日付パラメータを取得

  const article_type = searchParams.get("article_type"); // 記事タイプパラメータを取得

  const accessToken = request.headers.get("Authorization")?.split(" ")[1]; // Authorizationヘッダーからトークンを取得 ("Bearer <token>" からトークンを抽出)

  // 必須パラメータのチェック

  if (!day || !article_type) {
    // 日付または記事タイプパラメータがない場合

    return NextResponse.json(
      { message: "day と article_type は必須パラメータです" },
      { status: 400 }
    ); // エラーレスポンスを返す
  }

  if (!accessToken) {
    // 認証トークンがない場合

    return NextResponse.json(
      { message: "認証トークンが必要です" },
      { status: 401 }
    ); // エラーレスポンスを返す
  }

  try {
    const url = `${API_ENDPOINT}?day=${day}&article_type=${article_type}&offset=0&limit=20`; // APIリクエストURLを生成

    console.log("APIリクエストURL:", url); // APIリクエストURLをログに出力

    const response = await fetch(url, {
      // APIリクエストを送信

      headers: {
        Authorization: `Bearer ${accessToken}`, // Authorizationヘッダーにトークンを設定

        "Content-Type": "application/json", // Content-Type を明示的に指定
      },
    });

    if (!response.ok) {
      // HTTPステータスがエラーの場合

      const errorData = await response.json(); // エラーレスポンスをJSONとして解析

      console.error("APIエラー (HTTPステータス):", response.status, errorData); // エラーログを出力

      throw new Error(
        `APIエラー (HTTP ${response.status}): ${
          errorData.message || "詳細不明"
        }`
      ); // エラーをスロー
    }

    const data = await response.json(); // レスポンスをJSONとして解析

    // レスポンスデータの構造をチェック

    if (!data.api_name || !data.returned_count || !Array.isArray(data.data)) {
      // レスポンスデータの構造が不正な場合

      console.error("APIエラー: 不正なレスポンスデータ", data); // エラーログを出力

      throw new Error("APIエラー: 不正なレスポンスデータ"); // エラーをスロー
    }

    return NextResponse.json(data); // APIレスポンスをJSONとして返す
  } catch (error) {
    // 例外が発生した場合

    console.error("APIリクエストエラー:", error); // エラーログを出力

    return NextResponse.json({ message: error.message }, { status: 500 }); // エラーレスポンスを返す
  }
}
