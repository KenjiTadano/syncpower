// app/components/MyImage.js
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

export default function MyImage({ imageUrl, accessToken }) {
  const [imageBlob, setImageBlob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadImage() {
      if (!imageUrl || !accessToken) return;

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
        const objectURL = URL.createObjectURL(blob);
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
