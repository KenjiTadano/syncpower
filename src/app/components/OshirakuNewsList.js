// app/components/OshirakuNewsList.js

"use client";
import TitleImage from "./parts/TitleImage.js";
import React, { useEffect, useState } from "react";
import axios from "axios";

import { Container, Box, Paper, Typography, CardMedia, Stack, Link, Chip, List, ListItem, ListItemText, ListItemIcon, ListItemButton, CircularProgress, Divider } from "@mui/material";

/* MUI ICON */
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
      <Container
        maxWidth={false}
        sx={{
          width: "100%",
          paddingTop: "24px",
        }}
      >
        <Box
          sx={{
            height: "auto", // 必要に応じて調整 (これはビューポートの高さ)
            width: "100%", // 必要に応じて調整
            color: "#000000",
            marginTop: "12px",
            padding: "0px,12px",
          }}
        >
          <Stack direction="row" spacing={1} sx={{ paddingLeft: "12px!important" }}>
            <TitleImage />
            <Stack direction="column" spacing={2}>
              <Typography noWrap sx={{ fontSize: "12px" }}>
                Interview / Column
              </Typography>
              <Typography noWrap sx={{ marginTop: "0!important", fontSize: "20px", fontWeight: "900" }}>
                インタビュー・コラム
              </Typography>
            </Stack>
          </Stack>
        </Box>

        {/* 説明文 */}
        <Typography py={1} sx={{ fontSize: "14px", textAlign: "center" }}>
          エンタメ関連のインタビュー記事をご紹介
        </Typography>

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
        {/* リスト表示部分 */}
        <Paper
          variant="outlined"
          elevation={3}
          sx={{
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <List
            sx={{
              padding: "0",
            }}
          >
            {articles.map((article) => (
              <React.Fragment
                key={article.id}
                sx={{
                  padding: "0",
                }}
              >
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
                      padding: "8px",
                    }}
                  >
                    {/* サムネイル画像部分 */}
                    {article.thumbnailImage?.url && (
                      <CardMedia
                        component="img"
                        image={article.thumbnailImage.url}
                        alt={article.title}
                        sx={{
                          width: 100,
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
                          <Box
                            sx={{
                              display: "flex",
                              width: "100%",
                              paddingLeft: "6px",
                            }}
                          >
                            {/* バッジ */}
                            {article.type === "oshiraku" && (
                              <Chip
                                label="推し楽"
                                size="small"
                                color="primary"
                                sx={{
                                  fontSize: "10px",
                                  height: "18px",
                                  lineHeight: "18px",
                                  "& .MuiChip-label": {
                                    padding: "0 8px",
                                  },
                                }}
                              />
                            )}
                            {article.type === "static" && (
                              <Chip
                                label="楽天ミュージック"
                                size="small"
                                sx={{
                                  fontSize: "10px",
                                  height: "18px",
                                  lineHeight: "18px",
                                  "& .MuiChip-label": {
                                    padding: "0 8px",
                                    color: "#ffffff",
                                  },
                                  backgroundColor: "#bf0000",
                                }}
                              />
                            )}
                          </Box>
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
                <Divider variant="middle" sx={{ borderStyle: "dashed", margin: "0" }} />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Container>
      {/* タイトル部分 */}
    </div>
  );
}
