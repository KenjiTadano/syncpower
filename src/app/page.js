// app/page.js

"use client";

import "./globals.css";

import { useState, useEffect } from "react";
import { Element, Link as ScrollLink } from "react-scroll"; // react-scroll をインポート

import TodayWhatDay from "./components/TodayWhatDay";
import ReadMusicNews from "./components/MusicNews"; // MusicNews.js を ReadMusicNews としてインポート
// import dynamic from "next/dynamic"; // 現在のコードでは使用されていないためコメントアウト
import OshirakuNewsList from "./components/OshirakuNewsList";

/* Mui */
import Box from "@mui/material/Box";
// import Card from "@mui/material/Card"; // 現在のコードでは使用されていないためコメントアウト
// import CardActions from "@mui/material/CardActions"; // 現在のコードでは使用されていないためコメントアウト
// import CardContent from "@mui/material/CardContent"; // 現在のコードでは使用されていないためコメントアウト
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import * as React from "react";
import { Container } from "@mui/material";

/* ↓タブ切り替えの処理（ここから）↓ */
function samePageLinkNavigation(event) {
  if (
    event.defaultPrevented ||
    event.button !== 0 || // ignore everything but left-click
    event.metaKey ||
    event.ctrlKey ||
    event.altKey ||
    event.shiftKey
  ) {
    return false;
  }
  return true;
}

function LinkTab(props) {
  return (
    <Tab
      component={ScrollLink} // a タグの代わりに ScrollLink を使用
      to={props.href} // href の代わりに to を使用
      spy={true}
      smooth={true}
      duration={500}
      offset={-50} // ヘッダーの高さ分オフセット
      onClick={(event) => {
        // Routing libraries handle this, you can remove the onClick handle when using them.
        if (samePageLinkNavigation(event)) {
          event.preventDefault();
        }
      }}
      aria-current={props.selected && "page"}
      {...props}
    />
  );
}

LinkTab.propTypes = {
  selected: PropTypes.bool,
};
/* ↓タブ切り替えの処理（ここまで）↓ */

