// app/api/oshiraku-news/route.js

import { NextResponse } from "next/server";
import axios from "axios";

const ALLOWED_ORIGIN = "https://syncpower.vercel.app";

export async function GET() {
  try {
    const response = await axios.get("https://rdc-api-catalog-gateway-api.rakuten.co.jp/oshiraku/search/v1/article", {
      headers: {
        apikey: process.env.OSHIRAKU_API_KEY,
      },
      params: {
        oshTagId: 1,
        page: 1,
        pageSize: 10,
        sortType: "opendate",
      },
    });

    return new NextResponse(JSON.stringify(response.data.articles), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Oshiraku API取得失敗:", error);
    return new NextResponse(JSON.stringify({ error: "取得失敗" }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      },
    });
  }
}

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
