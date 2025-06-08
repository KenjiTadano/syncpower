import { NextResponse } from "next/server";

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;

let cachedToken = null;

async function getToken() {
  if (cachedToken && cachedToken.token && new Date(cachedToken.expires_at) > new Date()) {
    console.log("キャッシュされたトークンを使用:", cachedToken);
    return cachedToken;
  }

  console.log("新しいトークンを取得...");
  const newToken = await fetchTokenFromAPI();
  cachedToken = newToken;
  return newToken;
}

async function fetchTokenFromAPI() {
  const authEndpoint = "https://md.syncpower.jp/authenticate/v1/token";

  const requestBody = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
  });

  try {
    const response = await fetch(authEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: requestBody,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("APIエラー (HTTPステータス):", response.status, errorData);
      throw new Error(`APIエラー (HTTP ${response.status}): ${errorData.message || "詳細不明"}`);
    }

    const data = await response.json();

    if (data.token && data.expires_at) {
      console.log("APIからのトークン取得成功:", data);
      return data;
    } else {
      console.error("APIエラー: 不正なレスポンスデータ", data);
      throw new Error("APIエラー: 不正なレスポンスデータ");
    }
  } catch (error) {
    console.error("APIリクエストエラー:", error);
    throw error;
  }
}

export async function GET() {
  try {
    const tokenData = await getToken();
    return NextResponse.json(tokenData);
  } catch (error) {
    console.error("APIルートエラー:", error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