export default function Home() {
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false); // ローディング状態追加

  /* ↓タブ切り替え関数↓ */
  const [value, setValue] = React.useState(0);
  const handleChange = (event, newValue) => {
    // event.type can be equal to focus with selectionFollowsFocus.
    if (event.type !== "click" || (event.type === "click" && samePageLinkNavigation(event))) {
      setValue(newValue);
    }
  };
  /* スクロールに連動してアクティブなタブを切り替え */

  useEffect(() => {
    authenticate();
  }, []);

  /* 認証してトークン取得 */
  const authenticate = async () => {
    setLoading(true);
    setError(null); // 新しい認証試行の前にエラーをリセット
    setToken(null); // 新しい認証試行の前にトークンをリセット

    try {
      const response = await fetch("/api/auth");
      if (!response.ok) {
        const errorData = await response.json();
        // 認証失敗の場合でも、エラーメッセージを設定し、トークンはnullのままにする
        setError(`認証に失敗しました (HTTP ${response.status}): ${errorData.message || "詳細不明"}`);
        setToken(null); // トークンは取得できていないのでnullのまま
      } else {
        const data = await response.json();
        if (data.token && data.expires_at) {
          setToken(data.token);
          setError(null); // 成功したらエラーをクリア
        } else {
          setError("認証に失敗しました: 不正なレスポンスデータ (トークンまたは有効期限がありません)");
          setToken(null);
        }
      }
    } catch (e) {
      // ネットワークエラーなど
      setError(`認証中に予期せぬエラーが発生しました: ${e.message}`);
      setToken(null); // トークンは取得できていないのでnullのまま
    } finally {
      setLoading(false);
    }
  };

  // トークンをマスク表示する関数（例：最初6文字 + … + 最後4文字）
  const maskedToken = token ? `${token.slice(0, 6)}...${token.slice(-4)}` : "";

  // クリップボードにコピー
  const copyToken = () => {
    if (token) {
      navigator.clipboard
        .writeText(token)
        .then(() => {
          alert("トークンをコピーしました！");
        })
        .catch((err) => {
          console.error("トークンコピー失敗:", err);
          alert("トークンのコピーに失敗しました。");
        });
    } else {
      alert("コピーするトークンがありません。");
    }
  };

  return (
    <main>
      {/* 認証エラーメッセージの表示 */}
      {error && (
        <div
          style={{
            backgroundColor: "#ffe6e6",
            color: "#cc0000",
            padding: "12px",
            marginBottom: "20px",
            borderRadius: "6px",
            boxShadow: "0 0 5px rgba(204,0,0,0.3)",
          }}
        >
          <strong>認証エラー:</strong> {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: "12px",
              background: "none",
              border: "none",
              color: "#cc0000",
              fontWeight: "bold",
              cursor: "pointer",
            }}
            aria-label="エラーを閉じる"
          >
            ×
          </button>
        </div>
      )}

      {/* 認証ローディング表示 */}
      {loading && (
        <div
          style={{
            textAlign: "center",
            fontSize: "18px",
            marginBottom: "24px",
          }}
          role="status"
          aria-live="polite"
        >
          認証中… <span className="spinner" />
          <style>
            {`
              .spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 3px solid rgba(0,0,0,0.2);
                border-top-color: #333;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                vertical-align: middle;
                margin-left: 8px;
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}

      {/* トークンがある場合（認証成功）またはローディングが終了している場合（認証失敗でもUI表示） */}
      {!loading && ( // ローディング中はコンテンツを表示しない
        <div>
          <Container maxWidth={false} disableGutters sx={{ backgroundColor: "#f8f8f8" }}>
            <Box
              sx={{
                position: "fixed", // ビューポートに対して固定
                top: 0, // 上端に配置
                left: 0, // 左端に配置
                width: "100%", // 幅を100%に設定
                backgroundColor: "white", // 背景色を設定
                zIndex: 1000, // 他の要素よりも上に表示
                height: "50px",
              }}
            >
              <Tabs
                value={value}
                onChange={handleChange}
                aria-label="nav tabs example"
                role="navigation"
                variant="fullWidth"
                sx={{
                  backgroundColor: "#fff",
                  "& .MuiTab-root": {
                    color: "#999", // 非アクティブ時
                    flex: 1,
                  },
                  "& .Mui-selected": {
                    color: "#d32f2f!important", // アクティブ時の文字色
                  },
                  "& .MuiTabs-indicator": {
                    backgroundColor: "#d32f2f", // インジケーター色（下線）
                  },
                }}
              >
                <LinkTab
                  label="今日は何の日？"
                  href="todayWhatDaySection"
                  sx={{
                    fontSize: "11px",
                    fontWeight: "900",
                    width: "100%", // 横幅いっぱい
                    display: "flex", // 子要素をflex配置
                    justifyContent: "center", // 中央揃え
                    alignItems: "center", // 垂直中央揃え（必要に応じて）
                    textTransform: "none", // 大文字化を無効に（任意）
                  }}
                />
                <LinkTab
                  label="最新音楽ニュース"
                  href="musicNewsSection"
                  sx={{
                    fontSize: "11px",
                    fontWeight: "900",
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    textTransform: "none",
                  }}
                />
                <LinkTab
                  label="インタビュー"
                  href="interviewSection"
                  sx={{
                    fontSize: "11px",
                    fontWeight: "900",
                    width: "100%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    textTransform: "none",
                  }}
                />
              </Tabs>
            </Box>

            {/* 各コンポーネントを Element で囲む */}
            {/* accessToken を渡すことで、子コンポーネントが認証状態を判断できるようにする */}
            <Element name="todayWhatDaySection" style={{ marginTop: "50px", width: "100%" }} sx={{ backgroundColor: "#f8f8f8" }}>
              <TodayWhatDay accessToken={token} />
            </Element>

            <Element name="musicNewsSection" style={{ width: "100%" }}>
              <ReadMusicNews accessToken={token} name="todayWhatDay" />
            </Element>

            {/* OshirakuNewsList は認証不要なので常に表示 */}
            <Element name="interviewSection" style={{ width: "100%" }}>
              <OshirakuNewsList />
            </Element>
          </Container>
        </div>
      )}
    </main>
  );
}
