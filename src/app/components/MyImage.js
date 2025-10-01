// app/components/MyImage.js

"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import Skeleton from "@mui/material/Skeleton";
import CardMedia from "@mui/material/CardMedia";
// キー接頭語と有効期限（秒）
const CACHE_PREFIX = "image-cache:";
const CACHE_EXPIRATION_SECONDS = 3600; // 1時間

export default function MyImage({
  imageUrl,
  accessToken,
  alt = "My Image", // alt を props から受け取る
  width = 600, // width を props から受け取る
  height = 400, // height を props から受け取る
  // objectFit, objectPosition なども必要に応じて追加
}) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // エラーステートを追加

  const loadImage = useCallback(async () => {
    if (!imageUrl || !accessToken) {
      setIsLoading(false);
      return;
    }

    const cacheKey = CACHE_PREFIX + btoa(imageUrl); // URLをBase64エンコードしてキーにする
    const now = new Date().getTime(); // 現在時刻 (ミリ秒)

    setIsLoading(true); // ロード開始時に必ず true に設定
    setError(null); // エラーをリセット

    // localStorage からキャッシュを試みる
    if (typeof window !== "undefined" && window.localStorage) {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          // キャッシュの有効期限をチェック
          if (now - timestamp < CACHE_EXPIRATION_SECONDS * 1000) {
            setImageSrc(data); // Base64 Data URL を直接使用
            setIsLoading(false);
            console.log(`[MyImage] Image loaded from localStorage cache: ${imageUrl}`);
            return; // キャッシュから読み込んだので、APIリクエストは不要
          } else {
            // キャッシュが期限切れの場合
            localStorage.removeItem(cacheKey); // 古いキャッシュを削除
            console.log(`[MyImage] Cache expired for: ${imageUrl}, fetching new.`);
          }
        } catch (e) {
          // JSON.parse が失敗した場合（キャッシュデータが不正な場合など）
          console.warn(`[MyImage] Invalid cache data for ${imageUrl}. Fetching new.`, e);
          localStorage.removeItem(cacheKey); // 不正なキャッシュを削除
        }
      }
    }

    // キャッシュがない、または期限切れの場合、フェッチ → Base64 に変換してキャッシュ
    try {
      console.log(`[MyImage] Fetching image via image-proxy: ${imageUrl}`);
      const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(imageUrl)}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }

      const blob = await response.blob();
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64Data = reader.result; // "data:mime/type;base64,..." 形式のData URL

        // localStorage に保存
        if (typeof window !== "undefined" && window.localStorage) {
          try {
            localStorage.setItem(
              cacheKey,
              JSON.stringify({
                data: base64Data,
                timestamp: new Date().getTime(), // 保存時のタイムスタンプ
              })
            );
            console.log(`[MyImage] Image saved to localStorage: ${imageUrl}`);
          } catch (e) {
            console.warn("Failed to save image to localStorage (might be full):", e);
            // 容量オーバーなどの場合、古いキャッシュをクリアするなどの対策も考えられる
          }
        }

        setImageSrc(base64Data);
        setIsLoading(false);
      };

      reader.onerror = (e) => {
        console.error("FileReader error:", e);
        setError("Failed to read image data."); // エラーを設定
        setIsLoading(false);
      };

      reader.readAsDataURL(blob); // Blob を Base64 Data URL として読み込む
    } catch (err) {
      console.error("Error loading image:", err);
      setError(err.message); // エラーを設定
      setIsLoading(false);
    }
  }, [imageUrl, accessToken]); // 依存配列に imageUrl と accessToken を含める

  useEffect(() => {
    loadImage();
  }, [loadImage]); // loadImage コールバックが変更されたら実行

  if (isLoading) {
    return (
      <Skeleton
        variant="rectangular"
        width="100%"
        height={height} // height も props から受け取る
        animation="wave"
      />
    );
  }

  if (error) {
    // エラー表示を追加
    return (
      <div
        style={{
          width: "100%",
          height: height, // エラー表示の高さも指定
          backgroundColor: "#fdd",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "red",
          fontSize: "12px",
          textAlign: "center",
        }}
      >
        Error: {error}
      </div>
    );
  }

  if (!imageSrc) {
    return null; // 画像ソースがない場合
  }

  return (
    /*  
    <Image
      src={imageSrc}
      alt={alt} // alt も props から受け取る
      width={width}
      height={height}
      style={{ width: "100%", maxWidth: "100%", height: "auto" }}
      loader={({ src }) => src}
      unoptimized={true}
      loading="lazy"
    />
    */
    <CardMedia
      component="img" // imgタグとして描画
      image={imageSrc} // 画像URL
      alt={alt} // 画像のaltテキスト
      sx={{
        width: 100, // 横幅
        height: 80, // 縦幅
        objectFit: "cover", // coverで中央トリミング
      }}
    />
  );
}
