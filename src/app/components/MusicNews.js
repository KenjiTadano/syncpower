// app/components/MusicNews.js

"use client";
//コンポーネントパーツ
import TitleImage from "./parts/TitleImage.js";
import "../globals.css";
import Cookies from "js-cookie";
import Link from "next/link";
import { useEffect, useState } from "react";
import React from "react";
/* MUI ICON */
import NewspaperIcon from "@mui/icons-material/Newspaper";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import LibraryMusicIcon from "@mui/icons-material/LibraryMusic";

/* Mui */
import { Container, Paper } from "@mui/material";
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
      if (!accessToken) {
        setLoading(false);
        // トークンがない場合はエラーとして表示せず、単にデータ取得をスキップ
        // 必要であればsetError("認証トークンがありません。"); とすることも可能
        return;
      }

      setLoading(true);
      setError(""); // 新しいフェッチの前にエラーをリセット

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
          // APIリクエストは失敗したが、コンポーネント全体をエラー画面にしない
          // エラーメッセージをセットし、newsデータは空にするか、以前のものを保持
          setError(`音楽ニュースの取得に失敗しました: ${errorData.error || response.statusText}`);
          setMusicNews([]); // データをクリアして「表示できるニュースがありません」状態にする
        } else {
          const news = await response.json();
          setMusicNews(news.data || []);
        }
      } catch (err) {
        // ネットワークエラーなどの予期せぬエラー
        setError(`音楽ニュースの取得中に予期せぬエラーが発生しました: ${err.message}`);
        setMusicNews([]); // データをクリア
      } finally {
        setLoading(false);
      }
    };

    fetchMusicNews();

    console.log("accessToken stored in cookie:", Cookies.get("accessToken")); // Cookie の内容をログに出力
  }, [accessToken]);

  // ローディング中はプログレスバーなどを表示
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100px" }}>
        <Typography>Loading music news...</Typography>
        {/* または CircularProgress など */}
      </Box>
    );
  }

  /* コード部分 */
  return (
    <div>
      <Container
        maxWidth={false}
        sx={{
          paddingTop: "24px",
        }}
      >
        {/* タイトル帯部分*/}
        <Box
          sx={{
            height: "auto", // 必要に応じて調整 (これはビューポートの高さ)
            width: "100%", // 必要に応じて調整
            color: "#000000",
            marginTop: "12px",
            padding: "0px,12px",
          }}
        >
          {/* タイトル部分 */}
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{
              padding: "0px,12px",
              gap: "12px",
            }}
          >
            <Stack direction="row" spacing={1} sx={{ paddingLeft: "12px!important" }}>
              <TitleImage />
              <Stack direction="column" spacing={2}>
                <Typography noWrap sx={{ fontSize: "12px" }}>
                  Latest Music News
                </Typography>
                <Typography noWrap sx={{ marginTop: "0!important", fontSize: "20px", fontWeight: "900" }}>
                  最新音楽ニュース
                </Typography>
              </Stack>
            </Stack>
          </Stack>
        </Box>
        {/* 説明文 */}
        <Typography py={1} sx={{ fontSize: "14px", textAlign: "center" }}>
          音楽関連の最新ニュースをお届けします
        </Typography>
        {/* エラーメッセージを警告として表示 */}
        {error && (
          <Box sx={{ p: 1, mb: 2, backgroundColor: "#fff3e0", borderLeft: "4px solid #ff9800", color: "#ff9800" }}>
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}

        <Paper
          variant="outlined"
          elevation={3}
          sx={{
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          {musicNews.length > 0 ? (
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
                          <MyImage imageUrl={news.image_url[0]} accessToken={accessToken} width={120} height={80} />
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
          ) : (
            <Typography sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>{error ? "ニュースの読み込み中にエラーが発生しました。" : "表示できるデータが見つかりませんでした。"}</Typography>
          )}
        </Paper>

        <Stack
          direction="row"
          sx={{
            justifyContent: "center",
            alignItems: "center",

            marginBottom: "12px",
            marginTop: "12px",
          }}
        >
          {musicNews.length > 0 ? (
            <Button variant="outlined" color="error" component={Link} sx={{ width: "100%", backgroundColor: "#ffffff" }} href="/music-news/all">
              最新ニュースをもっと見る＞
            </Button>
          ) : (
            <></>
          )}
        </Stack>
      </Container>
    </div>
  );
}
