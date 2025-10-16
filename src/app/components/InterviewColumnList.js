// app/components/InterviewColumnList.js

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link"; // Next.js の Link コンポーネントをインポート

// MUI コンポーネント
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  Box,
  Typography,
  CardMedia, // サムネイル画像表示用
  Chip, // バッジ表示用
  LinearProgress, // ローディング表示用
} from "@mui/material";

// MUI Icon
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

/**
 * インタビュー・コラム記事のリストを表示するコンポーネント
 * @param {object} props - プロパティ
 * @param {number} props.page - 現在のページ番号 (1から始まる)
 * @param {number} props.pageSize - 1ページあたりの記事数
 * @param {function} props.onTotalArticlesChange - 総記事数を親コンポーネントに伝えるコールバック関数
 */
const InterviewColumnList = ({ page, pageSize, onTotalArticlesChange }) => {
  const [articles, setArticles] = useState([]); // 記事データを保持する state
  const [error, setError] = useState(null); // エラーメッセージを保持する state
  const [loading, setLoading] = useState(true); // ローディング状態を保持する state

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true); // ローディング状態を true に設定
      setError(null); // エラーメッセージを null に設定
      setArticles([]); // データをクリア

      try {
        const apiUrl = `/api/interview-column?page=${page}&pageSize=${pageSize}`;
        const response = await fetch(apiUrl);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `記事の取得に失敗しました: ${response.statusText}`);
        }

        const data = await response.json();

        // 取得した記事データを state に設定
        setArticles(data.articles || []);
        // 親コンポーネントに総記事数を伝える
        onTotalArticlesChange(data.total_count || 0);
        // APIからのエラーメッセージもセット (部分的なエラーの場合など)
        setError(data.error || null);
      } catch (err) {
        console.error("インタビュー・コラム記事の取得中に問題が発生しました:", err);
        setError(`記事の読み込み中に予期せぬエラーが発生しました: ${err.message}`);
        setArticles([]); // エラー時は記事データをクリア
        onTotalArticlesChange(0); // エラー時は総記事数も0にリセット
      } finally {
        setLoading(false); // 処理の最後にローディング状態を false に設定
      }
    };

    fetchArticles(); // 記事データを取得する関数を呼び出す
  }, [page, pageSize, onTotalArticlesChange]); // 依存配列に page, pageSize, onTotalArticlesChange を指定

  if (loading) {
    return <LinearProgress sx={{ mt: 2 }} />; // ローディング状態の場合、LinearProgress コンポーネントを表示
  }

  return (
    <Box>
      {/* エラーメッセージを警告として表示 */}
      {error && (
        <Box sx={{ p: 2, mb: 2, backgroundColor: "#fff3e0", borderLeft: "4px solid #ff9800", color: "#ff9800" }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}

      {/* 記事データがある場合のみリストを表示 */}
      {articles.length > 0 ? (
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
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    padding: "4px",
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
      ) : (
        // 記事データがない場合（エラーまたはデータなし）
        !error && ( // エラーメッセージが表示されている場合は重複して表示しない
          <Typography sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>表示できる記事がありません。</Typography>
        )
      )}
    </Box>
  );
};

export default InterviewColumnList;
