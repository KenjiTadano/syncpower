// app/api/image-proxy/route.js
import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");
    // リクエストヘッダーから Authorization ヘッダーを取得
    const accessToken = request.headers.get("authorization")?.split(" ")[1];

    if (!imageUrl) {
      return new NextResponse(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    if (!accessToken) {
      return new NextResponse(
        JSON.stringify({ error: "Authorization token is required" }),
        {
          status: 401,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const imageResponse = await axios.get(imageUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      responseType: "arraybuffer",
    });

    const imageBuffer = imageResponse.data;

    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": imageResponse.headers["content-type"] || "image/*",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return new NextResponse(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}
