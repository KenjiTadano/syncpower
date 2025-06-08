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
  }, [imageUrl, accessToken]);

  return (
    <>
      {isLoading ? (
        <div style={{ width: "100%", height: "100px", backgroundColor: "#eee" }}>Loading...</div>
      ) : (
        imageBlob && (
          <Image
            src={imageBlob}
            alt="My Image"
            width={600} // 元の比率を保つために、ここでは仮の値を設定
            height={400} // 元の比率を保つために、ここでは仮の値を設定
            style={{
              width: "100%",
              maxWidth: "100%", // BoxのmaxWidthに合わせる
              height: "auto", // height を auto に設定して比率を保持
            }}
            loader={({ src }) => src}
            unoptimized={true}
          />
        )
      )}
    </>
  );
}
