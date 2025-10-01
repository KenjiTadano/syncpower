// app/music-news/[news_id]/page.js

"use client";

import { useState, useEffect } from "react"; // React の useState と useEffect フックをインポート
import { useRouter } from "next/navigation"; // Next.js の useRouter フックをインポート
import Link from "next/link"; // Next.js の Link コンポーネントをインポート
import MyImage from "../../components/MyImage"; // MyImage コンポーネントをインポート
/* MUI ICON */
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew"; // MUI のアイコンをインポート
import IconButton from "@mui/material/IconButton"; // MUI の IconButton コンポーネントをインポート
/* Mui */
import Box from "@mui/material/Box"; // MUI の Box コンポーネントをインポート
import Stack from "@mui/material/Stack"; // MUI の Stack コンポーネントをインポート
import Typography from "@mui/material/Typography"; // MUI の Typography コンポーネントをインポート
import Divider from "@mui/material/Divider"; // MUI の Divider コンポーネントをインポート
import Card from "@mui/material/Card"; // MUI の Card コンポーネントをインポート
import CardActions from "@mui/material/CardActions"; // MUI の CardActions コンポーネントをインポート
import CardContent from "@mui/material/CardContent"; // MUI の CardContent コンポーネントをインポート
import { Container } from "@mui/material"; // MUI の Container コンポーネントをインポート
import Chip from "@mui/material/Chip"; // MUI の Chip コンポーネントをインポート
import LinearProgress from "@mui/material/LinearProgress"; // MUI の LinearProgress コンポーネントをインポート (プログレスバー)
const LOGO_IMAGE_URL = "/images/logo_cdj.png";

