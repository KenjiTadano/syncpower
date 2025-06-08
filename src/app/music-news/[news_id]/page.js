"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MyImage from "../../components/MyImage";
/* MUI ICON */
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import IconButton from "@mui/material/IconButton";
/* Mui */
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import { Container } from "@mui/material";
import Chip from "@mui/material/Chip";

export default function MusicNewsDetail({ params }) {
  const { news_id } = params;
  const [newsItem, setNewsItem] = useState(null);
  const [error, setError] = useState(null);
  const router = useRouter();
  const [accessToken, setAccessToken] = useState(null); // Add state for the access token

  /* アクセストークンを取得処理 */
  useEffect(() => {
    // Fetch the access token first
    const fetchAccessToken = async () => {
      try {
        const response = await fetch("/api/auth"); // Assuming this route provides the token
        if (!response.ok) {
          throw new Error("Failed to fetch access token");
        }
        const data = await response.json();
        setAccessToken(data.token);
      } catch (error) {
        setError(error.message);
      }
    };

    fetchAccessToken();
  }, []);
  /* Newsの詳細をFetchで取得 */
  useEffect(() => {
    const fetchNewsDetail = async () => {
      if (!accessToken) return; // Don't fetch if token is not yet available

      try {
        const response = await fetch(`/api/music-news/${news_id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`, // Include the token in the header
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "ニュース詳細の取得に失敗しました");
        }
        const data = await response.json();

        if (data.data && data.data.length > 0) {
          setNewsItem(data.data[0]); // APIが配列を返すことを想定
          // API から取得したデータ全体をログに出力
          console.log("API レスポンス (全体):", data);
          // または、より詳細なオブジェクト構造を確認するために console.dir を使用
          console.dir(data, { depth: null });
        } else {
          setError("ニュースが見つかりませんでした");
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchNewsDetail();
  }, [news_id, accessToken]); // Re-run effect when news_id or accessToken changes

  if (error) {
    return (
      <div>
        <h1>エラー</h1>
        <p>{error}</p>
        <button onClick={() => router.back()}>戻る</button>
      </div>
    );
  }

  if (!newsItem) {
    return <div>ロード中...</div>;
  }

  // artist_name と artist_id を取得
  const artistName = newsItem.artist && newsItem.artist.length > 0 ? newsItem.artist[0].artist_name : "不明";
  const artistId = newsItem.artist && newsItem.artist.length > 0 ? newsItem.artist[0].artist_id : "不明";

  /* 画面表示部分 */
  return (
    <div>
      <Container
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          backgroundColor: "white",
          zIndex: 1000,
          justifyContent: "flex-start",
          alignItems: "center",
          padding: "12px",
          background: "#ffffff",
        }}
      >
        <Stack direction={"row"} spacing={3} sx={{ width: "100%" }}>
          {" "}
          {/* Stack に width: 100% を追加 */}
          <IconButton color="#666666" aria-label="" onClick={() => router.back()}>
            <ArrowBackIosNewIcon />
          </IconButton>
          <Typography
            sx={{
              display: "block",
              fontSize: "16px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              // display: "flex",  flexbox は不要なので削除
              // alignItems: "center",  flexbox を削除したので不要
              width: "100%", // Typography に width を追加
            }}
          >
            {newsItem.news_title}
          </Typography>
        </Stack>
      </Container>

      <Container
        sx={{
          backgroundColor: "#EDEDED", // 背景色をlightblueに設定
          padding: "12px",
          marginTop: "60px",
        }}
      >
        <Card
          sx={{
            padding: "12px",
          }}
        >
          <Stack spacing={3}>
            <Stack spacing={1}>
              <Typography
                sx={{
                  fontSize: "20px",
                  fontWeight: "900",
                  lineHeight: "140%",
                }}
              >
                {newsItem.news_title}
              </Typography>
              <Typography
                sx={{
                  fontSize: "10px",
                  marginY: "2px",
                  color: "#666666",
                }}
              >
                投稿日: {newsItem.posted_at}
              </Typography>
              <Chip label={`${newsItem.news_genre_name}`} sx={{ width: "fit-content" }} /> {/* Chipで表示 */}
            </Stack>
            {/* 画像とキャプション */}
            <Stack spacing={0}>
              {newsItem.image_url && newsItem.image_url.length > 0 && <MyImage imageUrl={newsItem.image_url[0]} accessToken={accessToken} />}
              <Typography
                sx={{
                  fontSize: "10px",
                  marginY: "2px",
                  textAlign: "right",
                  color: "#666666",
                }}
              >
                {" "}
                {newsItem.image_caption}
              </Typography>
            </Stack>
            {/* タイトル */}
            <Stack>
              <span dangerouslySetInnerHTML={{ __html: newsItem.news }} />
            </Stack>
            <Stack direction={"row"} spacing={3}>
              <p>{newsItem.news_genre_name}</p>
              <p>{newsItem.media_genre_name}</p>
            </Stack>
            {/* アーティスト名とアーティストID を表示 */}
            <p>関連ワード：</p>

            {newsItem.artist &&
              newsItem.artist.map((artist, index) => (
                <div key={index}>
                  <p>{artist.artist_name}</p>
                </div>
              ))}
          </Stack>
        </Card>
      </Container>
    </div>
  );
}
