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
        <div
          style={{
            width: "100%",
            paddingTop: "56.25%", // 16:9 aspect ratio
            backgroundColor: "#eee",
            position: "relative",
          }}
        />
      ) : (
        imageBlob && (
          <div style={{ position: "relative", width: "100%", paddingTop: "56.25%" }}>
            <Image
              src={imageBlob}
              alt="My Image"
              fill
              style={{
                objectFit: "cover",
                borderRadius: "2px",
              }}
              loader={({ src }) => src}
              unoptimized
            />
          </div>
        )
      )}
    </>
  );
}