export default function MusicNewsDetail({ params }) {
  // MusicNewsDetail コンポーネント (音楽ニュース詳細ページ)
  const { news_id } = params; // URL パラメータから news_id を取得
  const [newsItem, setNewsItem] = useState(null); // ニュース記事のデータを保持する state
  const [error, setError] = useState(null); // エラーメッセージを保持する state
  const router = useRouter(); // useRouter フックを使用して、ページ遷移を制御
  const [accessToken, setAccessToken] = useState(null); // アクセストークンを保持する state

  /* アクセストークンを取得処理 */
  useEffect(() => {
    // useEffect フックを使用して、コンポーネントのマウント時にアクセストークンを取得
    const fetchAccessToken = async () => {
      // アクセストークンを取得する非同期関数
      try {
        const response = await fetch("/api/auth"); // /api/auth エンドポイントからアクセストークンを取得
        if (!response.ok) {
          // レスポンスがエラーの場合
          throw new Error("Failed to fetch access token"); // エラーをスロー
        }
        const data = await response.json(); // レスポンスを JSON として解析
        setAccessToken(data.token); // アクセストークンを state に設定
      } catch (error) {
        // エラーが発生した場合
        setError(error.message); // エラーメッセージを state に設定
      }
    };

    fetchAccessToken(); // アクセストークンを取得する関数を呼び出す
  }, []); // 依存配列が空のため、コンポーネントのマウント時にのみ実行

  /* Newsの詳細をFetchで取得 */
  useEffect(() => {
    // useEffect フックを使用して、コンポーネントのマウント時および accessToken の変更時にニュース記事の詳細を取得
    const fetchNewsDetail = async () => {
      // ニュース記事の詳細を取得する非同期関数
      if (!accessToken) return; // アクセストークンがない場合は、API リクエストを実行しない

      try {
        const response = await fetch(`/api/music-news/${news_id}`, {
          // /api/music-news/${news_id} エンドポイントからニュース記事の詳細を取得
          headers: {
            Authorization: `Bearer ${accessToken}`, // Authorization ヘッダーにアクセストークンを設定
          },
        });
        if (!response.ok) {
          // レスポンスがエラーの場合
          const errorData = await response.json(); // エラーレスポンスを JSON として解析
          throw new Error(errorData.error || "ニュース詳細の取得に失敗しました"); // エラーをスロー
        }
        const data = await response.json(); // レスポンスを JSON として解析

        if (data.data && data.data.length > 0) {
          // データが存在する場合
          setNewsItem(data.data[0]); // ニュース記事のデータを state に設定 (API が配列を返すことを想定)
          // API から取得したデータ全体をログに出力
          console.log("API レスポンス (全体):", data);
          // または、より詳細なオブジェクト構造を確認するために console.dir を使用
          console.dir(data, { depth: null });
        } else {
          // データが存在しない場合
          setError("ニュースが見つかりませんでした"); // エラーメッセージを state に設定
        }
      } catch (err) {
        // エラーが発生した場合
        setError(err.message); // エラーメッセージを state に設定
      }
    };

    fetchNewsDetail(); // ニュース記事の詳細を取得する関数を呼び出す
  }, [news_id, accessToken]); // 依存配列に news_id と accessToken を指定

  if (error) {
    // エラーが発生した場合
    return (
      <div>
        <h1>エラー</h1>
        <p>{error}</p>
        <button onClick={() => router.back()}>戻る</button>
      </div>
    );
  }

  if (!newsItem) {
    // ニュース記事のデータがまだ取得できていない場合 (ローディング中)
    return <LinearProgress />; // LinearProgress コンポーネントを表示 (プログレスバー)
  }

  // artist_name と artist_id を取得
  const artistName = newsItem.artist && newsItem.artist.length > 0 ? newsItem.artist[0].artist_name : "不明"; // アーティスト名を取得
  const artistId = newsItem.artist && newsItem.artist.length > 0 ? newsItem.artist[0].artist_id : "不明"; // アーティスト ID を取得

  /* 画面表示部分 */
  return (
    <div>
      <Container
        sx={{
          // Container コンポーネントのスタイル
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          backgroundColor: "white",
          zIndex: 1000,
          justifyContent: "flex-start",
          alignItems: "center",
          padding: "12px",
          background: "#ffffff",
        }}
      >
        <Stack direction={"row"} spacing={3} sx={{ width: "100%" }}>
          {" "}
          {/* Stack に width: 100% を追加 */}
          {/* Stack に width: 100% を追加 */}
          <IconButton color="#666666" aria-label="Back" onClick={() => router.back()}>
            {/* IconButton コンポーネント (前のページに戻るボタン) */}
            <ArrowBackIosNewIcon /> {/* 戻るアイコン */}
          </IconButton>
          <Typography
            sx={{
              // Typography コンポーネントのスタイル
              display: "block",
              fontSize: "16px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              // display: "flex",  flexbox は不要なので削除
              // alignItems: "center",  flexbox を削除したので不要
              width: "100%", // Typography に width を追加
            }}
          >
            {newsItem.news_title} {/* ニュース記事のタイトルを表示 */}
          </Typography>
        </Stack>
      </Container>

      <Container
        sx={{
          // Container コンポーネントのスタイル
          backgroundColor: "#EDEDED", // 背景色をlightblueに設定
          padding: "12px",
          marginTop: "60px",
        }}
      >
        <Card
          sx={{
            // Card コンポーネントのスタイル
            padding: "12px",
          }}
        >
          <Stack spacing={3}>
            {/* Stack コンポーネント (要素を縦に並べる) */}
            <Stack spacing={1}>
              {/* Stack コンポーネント (要素を縦に並べる) */}
              <Typography
                sx={{
                  // Typography コンポーネントのスタイル
                  fontSize: "20px",
                  fontWeight: "900",
                  lineHeight: "140%",
                }}
              >
                {newsItem.news_title} {/* ニュース記事のタイトルを表示 */}
              </Typography>
              <Typography
                sx={{
                  // Typography コンポーネントのスタイル
                  fontSize: "10px",
                  marginY: "2px",
                  color: "#666666",
                }}
              >
                投稿日: {newsItem.posted_at} {/* ニュース記事の投稿日を表示 */}
              </Typography>
              <Chip label={`${newsItem.news_genre_name}`} sx={{ width: "fit-content" }} /> {/* Chip コンポーネント (ニュース記事のジャンルを表示) */}
            </Stack>
            {/* 画像とキャプション */}
            <Stack spacing={0}>
              {/* Stack コンポーネント (要素を縦に並べる) */}
              {newsItem.image_url && newsItem.image_url.length > 0 && <MyImage imageUrl={newsItem.image_url[0]} accessToken={accessToken} />}
              {/* MyImage コンポーネント (ニュース記事の画像を表示) */}
              <Typography
                sx={{
                  // Typography コンポーネントのスタイル
                  fontSize: "10px",
                  marginY: "2px",
                  textAlign: "right",
                  color: "#666666",
                }}
              >
                {" "}
                {newsItem.image_caption} {/* ニュース記事の画像のキャプションを表示 */}
              </Typography>
            </Stack>
            {/* タイトル */}
            <Stack>
              {/* Stack コンポーネント (要素を縦に並べる) */}
              <span dangerouslySetInnerHTML={{ __html: newsItem.news }} /> {/* ニュース記事の本文を表示 (HTML を直接挿入) */}
            </Stack>
            <Stack direction={"row"} spacing={3}>
              {/* Stack コンポーネント (要素を横に並べる) */}
              <p>{newsItem.news_genre_name}</p> {/* ニュース記事のジャンルを表示 */}
              <p>{newsItem.media_genre_name}</p> {/* ニュース記事のメディアジャンルを表示 */}
            </Stack>
            {/* アーティスト名とアーティストID を表示 */}
            <p>関連ワード：</p>

            {newsItem.artist &&
              newsItem.artist.map((artist, index) => (
                // ニュース記事に関連するアーティスト情報を表示
                <div key={index}>
                  <p>{artist.artist_name}</p> {/* アーティスト名を表示 */}
                </div>
              ))}
          </Stack>
        </Card>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-end",

            marginBottom: "12px",
            marginTop: "12px",
          }}
        >
          <img
            src={LOGO_IMAGE_URL}
            alt="Logo"
            style={{
              right: "20px", // 右端から20px
              bottom: "20px", // 下端から20px
              width: "120px", // ロゴの横幅（必要なら調整）
              height: "auto", // アスペクト比維持
              zIndex: 2000, // 他の要素よりも前面に表示
              opacity: 0.85, // 透明度（必要に応じて調整）
            }}
          />
        </Box>
      </Container>
    </div>
  );
}
