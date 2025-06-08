// app/page.js
"use client";

import "./globals.css";

import { useState, useEffect } from "react";
import { Element, Link as ScrollLink } from "react-scroll"; // react-scroll をインポート

import TodayWhatDay from "./components/TodayWhatDay";
import ReadMusicNews from "./components/MusicNews";

/* Mui */
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
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
    try {
      const response = await fetch("/api/auth");
      if (!response.ok) {
        const errorData = await response.json();
        setError(`認証に失敗しました (HTTP ${response.status}): ${errorData.message || "詳細不明"}`);
        setLoading(false);
        return;
      }
      const data = await response.json();
      if (data.token && data.expires_at) {
        setToken(data.token);
      } else {
        setError("認証に失敗しました: 不正なレスポンスデータ");
      }
    } catch (e) {
      setError(`認証中にエラーが発生しました: ${e.message}`);
    }
    setLoading(false);
  };

  // トークンをマスク表示する関数（例：最初6文字 + … + 最後4文字）
  const maskedToken = token ? `${token.slice(0, 6)}...${token.slice(-4)}` : "";

  // クリップボードにコピー
  const copyToken = () => {
    navigator.clipboard.writeText(token).then(() => {
      alert("トークンをコピーしました！");
    });
  };

  return (
    <main>
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
          <strong>エラー:</strong> {error}
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

      {token && !loading && (
        <div>
          <Container
            maxWidth="sm"
            sx={{
              margin: "0 0",
              padding: "0", // 水平方向に中央揃え
            }}
          >
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
                  }}
                />
                <LinkTab
                  label="最新音楽ニュース"
                  href="musicNewsSection"
                  sx={{
                    fontSize: "11px",
                    fontWeight: "900",
                  }}
                />
                <LinkTab
                  label="インタビュー"
                  href="interviewSection"
                  sx={{
                    fontSize: "11px",
                    fontWeight: "900",
                  }}
                />
              </Tabs>
            </Box>

            {/* 各コンポーネントを Element で囲む */}
            <Element name="todayWhatDaySection" style={{ marginTop: "50px" }}>
              <TodayWhatDay accessToken={token} />
            </Element>

            <Element name="musicNewsSection">
              <ReadMusicNews accessToken={token} name="todayWhatDay" />
            </Element>

            <Element name="interviewSection">
              {/* TODO: インタビューコンポーネントを実装 */}
              <Typography variant="h4">インタビュー (未実装)</Typography>
            </Element>
          </Container>
        </div>
      )}
    </main>
  );
}
