// App/api/music-news/route.js
// 音楽ニュース取得API（サーバールート）
import { NextResponse } from "next/server";

// ✅ formatDate関数を最初に定義（YYYY-MM-DD形式に変換）
function formatDate(date) {
  return date.toISOString().split("T")[0];
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // 今日の日付（例: 2025-05-24）
    const today = new Date();
    // 今日から1ヶ月前の日付
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(today.getMonth() - 1);
    const posted_at_from = formatDate(oneMonthAgo); // 1ヶ月前
    const posted_at_to = formatDate(today); // 今日

    const offset = searchParams.get("offset") || 0;
    const limit = searchParams.get("limit") || 20; // デフォルトを20にする

    // トークン取得（/api/authを利用）
    const accessToken = request.headers.get("Authorization")?.split(" ")[1];

    // 音楽ニュースAPIへリクエスト
    const apiUrl = `https://md.syncpower.jp/api/v1/data/music_news?posted_at_from=${posted_at_from}&posted_at_to=${posted_at_to}&offset=${offset}&limit=${limit}`;
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`, // Authorizationヘッダーにトークンを設定
        "Content-Type": "application/json", // Content-Type  を明示的に指定
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "音楽ニュースの取得に失敗しました" }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "サーバーエラー: " + error.message }, { status: 500 });
  }
}
