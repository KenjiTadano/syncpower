// app/components/MusicNewsList.js

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
  // MusicNewsList コンポーネント (音楽ニュースのリストを表示)
  const [musicNews, setMusicNews] = useState([]); // 音楽ニュースのデータを保持する state
  const [error, setError] = useState(null); // エラーメッセージを保持する state
  const [loading, setLoading] = useState(true); // ローディング状態を保持する state
  const [accessToken, setAccessToken] = useState(null); // アクセストークンを保持する state

  useEffect(() => {
    // useEffect フックを使用して、コンポーネントのマウント時および offset, limit の変更時に音楽ニュースデータを取得
    const fetchMusicNews = async () => {
      // 音楽ニュースデータを取得する非同期関数
      setLoading(true); // ローディング状態を true に設定
      setError(null); // エラーメッセージを null に設定

      try {
        // アクセストークンを取得
        const tokenResponse = await fetch("/api/auth"); // /api/auth エンドポイントからアクセストークンを取得
        if (!tokenResponse.ok) {
          // レスポンスがエラーの場合
          throw new Error("Failed to fetch access token"); // エラーをスロー
        }
        const tokenData = await tokenResponse.json(); // レスポンスを JSON として解析
        const accessToken = tokenData.token; // アクセストークンを取得

        if (!accessToken) {
          // アクセストークンが存在しない場合
          throw new Error("Access token not found"); // エラーをスロー
        }

        setAccessToken(accessToken); // アクセストークンを state に保存

        const apiUrl = `/api/music-news?offset=${offset}&limit=${limit}`; // API の URL を作成
        const response = await fetch(apiUrl, {
          // API リクエストを送信
          headers: {
            Authorization: `Bearer ${accessToken}`, // Authorization ヘッダーにアクセストークンを設定
          },
        });

        if (!response.ok) {
          // レスポンスがエラーの場合
          const errorData = await response.json(); // エラーレスポンスを JSON として解析
          throw new Error(errorData.error || "Failed to fetch music news"); // エラーをスロー
        }

        const news = await response.json(); // レスポンスを JSON として解析
        setMusicNews(news.data || []); // 音楽ニュースデータを state に設定
      } catch (err) {
        // エラーが発生した場合
        setError(`Music news error: ${err.message}`); // エラーメッセージを state に設定
      } finally {
        // 処理の最後にローディング状態を false に設定
        setLoading(false); // ローディング状態を false に設定
      }
    };

    fetchMusicNews(); // 音楽ニュースデータを取得する関数を呼び出す
  }, [offset, limit]); // 依存配列に offset と limit を指定

  if (loading) return <LinearProgress />; // ローディング状態の場合、LinearProgress コンポーネントを表示 (プログレスバー)

  if (error) return <p style={{ color: "red" }}>{error}</p>; // エラーが発生した場合、エラーメッセージを表示

  return (
    <Box>
      {/* Box コンポーネント (コンテンツを囲む) */}
      <List>
        {/* List コンポーネント (リストを表示) */}
        {musicNews.map((news) => (
          // 音楽ニュースデータをループ処理
          <React.Fragment key={news.news_id}>
            {/* React.Fragment コンポーネント (複数の要素をグループ化) */}
            <ListItem
              // ListItem コンポーネント (リストのアイテム)
              alignItems="flex-start"
              sx={{
                // ListItem コンポーネントのスタイル
                backgroundColor: "#ffffff",
                padding: "0",
              }}
            >
              <ListItemButton
                // ListItemButton コンポーネント (クリック可能なリストアイテム)
                component={Link}
                href={`/music-news/${news.news_id}`}
                sx={{
                  // ListItemButton コンポーネントのスタイル
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                  padding: "0",
                }}
              >
                {/* サムネイル画像 
                {news.image_url && news.image_url.length > 0 && (
                  // 画像 URL が存在する場合
                  <Box sx={{ display: "flex", alignItems: "center", width: "90px", height: "60px", m: 1, overflow: "hidden", position: "relative" }}>
                    {/* Box コンポーネント (画像を囲む) 
                    <MyImage imageUrl={news.image_url[0]} accessToken={accessToken} />

                  </Box>
                )}*/}

                <ListItemText
                  // ListItemText コンポーネント (テキストを表示)
                  primary={
                    // primary (メインテキスト)
                    <Typography
                      // Typography コンポーネント (テキストを表示)
                      sx={{ display: "block", fontSize: "10px", paddingLeft: "6px" }} // posted_at のスタイル
                      component="span"
                      variant="body2"
                      color="text.primary"
                    >
                      {news.posted_at} {/* 投稿日を表示 */}
                    </Typography>
                  }
                  secondary={
                    // secondary (サブテキスト)
                    <React.Fragment>
                      {/* React.Fragment コンポーネント (複数の要素をグループ化) */}
                      <Typography
                        // Typography コンポーネント (テキストを表示)
                        variant="subtitle1"
                        style={{ fontSize: "16px", fontWeight: "normal" }} // news_title のスタイル
                        sx={{
                          // Typography コンポーネントのスタイル
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          display: "-webkit-box",
                          WebkitLineClamp: "2",
                          WebkitBoxOrient: "vertical",
                          wordBreak: "break-all",
                          paddingLeft: "6px",
                        }}
                      >
                        {news.news_title} {/* ニュース記事のタイトルを表示 */}
                      </Typography>
                      {news.artist_name && (
                        // アーティスト名が存在する場合
                        <Typography
                          // Typography コンポーネント (テキストを表示)
                          sx={{ display: "block", fontSize: "12px" }} // artist_name のスタイル
                          variant="body2"
                          color="text.secondary"
                        >
                          アーティスト: {news.artist_name} {/* アーティスト名を表示 */}
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
            {/* Divider コンポーネント (区切り線を表示) */}
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default MusicNewsList;
