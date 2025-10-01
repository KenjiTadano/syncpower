// Next.js (app/api/auth/route.js)
//
// 外部APIからトークンを取得・キャッシュし、GETリクエストで返すAPIルート
// 主要なロジックに詳細な日本語コメントを付けています

import { NextResponse } from "next/server"; // Next.jsのAPIレスポンスユーティリティ
import { URLSearchParams } from "url"; // x-www-form-urlencoded形式のbody生成用

// .envから認証情報を取得
const CLIENT_ID = process.env.SYNCPOWER_CLIENT_ID;
const CLIENT_SECRET = process.env.SYNCPOWER_CLIENT_SECRET;
// 認証APIのエンドポイント
const AUTH_URL = "https://md.syncpower.jp/authenticate/v1/token";

// トークンのキャッシュ変数
let cachedToken = null; // 取得済みトークン文字列
let tokenExpiry = 0; // 有効期限（UNIXタイムスタンプ[ミリ秒]）

// 外部APIから新しいトークンを取得する非同期関数
async function fetchTokenFromAPI() {
  console.log("新しいトークンを取得中...");
  try {
    // API仕様に合わせてクレデンシャルをエンコード（例: formエンコード）
    const params = new URLSearchParams();
    params.append("client_id", CLIENT_ID);
    params.append("client_secret", CLIENT_SECRET);

    // fetchでトークン取得リクエストを送信
    const response = await fetch(AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: params.toString(),
    });

    // レスポンスの内容をテキストで取得（デバッグ用にログ出力）
    const responseText = await response.text();
    console.log("外部APIレスポンスステータス:", response.status);
    console.log("外部APIレスポンスヘッダー Content-Type:", response.headers.get("Content-Type"));
    console.log("外部APIレスポンス生データ:", responseText.substring(0, 500));

    // HTTPステータスがエラー時の処理
    if (!response.ok) {
      let errorMessage = `外部認証APIエラー (HTTP ${response.status})`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage += `: ${errorData.message || JSON.stringify(errorData)}`;
      } catch (e) {
        errorMessage += `: レスポンスがJSONではありません: ${responseText.substring(0, 200)}...`;
      }
      console.error("トークン取得失敗:", errorMessage);
      throw new Error(errorMessage);
    }

    // Content-Typeをチェックし、application/json以外ならエラー
    const contentType = response.headers.get("Content-Type");
    if (!contentType || !contentType.includes("application/json")) {
      const message = `外部認証APIエラー: 予期せぬContent-Type (${contentType}). JSONが期待されます。生データ: ${responseText.substring(0, 200)}...`;
      console.error(message);
      throw new Error(message);
    }

    // 正常時、テキスト→JSONパース
    const data = JSON.parse(responseText);

    // 必要なフィールドがあるか確認
    if (!data.token || !data.expires_at) {
      const message = "外部認証APIエラー: 不正なトークンレスポンスデータ (tokenまたはexpires_atがありません)";
      console.error(message, data);
      throw new Error(message);
    }

    // expires_at（ISO8601形式の日時文字列）をUNIXタイムスタンプ（ミリ秒）に変換
    const expiresAtMs = Date.parse(data.expires_at); // 例: 2025-10-01T05:40:43.253961+00:00

    // 返却オブジェクト（token本体・ISO文字列・UNIXタイムスタンプ）
    return {
      token: data.token,
      expires_at: data.expires_at, // 元の有効期限 (ISO8601文字列)
      expires_at_ts: expiresAtMs, // 有効期限タイムスタンプ (ms)
    };
  } catch (error) {
    console.error("トークン取得処理中にエラー:", error.message);
    throw error;
  }
}

// トークンキャッシュを活用しつつ取得する関数
async function getToken() {
  const now = Date.now();
  // まだ有効なキャッシュがあればそれを返す
  if (cachedToken && tokenExpiry > now) {
    console.log("キャッシュされたトークンを使用します。");
    return { token: cachedToken, expires_at: new Date(tokenExpiry).toISOString() };
  }
  // .env値未設定時の明示エラー
  if (!CLIENT_ID || !CLIENT_SECRET) {
    const message = "SYNCPOWER_CLIENT_ID または SYNCPOWER_CLIENT_SECRET が設定されていません。";
    console.error(message);
    throw new Error(message);
  }
  // 新しくトークンを取得し、キャッシュ
  try {
    const data = await fetchTokenFromAPI();
    cachedToken = data.token; // 新トークンをキャッシュ
    tokenExpiry = data.expires_at_ts; // 有効期限をUNIXタイムスタンプでキャッシュ
    console.log("新しいトークンを取得し、キャッシュしました。有効期限:", new Date(tokenExpiry).toISOString());
    // フロントにはtokenと有効期限（ISO8601形式）を返す
    return { token: cachedToken, expires_at: data.expires_at };
  } catch (error) {
    console.error("getToken関数内でトークン取得失敗:", error.message);
    throw error;
  }
}

// GETリクエスト受信時のAPIルート本体
export async function GET() {
  try {
    const tokenData = await getToken(); // トークン取得
    // 成功時は200でトークンと有効期限を返す
    return NextResponse.json(tokenData, { status: 200 });
  } catch (error) {
    // エラー検知時は詳細をログし、種類に応じたHTTPステータスで返す
    console.error("APIルート /api/auth でエラー:", error.message);
    let statusCode = 500;
    if (error.message.includes("SYNCPOWER_CLIENT_ID")) {
      statusCode = 400; // 環境変数未設定
    } else if (error.message.includes("認証APIエラー")) {
      statusCode = 401; // 外部API認証失敗
    } else if (error.message.includes("予期せぬContent-Type") || error.message.includes("不正なレスポンスデータ")) {
      statusCode = 502; // 外部APIレスポンス問題
    }
    return NextResponse.json({ message: `認証トークンの取得に失敗しました: ${error.message}` }, { status: statusCode });
  }
}
