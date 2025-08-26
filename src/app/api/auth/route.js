// app/api/auth/route.js

import { NextResponse } from "next/server";

const CLIENT_ID = process.env.SYNCPOWER_CLIENT_ID;
const CLIENT_SECRET = process.env.SYNCPOWER_CLIENT_SECRET;
const AUTH_URL = "https://md.syncpower.jp/authenticate/v1/token";

let cachedToken = null;
let tokenExpiry = 0; // UNIXタイムスタンプ (ミリ秒)

async function fetchTokenFromAPI() {
  console.log("新しいトークンを取得中...");
  try {
    const response = await fetch(AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    // レスポンスの生データを取得し、ログに出力
    const responseText = await response.text();
    console.log("外部APIレスポンスステータス:", response.status);
    console.log("外部APIレスポンスヘッダー Content-Type:", response.headers.get("Content-Type"));
    console.log("外部APIレスポンス生データ:", responseText.substring(0, 500)); // 長すぎる場合は一部のみ

    if (!response.ok) {
      // HTTPステータスがエラーの場合
      let errorMessage = `外部認証APIエラー (HTTP ${response.status})`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage += `: ${errorData.message || JSON.stringify(errorData)}`;
      } catch (e) {
        errorMessage += `: レスポンスがJSONではありません: ${responseText.substring(0, 200)}...`;
      }
      console.error("トークン取得失敗:", errorMessage);
      // ここでエラーをスローして、GET関数でキャッチさせる
      throw new Error(errorMessage);
    }

    // Content-Type が JSON でない場合もエラー
    const contentType = response.headers.get("Content-Type");
    if (!contentType || !contentType.includes("application/json")) {
      const message = `外部認証APIエラー: 予期せぬContent-Type (${contentType}). JSONが期待されます。生データ: ${responseText.substring(0, 200)}...`;
      console.error(message);
      throw new Error(message);
    }

    const data = JSON.parse(responseText); // テキストからJSONをパース

    if (!data.token || !data.expires_at) {
      const message = "外部認証APIエラー: 不正なトークンレスポンスデータ (tokenまたはexpires_atがありません)";
      console.error(message, data);
      throw new Error(message);
    }

    return data;
  } catch (error) {
    console.error("トークン取得処理中にエラー:", error.message);
    // ここでエラーを再スローし、GET関数でキャッチさせる
    throw error;
  }
}

async function getToken() {
  const now = Date.now();

  // キャッシュされたトークンがあり、まだ有効期限内の場合
  if (cachedToken && tokenExpiry > now) {
    console.log("キャッシュされたトークンを使用します。");
    return { token: cachedToken, expires_at: tokenExpiry };
  }

  // クライアントIDまたはシークレットが設定されていない場合のエラーハンドリング
  if (!CLIENT_ID || !CLIENT_SECRET) {
    const message = "SYNCPOWER_CLIENT_ID または SYNCPOWER_CLIENT_SECRET が設定されていません。";
    console.error(message);
    // 環境変数エラーの場合は、認証APIを叩かずに直接エラーを返す
    throw new Error(message);
  }

  try {
    const data = await fetchTokenFromAPI();
    cachedToken = data.token;
    // expires_at は秒単位で返されるので、ミリ秒に変換して現在時刻に加算
    tokenExpiry = now + data.expires_at * 1000;
    console.log("新しいトークンを取得し、キャッシュしました。有効期限:", new Date(tokenExpiry).toISOString());
    return { token: cachedToken, expires_at: tokenExpiry };
  } catch (error) {
    // トークン取得に失敗した場合、エラーをスロー
    console.error("getToken関数内でトークン取得失敗:", error.message);
    throw error; // GET 関数でキャッチさせる
  }
}

export async function GET() {
  try {
    const tokenData = await getToken();
    // 成功時はトークンと有効期限を返す
    return NextResponse.json(tokenData, { status: 200 });
  } catch (error) {
    // トークン取得に失敗した場合、より詳細なエラーメッセージと適切なステータスコードを返す
    console.error("APIルート /api/auth でエラー:", error.message);

    // エラーメッセージに基づいてステータスコードを推測
    let statusCode = 500; // デフォルトはサーバーエラー
    if (error.message.includes("SYNCPOWER_CLIENT_ID")) {
      statusCode = 400; // Bad Request (設定ミス)
    } else if (error.message.includes("認証APIエラー")) {
      statusCode = 401; // Unauthorized (外部APIからの認証失敗)
    } else if (error.message.includes("予期せぬContent-Type") || error.message.includes("不正なレスポンスデータ")) {
      statusCode = 502; // Bad Gateway (外部APIのレスポンスが不正)
    }

    return NextResponse.json({ message: `認証トークンの取得に失敗しました: ${error.message}` }, { status: statusCode });
  }
}
