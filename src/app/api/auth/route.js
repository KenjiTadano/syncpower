// src/app/api/auth/route.js

import { NextResponse } from "next/server"; // Next.jsのNextResponseをインポート

import { writeFile, readFile } from "fs/promises"; // ファイル操作のためのfs/promisesモジュールをインポート

import path from "path"; // パス操作のためのpathモジュールをインポート

// 環境変数から client_id と client_secret を取得

const clientId = process.env.CLIENT_ID; // 環境変数からクライアントIDを取得

const clientSecret = process.env.CLIENT_SECRET; // 環境変数からクライアントシークレットを取得

const tokenCachePath = path.join(process.cwd(), ".token_cache.json"); // トークンキャッシュファイルのパス

async function getToken() {
  // トークンを取得する非同期関数

  try {
    // キャッシュされたトークンを読み込む

    const cachedToken = await readCachedToken(); // キャッシュされたトークンを読み込む

    if (cachedToken && cachedToken.token && new Date(cachedToken.expires_at) > new Date()) {
      // キャッシュされたトークンが存在し、有効期限が切れていない場合

      console.log("キャッシュされたトークンを使用:", cachedToken); // ログを出力

      return cachedToken; // キャッシュされたトークンを返す
    }

    // キャッシュがないか、期限切れの場合は新しいトークンを取得

    console.log("新しいトークンを取得..."); // ログを出力

    const newToken = await fetchTokenFromAPI(); // APIから新しいトークンを取得

    await cacheToken(newToken); // 新しいトークンをキャッシュ

    return newToken; // 新しいトークンを返す
  } catch (error) {
    // 例外が発生した場合

    console.error("トークン取得エラー:", error); // エラーログを出力

    throw error; // エラーをスロー
  }
}

async function readCachedToken() {
  // キャッシュされたトークンを読み込む非同期関数

  try {
    // ファイルからトークンを読み込む

    const data = await readFile(tokenCachePath, "utf-8"); // ファイルを読み込む

    return JSON.parse(data); // JSONとして解析して返す
  } catch (error) {
    // ファイルが存在しない場合や、読み込みエラーが発生した場合

    console.warn("トークンキャッシュの読み込みエラー:", error.message); // 警告ログを出力

    return null; // nullを返す
  }
}

async function cacheToken(tokenData) {
  // トークンをキャッシュする非同期関数

  try {
    // トークンをファイルに書き込む

    await writeFile(tokenCachePath, JSON.stringify(tokenData)); // ファイルに書き込む

    console.log("トークンをキャッシュ:", tokenData); // ログを出力
  } catch (error) {
    // 例外が発生した場合

    console.error("トークンキャッシュのエラー:", error); // エラーログを出力

    throw error; // エラーをスロー
  }
}

async function fetchTokenFromAPI() {
  // APIからトークンを取得する非同期関数

  const authEndpoint = "https://md.syncpower.jp/authenticate/v1/token"; // 認証エンドポイントURL

  const requestBody = new URLSearchParams({
    client_id: clientId, // クライアントIDを設定

    client_secret: clientSecret, // クライアントシークレットを設定
  });

  try {
    const response = await fetch(authEndpoint, {
      // APIリクエストを送信

      method: "POST", // POSTメソッドを指定

      headers: {
        "Content-Type": "application/x-www-form-urlencoded", // Content-Typeヘッダーを設定
      },

      body: requestBody, // リクエストボディを設定
    });

    if (!response.ok) {
      // HTTPステータスがエラーの場合

      const errorData = await response.json(); // エラーレスポンスをJSONとして解析

      console.error("APIエラー (HTTPステータス):", response.status, errorData); // エラーログを出力

      throw new Error(`APIエラー (HTTP ${response.status}): ${errorData.message || "詳細不明"}`); // エラーをスロー
    }

    const data = await response.json(); // レスポンスをJSONとして解析

    if (data.token && data.expires_at) {
      // トークンと有効期限が正常に取得できた場合

      console.log("APIからのトークン取得成功:", data); // ログを出力

      return data; // データを返す
    } else {
      // トークンまたは有効期限が不足している場合

      console.error("APIエラー: 不正なレスポンスデータ", data); // エラーログを出力

      throw new Error("APIエラー: 不正なレスポンスデータ"); // エラーをスロー
    }
  } catch (error) {
    // 例外が発生した場合

    console.error("APIリクエストエラー:", error); // エラーログを出力

    throw error; // エラーをスロー
  }
}

export async function GET() {
  // GETリクエストを処理する非同期関数

  try {
    // トークンを取得

    const tokenData = await getToken(); // トークンを取得

    // トークンをレスポンスとして返す

    return NextResponse.json(tokenData); // トークンをJSONとして返す
  } catch (error) {
    // エラーが発生した場合、エラーレスポンスを返す

    console.error("APIルートエラー:", error); // エラーログを出力

    return NextResponse.json({ message: error.message }, { status: 500 }); // エラーレスポンスを返す
  }
}
