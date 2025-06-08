// app/components/MusicNews.js
"use client";

import "../globals.css";
import Cookies from "js-cookie";
import Link from "next/link";
import { useEffect, useState } from "react";
import React from "react";
/* MUI ICON */
import NewspaperIcon from "@mui/icons-material/Newspaper";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

/* Mui */
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemButton from "@mui/material/ListItemButton";
import Divider from "@mui/material/Divider";
import MyImage from "./MyImage"; // MyImageコンポーネントをインポート

export default function MusicNews({ accessToken }) {
  const [musicNews, setMusicNews] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMusicNews = async () => {
      if (!accessToken) return;

      setLoading(true);
      setError("");

      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      try {
        const apiUrl = `/api/music-news?posted_at_from=${today}&offset=0&limit=5`;
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch music news");
        }

        const news = await response.json();
        setMusicNews(news.data || []);
      } catch (err) {
        setError(`Music news error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchMusicNews();

    console.log("accessToken stored in cookie:", Cookies.get("accessToken")); // Cookie の内容をログに出力
  }, [accessToken]);

  if (loading) return <p>Loading music news...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  /* コード部分 */
  return (
    <div>
      {/* タイトル帯部分*/}
      <Box
        sx={{
          backgroundImage: "url(images/base.png)", // 画像のURLに置き換えてください
          backgroundSize: "cover", // または 'contain', 'auto' など
          backgroundRepeat: "no-repeat",
          height: "50px", // 必要に応じて調整 (これはビューポートの高さ)
          width: "100%", // 必要に応じて調整
          maxWidth: "400px",
          color: "#ffffff",
          paddingInline: "12px",
          marginY: "12px",
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{
            justifyContent: "flex-start",
            alignItems: "center",
            padding: "0px,12px",
            height: "100%",
          }}
        >
          <NewspaperIcon sx={{ color: "white", fontSize: 32 }} />
          <h2>音楽ニュース</h2>
        </Stack>
      </Box>
      <Stack
        direction="row"
        sx={{
          justifyContent: "flex-end",
          alignItems: "center",
          paddingRight: "12px",
          marginBottom: "12px",
        }}
      >
        <Button variant="outlined" color="error" component={Link} href="/music-news/all">
          最新ニュースをもっと見る＞
        </Button>
      </Stack>
      <Box
        sx={{
          backgroundColor: "#EDEDED", // 背景色をlightblueに設定
          padding: "12px",
        }}
      >
        <List>
          {musicNews.map((news) => (
            <React.Fragment key={news.news_id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  backgroundColor: "#ffffff",
                  padding: "0",
                }}
              >
                <ListItemButton
                  component={Link}
                  href={`/music-news/${news.news_id}`}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    padding: "0",
                  }}
                >
                  {/* サムネイル画像 */}
                  {news.image_url && news.image_url.length > 0 && (
                    <Box sx={{ display: "flex", alignItems: "center", width: "90px", height: "60px", m: 1, overflow: "hidden", position: "relative" }}>
                      <MyImage imageUrl={news.image_url[0]} accessToken={accessToken} />
                    </Box>
                  )}
                  <ListItemText
                    primary={
                      <Typography
                        sx={{ display: "block", fontSize: "10px", paddingLeft: "6px" }} // posted_at のスタイル
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {news.posted_at}
                      </Typography>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography
                          variant="subtitle1"
                          style={{ fontSize: "16px", fontWeight: "normal" }} // news_title のスタイル
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: "2",
                            WebkitBoxOrient: "vertical",
                            wordBreak: "break-all",
                            paddingLeft: "6px",
                          }}
                        >
                          {news.news_title}
                        </Typography>
                        {news.artist_name && (
                          <Typography
                            sx={{ display: "block", fontSize: "12px" }} // artist_name のスタイル
                            variant="body2"
                            color="text.secondary"
                          >
                            アーティスト: {news.artist_name}
                          </Typography>
                        )}
                      </React.Fragment>
                    }
                  />
                  <ListItemIcon sx={{ minWidth: "auto", pr: 1 }}>
                    <ArrowForwardIosIcon style={{ fontSize: "16px" }} />
                  </ListItemIcon>
                </ListItemButton>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      </Box>
      {/* リストエリア */}
    </div>
  );
}
