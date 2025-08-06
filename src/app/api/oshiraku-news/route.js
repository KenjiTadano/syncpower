import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    const response = await axios.get("https://rdc-api-catalog-gateway-api.rakuten.co.jp/oshiraku/search/v1/article", {
      headers: {
        apikey: process.env.OSHIRAKU_API_KEY,
      },
      params: {
        oshTagId: 1,
        type: "original,rewrite",
        label: "feature,report,interview",
        page: 1,
        pageSize: 50,
      },
    });

    // ✅ CORSヘッダーを付けてレスポンスを返す
    return new NextResponse(JSON.stringify(response.data.articles), {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "https://syncpower-tadanokenjis-projects.vercel.app/", // ← 任意のドメインを許可する場合は "*" でなく限定も可
        "Access-Control-Allow-Methods": "GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      },
    });
  } catch (error) {
    console.error("Oshiraku API取得失敗:", error);
    return new NextResponse(JSON.stringify({ error: "取得失敗" }), {
      status: 500,
      headers: {
        "Access-Control-Allow-Origin": "https://syncpower-tadanokenjis-projects.vercel.app/",
      },
    });
  }
}
