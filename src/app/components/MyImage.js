"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import Skeleton from "@mui/material/Skeleton";

// キー接頭語（他のlocalStorageキーと区別するため）
const CACHE_PREFIX = "image-cache:";

export default function MyImage({ imageUrl, accessToken }) {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!imageUrl || !accessToken) return;

    const cacheKey = CACHE_PREFIX + imageUrl;

    // localStorage にキャッシュがあるか確認
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      setImageSrc(cachedData);
      setIsLoading(false);
      return;
    }

    // なければフェッチ → Base64 に変換してキャッシュ
    async function loadImage() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(imageUrl)}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }

        const blob = await response.blob();

        // Blob → Base64 変換
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Data = reader.result;
          localStorage.setItem(cacheKey, base64Data); // キャッシュ保存
          setImageSrc(base64Data);
          setIsLoading(false);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("Error loading image:", error);
        setIsLoading(false);
      }
    }

    loadImage();
  }, [imageUrl, accessToken]);

  if (isLoading) {
    return <Skeleton variant="rectangular" width="100%" height={100} animation="wave" />;
  }

  if (!imageSrc) {
    return null;
  }

  return <Image src={imageSrc} alt="My Image" width={600} height={400} style={{ width: "100%", maxWidth: "100%", height: "auto" }} loader={({ src }) => src} unoptimized={true} loading="lazy" />;
}
