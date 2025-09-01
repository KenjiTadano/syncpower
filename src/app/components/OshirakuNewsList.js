// app/components/OshirakuNewsList.js

"use client";

import TitleImage from "./parts/TitleImage.js";
import React, { useEffect, useState } from "react";
// import axios from "axios"; // axios は不要になるのでコメントアウトまたは削除
import Link from "next/link"; // Next.js の Link コンポーネントをインポート

import {
  Container,
  Box,
  Paper,
  Typography,
  CardMedia,
  Stack,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  CircularProgress,
  Divider,
  Button, // 「もっと見る」ボタン用に Button を追加
} from "@mui/material";

/* MUI ICON */
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const DISPLAY_LIMIT = 10; // トップページに表示する記事数

export default function OshirakuNewsList() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0); // 総記事数を保持するstateを追加

  useEffect(() => {
    async function fetchCombinedNews() {
      setLoading(true);
      setError(null);

      try {
        // 新しい統合APIを呼び出す
        const response = await fetch(`/api/interview-column?page=1&pageSize=${DISPLAY_LIMIT}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `記事の取得に失敗しました: ${response.statusText}`);
        }

        const data = await response.json();
        setArticles(data.articles || []);
        setTotalCount(data.total_count || 0); // 総記事数をセット
        setError(data.error || null); // APIからのエラーメッセージもセット
      } catch (err) {
        console.error("インタビュー・コラム記事の取得に失敗しました:", err);
        setError(`記事の読み込み中に予期せぬエラーが発生しました: ${err.message}`);
        setArticles([]); // エラー時は記事をクリア
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    }

    fetchCombinedNews();
  }, []); // 依存配列は空で、コンポーネントマウント時に一度だけ実行

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
        <CircularProgress />
      </Box>
    );
  }

  // エラーがあり、かつ記事が1件も取得できなかった場合
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
            height: "auto",
            width: "100%",
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

        {/* APIからエラーが返され、かつ記事が一部でも表示されている場合（例えば推し楽はOKだが静的記事がエラーの場合） */}
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
                                sx={{
                                  fontSize: "10px",
                                  height: "18px",
                                  lineHeight: "18px",
                                  "& .MuiChip-label": {
                                    padding: "0 8px",
                                    color: "#232c47",
                                  },
                                  backgroundColor: "#b898bc",
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

        {/* 「もっと見る」ボタン */}
        {totalCount > DISPLAY_LIMIT && (
          <Stack
            direction="row"
            sx={{
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "12px",
              marginTop: "12px", // ボタンとリストの間に少しスペースを追加
            }}
          >
            <Button variant="outlined" color="error" component={Link} sx={{ width: "100%" }} href="/interview-column/all">
              インタビュー・コラムをもっと見る＞
            </Button>
          </Stack>
        )}
      </Container>
    </div>
  );
}
