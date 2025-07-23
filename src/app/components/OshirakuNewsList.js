"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Box, Typography, Card, CardContent, CardMedia, Stack, Link } from "@mui/material";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemButton from "@mui/material/ListItemButton";
import Divider from "@mui/material/Divider";
/* MUI ICON */
import NewspaperIcon from "@mui/icons-material/Newspaper";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos"; // MUI の ArrowForwardIosIcon コンポーネントをインポート

export default function OshirakuNewsList() {
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    async function fetchArticles() {
      try {
        const res = await axios.get("/api/oshiraku-news");
        setArticles(res.data);
      } catch (error) {
        console.error("記事の取得に失敗しました:", error);
      }
    }

    fetchArticles();
  }, []);

  return (
    <div>
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
          <h2>インタビュー・コラム</h2>
        </Stack>
      </Box>
      <Box
        sx={{
          backgroundColor: "#EDEDED", // 背景色をlightblueに設定
          padding: "12px",
        }}
      >
        <List>
          {articles.map((article, index) => (
            <React.Fragment key={index}>
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
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    padding: "0",
                  }}
                >
                  {/* サムネ画像 */}
                  {article.thumbnailImage?.url && <CardMedia component="img" image={article.thumbnailImage.url} alt={article.title} sx={{ width: 120, height: 80, objectFit: "cover" }} />}
                  {/* タイトル */}
                  <ListItemText
                    primary={
                      <Typography
                        sx={{ display: "block", fontSize: "10px", paddingLeft: "6px" }} // posted_at のスタイル
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {article.openDate}
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
                          {article.title}
                        </Typography>
                        {article.labelJa && (
                          <Typography
                            sx={{ display: "block", fontSize: "12px" }} // artist_name のスタイル
                            variant="body2"
                            color="text.secondary"
                          >
                            {article.labelJa}
                          </Typography>
                        )}
                      </React.Fragment>
                    }
                  />
                  <ListItemIcon sx={{ minWidth: "auto", pr: 1 }}>
                    {/* ListItemIcon コンポーネント (アイコンを表示) */}
                    <ArrowForwardIosIcon style={{ fontSize: "16px" }} />
                    {/* ArrowForwardIosIcon コンポーネント (アイコンを表示) */}
                  </ListItemIcon>
                </ListItemButton>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      </Box>
    </div>
  );
}
