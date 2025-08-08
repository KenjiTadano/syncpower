// app/components/OshirakuNewsList.js

"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

import { Box, Typography, CardMedia, Stack, Link, Chip } from "@mui/material";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemButton from "@mui/material/ListItemButton";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";

import NewspaperIcon from "@mui/icons-material/Newspaper";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

export default function OshirakuNewsList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAllNews() {
      setLoading(true);
      setError(null);

      let fetchedOshirakuArticles = [];
      let fetchedStaticArticles = [];
      let currentErrors = [];

      try {
        const oshirakuRes = await axios.get("/api/oshiraku-news");
        fetchedOshirakuArticles = (oshirakuRes.data || []).map((article) => ({
          ...article,
          id: article.articleId,
          type: "oshiraku",
          sortDate: article.openDate ? new Date(article.openDate) : new Date(0),
          displayDate: article.openDate ? new Date(article.openDate).toLocaleDateString() : "日付不明",
        }));
      } catch (err) {
        console.error("推し楽記事の取得に失敗しました:", err);
        currentErrors.push("推し楽ニュースの読み込みに失敗しました。");
      }

      try {
        const staticRes = await axios.get("/api/static-news");
        fetchedStaticArticles = (staticRes.data.staticNews || []).map((article) => ({
          ...article,
          id: article.id,
          type: "static",
          sortDate: article.publishDate ? new Date(article.publishDate) : new Date(0),
          displayDate: article.publishDate ? new Date(article.publishDate).toLocaleDateString() : "日付不明",
        }));
      } catch (err) {
        console.error("静的記事の取得に失敗しました:", err);
        currentErrors.push("楽天ミュージックの記事の読み込みに失敗しました。");
      }

      const combinedNews = [...fetchedOshirakuArticles, ...fetchedStaticArticles];

      combinedNews.sort((a, b) => {
        const dateA = a.sortDate instanceof Date && !isNaN(a.sortDate) ? a.sortDate.getTime() : 0;
        const dateB = b.sortDate instanceof Date && !isNaN(b.sortDate) ? b.sortDate.getTime() : 0;
        return dateB - dateA;
      });

      if (currentErrors.length > 0) {
        setError(currentErrors.join("\n"));
      }

      setArticles(combinedNews);
      setLoading(false);
    }

    fetchAllNews();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (articles.length === 0 && error) {
    return (
      <Box sx={{ p: 2, color: "error.main" }}>
        <Typography variant="h6">エラー:</Typography>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  return (
    <div>
      <Box
        sx={{
          backgroundImage: "url(images/base.png)",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          height: "50px",
          width: "100%",
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
          <h2>インタビュー・コラム</h2>
        </Stack>
      </Box>

      {error && articles.length > 0 && (
        <Box sx={{ p: 2, color: "warning.main", backgroundColor: "#fff3e0", borderLeft: "4px solid #ff9800", mb: 2 }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}

      {articles.length === 0 && !loading && !error && (
        <Box sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>
          <Typography>表示できるニュースがありません。</Typography>
        </Box>
      )}

      <Box
        sx={{
          backgroundColor: "#EDEDED",
          padding: "12px",
        }}
      >
        <List>
          {articles.map((article) => (
            <React.Fragment key={article.id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  backgroundColor: "#ffffff",
                  padding: "0",
                }}
              >
                <ListItemButton
                  component={Link}
                  href={article.url}
                  sx={{
                    display: "flex",
                    // ⭐ ここを center に戻す ⭐
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    width: "100%",
                    padding: "4px",
                    paddingRight: "18px",
                  }}
                >
                  {/* サムネイル画像部分 */}
                  {article.thumbnailImage?.url && (
                    <CardMedia
                      component="img"
                      image={article.thumbnailImage.url}
                      alt={article.title}
                      sx={{
                        width: 120,
                        height: 80,
                        objectFit: "cover",
                      }}
                    />
                  )}
                  {/* 記事のテキストコンテンツ部分 */}
                  <ListItemText
                    sx={{ flex: 1 }}
                    primary={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          width: "100%",
                          paddingLeft: "6px",
                        }}
                      >
                        <Typography sx={{ fontSize: "10px" }} component="span" variant="body2" color="text.primary">
                          {article.displayDate}
                        </Typography>

                        {/* バッジ */}
                        {article.type === "oshiraku" && (
                          <Chip
                            label="推し楽"
                            size="small"
                            color="primary"
                            sx={{
                              fontSize: "0.7rem",
                              height: "18px",
                              lineHeight: "18px",
                              "& .MuiChip-label": {
                                padding: "0 6px",
                              },
                            }}
                          />
                        )}
                        {article.type === "static" && (
                          <Chip
                            label="楽天ミュージック"
                            size="small"
                            sx={{
                              fontSize: "0.7rem",
                              height: "18px",
                              lineHeight: "18px",
                              "& .MuiChip-label": {
                                padding: "0 6px",
                                color: "#ffffff",
                              },
                              backgroundColor: "#bf0000",
                            }}
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography
                          variant="subtitle1"
                          style={{ fontSize: "16px", fontWeight: "normal" }}
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
                          {article.title}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                  {/* 右側のアイコン (矢印) */}
                  <ListItemIcon sx={{ minWidth: "auto", pr: 1 }}>
                    <ArrowForwardIosIcon style={{ fontSize: "16px" }} />
                  </ListItemIcon>
                </ListItemButton>
              </ListItem>
              {/* 各リストアイテムの下に区切り線を表示 */}
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      </Box>
    </div>
  );
}
