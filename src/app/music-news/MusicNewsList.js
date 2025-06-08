// app/music-news/MusicNewsList.js
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemButton from "@mui/material/ListItemButton";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import Box from "@mui/material/Box";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import Typography from "@mui/material/Typography";
import MyImage from "../components/MyImage"; // MyImageコンポーネントをインポート

const MusicNewsList = ({ offset, limit }) => {
  const [musicNews, setMusicNews] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(null); // アクセストークンを保持するstateを追加

  useEffect(() => {
    const fetchMusicNews = async () => {
      setLoading(true);
      setError(null);

      try {
        // アクセストークンを取得
        const tokenResponse = await fetch("/api/auth");
        if (!tokenResponse.ok) {
          throw new Error("Failed to fetch access token");
        }
        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.token;

        if (!accessToken) {
          throw new Error("Access token not found");
        }

        setAccessToken(accessToken); // アクセストークンをstateに保存

        const apiUrl = `/api/music-news?offset=${offset}&limit=${limit}`;
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
  }, [offset, limit]);

  if (loading) return <p>Loading music news...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <Box>
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
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  padding: "0",
                }}
              >
                {/* サムネイル画像 */}
                {news.image_url && news.image_url.length > 0 && (
                  <Box sx={{ width: "50px", height: "50px", mr: 1, overflow: "hidden" }}>
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
  );
};

export default MusicNewsList;
