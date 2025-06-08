// app/components/MyImage.js
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

const imageCache = new Map();

export default function MyImage({ imageUrl, accessToken }) {
  const [imageBlob, setImageBlob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!imageUrl || !accessToken) return;

    async function loadImage() {
      setIsLoading(true);

      if (imageCache.has(imageUrl)) {
        setImageBlob(imageCache.get(imageUrl));
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(imageUrl)}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

        const blob = await response.blob();
        const objectURL = URL.createObjectURL(blob);
        imageCache.set(imageUrl, objectURL);
        setImageBlob(objectURL);
      } catch (error) {
        console.error("Error loading image:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadImage();

    // クリーンアップでObjectURLを破棄しない（キャッシュ保持のため）
  }, [imageUrl, accessToken]);

  if (isLoading) {
    return <div style={{ width: "100%", height: "100px", backgroundColor: "#eee" }}>Loading...</div>;
  }

  if (!imageBlob) {
    return null;
  }

  return <Image src={imageBlob} alt="My Image" width={600} height={400} style={{ width: "100%", maxWidth: "100%", height: "auto" }} loader={({ src }) => src} unoptimized={true} loading="lazy" />;
}
