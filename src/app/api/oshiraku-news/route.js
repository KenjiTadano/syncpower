import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    const response = await axios.get("https://stg.gateway-api.rakuten.co.jp/oshiraku-org/search/v1/article", {
      headers: {
        apikey: process.env.OSHIRAKU_API_KEY,
      },
      params: {
        oshTagId: 17400,
        type: "original,rewrite",
        label: "feature,report,interview",
        page: 1,
        pageSize: 50,
      },
    });

    return NextResponse.json(response.data.articles);
  } catch (error) {
    console.error("Oshiraku API取得失敗:", error);
    return NextResponse.json({ error: "取得失敗" }, { status: 500 });
  }
}
