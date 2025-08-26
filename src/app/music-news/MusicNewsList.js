// app/music-news/MusicNewsList.js

"use client";

import React, { useState, useEffect } from "react"; // React の useState と useEffect フックをインポート
import Link from "next/link"; // Next.js の Link コンポーネントをインポート
import ListItem from "@mui/material/ListItem"; // MUI の ListItem コンポーネントをインポート
import ListItemText from "@mui/material/ListItemText"; // MUI の ListItemText コンポーネントをインポート
import ListItemIcon from "@mui/material/ListItemIcon"; // MUI の ListItemIcon コンポーネントをインポート
import ListItemButton from "@mui/material/ListItemButton"; // MUI の ListItemButton コンポーネントをインポート
import Divider from "@mui/material/Divider"; // MUI の Divider コンポーネントをインポート
import List from "@mui/material/List"; // MUI の List コンポーネントをインポート
import Box from "@mui/material/Box"; // MUI の Box コンポーネントをインポート
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos"; // MUI の ArrowForwardIosIcon コンポーネントをインポート
import Typography from "@mui/material/Typography"; // MUI の Typography コンポーネントをインポート
import MyImage from "../components/MyImage"; // MyImage コンポーネントをインポート
import LinearProgress from "@mui/material/LinearProgress"; // MUI の LinearProgress コンポーネントをインポート (プログレスバー)

const MusicNewsList = ({ offset, limit }) => {
  const [musicNews, setMusicNews] = useState([]); // 音楽ニュースのデータを保持する state
  const [error, setError] = useState(null); // エラーメッセージを保持する state
  const [loading, setLoading] = useState(true); // ローディング状態を保持する state
  const [accessToken, setAccessToken] = useState(null); // アクセストークンを保持する state

  useEffect(() => {
    const fetchMusicNews = async () => {
      setLoading(true); // ローディング状態を true に設定
      setError(null); // エラーメッセージを null に設定
      setMusicNews([]); // データをクリア

      try {
        // アクセストークンを取得
        const tokenResponse = await fetch("/api/auth"); // /api/auth エンドポイントからアクセストークンを取得
        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json();
          // トークン取得失敗時のユーザー向けメッセージ
          throw new Error(`アクセストークンの取得に失敗しました。ニュースを表示できません。(${errorData.message || tokenResponse.statusText})`);
        }
        const tokenData = await tokenResponse.json(); // レスポンスを JSON として解析
        const fetchedAccessToken = tokenData.token; // アクセストークンを取得

        if (!fetchedAccessToken) {
          throw new Error("アクセストークンが見つかりませんでした。ニュースを表示できません。");
        }

        setAccessToken(fetchedAccessToken); // アクセストークンを state に保存

        const apiUrl = `/api/music-news?offset=${offset}&limit=${limit}`; // API の URL を作成
        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${fetchedAccessToken}`, // Authorization ヘッダーにアクセストークンを設定
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          // 音楽ニュースデータ取得失敗時のユーザー向けメッセージ
          throw new Error(`音楽ニュースの取得に失敗しました。(${errorData.error || response.statusText})`);
        }

        const news = await response.json(); // レスポンスを JSON として解析
        setMusicNews(news.data || []); // 音楽ニュースデータを state に設定
      } catch (err) {
        // エラーが発生した場合、ユーザー向けのエラーメッセージを設定
        setError(`ニュースの読み込み中に問題が発生しました: ${err.message}`);
        setMusicNews([]); // エラー時はニュースデータをクリア
      } finally {
        setLoading(false); // 処理の最後にローディング状態を false に設定
      }
    };

    fetchMusicNews(); // 音楽ニュースデータを取得する関数を呼び出す
  }, [offset, limit]); // 依存配列に offset と limit を指定

  if (loading) {
    return <LinearProgress sx={{ mt: 2 }} />; // ローディング状態の場合、LinearProgress コンポーネントを表示 (プログレスバー)
  }

  return (
    <Box>
      {/* エラーメッセージを警告として表示 */}
      {error && (
        <Box sx={{ p: 2, mb: 2, backgroundColor: "#fff3e0", borderLeft: "4px solid #ff9800", color: "#ff9800" }}>
          <Typography variant="body2">{error}</Typography>
        </Box>
      )}

      {/* ニュースデータがある場合のみリストを表示 */}
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
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    padding: "0",
                  }}
                >
                  {/* サムネイル画像 - MusicNews.js と同様に有効化するならコメント解除 */}
                  {/*
                  {news.image_url && news.image_url.length > 0 && (
                    <Box sx={{ display: "flex", alignItems: "center", width: "90px", height: "60px", m: 1, overflow: "hidden", position: "relative" }}>
                      <MyImage imageUrl={news.image_url[0]} accessToken={accessToken} width={120} height={80} />
                    </Box>
                  )}
                  */}

                  <ListItemText
                    primary={
                      <Typography sx={{ display: "block", fontSize: "10px", paddingLeft: "6px" }} component="span" variant="body2" color="text.primary">
                        {news.posted_at}
                      </Typography>
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
                          {news.news_title}
                        </Typography>
                        {news.artist_name && (
                          <Typography sx={{ display: "block", fontSize: "12px" }} variant="body2" color="text.secondary">
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
        // ニュースデータがない場合（エラーまたはデータなし）
        !error && ( // エラーメッセージが表示されている場合は重複して表示しない
          <Typography sx={{ p: 2, textAlign: "center", color: "text.secondary" }}>表示できる音楽ニュースがありません。</Typography>
        )
      )}
    </Box>
  );
};

export default MusicNewsList;
