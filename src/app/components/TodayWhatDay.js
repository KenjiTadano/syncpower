// src/app/components/TodayWhatDay.js

"use client"; // クライアントサイドのコンポーネントであることを宣言

import "../globals.css";
import { useState, useEffect } from "react"; // ReactのuseStateとuseEffectフックをインポート
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
/* MUI ICON */
import ArticleIcon from "@mui/icons-material/Article";
/* Mui */
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

const TodayWhatDay = ({ accessToken }) => {
  // 状態変数: 記事タイプ、APIデータ、ローディング状態、エラーメッセージ、展開されたアイテムID、今日の日付
  const [selectedArticleType, setSelectedArticleType] = useState(3); // 選択された記事タイプを保持する状態変数（初期値は3）
  const [apiData, setApiData] = useState(null); // APIから取得したデータを保持する状態変数
  const [loading, setLoading] = useState(false); // ローディング状態をtrueに設定
  const [error, setError] = useState(null); // エラーメッセージを保持する状態変数
  const [expandedItemId, setExpandedItemId] = useState(null); // 展開されたアイテムIDを保持する状態変数
  const [todayFormatted, setTodayFormatted] = useState(""); // 今日の日付を "{month}月{day}日" 形式で保持する状態変数
  const [formattedToday, setFormattedToday] = useState("");

  useEffect(() => {
    // コンポーネントのマウント時に今日の日付を設定
    const today = new Date();
    const formatted = today.toLocaleDateString("ja-JP", {
      month: "numeric",
      day: "numeric",
    }); // "{month}月{day}日" 形式にフォーマット
    setTodayFormatted(formatted);
  }, []); // 空の依存配列を渡すことで、コンポーネントのマウント時にのみ実行されるようにします。

  useEffect(() => {
    // accessToken が存在する場合のみ API リクエストを実行
    if (accessToken) {
      fetchData(); // データ取得関数を呼び出す
    }
  }, [accessToken, selectedArticleType]); // accessToken, selectedArticleType が変更された時に実行

  // APIからデータを取得する非同期関数
  const fetchData = async () => {
    setLoading(true); // ローディング状態をtrueに設定
    setError(null); // エラーメッセージをnullに設定
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0"); // 月を2桁で取得
    const day = String(today.getDate()).padStart(2, "0"); // 日を2桁で取得
    const formattedToday = `${month}${day}`;
    const apiUrl = `/api/today-what-day?day=${formattedToday}&article_type=${selectedArticleType}`; // APIのURLを生成
    try {
      const response = await fetch(apiUrl, {
        // APIリクエストを送信
        headers: {
          Authorization: `Bearer ${accessToken}`, // Authorizationヘッダーにトークンを設定
        },
      });

      if (!response.ok) {
        // レスポンスがエラーの場合
        const errorData = await response.json(); // エラーレスポンスをJSONとして解析
        console.error("APIエラー (HTTPステータス):", response.status, errorData); // エラーログを出力
        throw new Error(`APIエラー (HTTP ${response.status}): ${errorData.message || "詳細不明"}`); // エラーをスロー
      }

      const data = await response.json(); // レスポンスをJSONとして解析
      console.log("APIレスポンス:", data); // APIレスポンスをログに出力
      setApiData(data); // APIデータを状態変数に設定
    } catch (e) {
      // 例外が発生した場合
      console.error("APIリクエストエラー:", e); // エラーログを出力
      setError(`データ取得中にエラーが発生しました: ${e.message}`); // エラーメッセージを設定
    } finally {
      // 処理の最後にローディング状態をfalseに設定
      setLoading(false);
    }
  };

  const handleArticleTypeChange = (e) => {
    // Article Type選択プルダウンのonChangeイベントハンドラ
    setSelectedArticleType(parseInt(e.target.value)); // 選択されたArticle Typeを状態変数に設定
  };

  return (
    // JSX: UIを記述
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
          }}
        >
          <ArticleIcon sx={{ color: "white", fontSize: 32 }} />
          <h4>今日は何の日</h4>
          <h1>{todayFormatted}</h1>
        </Stack>
      </Box>



      {/* ローディング状態の表示 */}
      {loading && <p>Loading...</p>}

      {/* エラーメッセージの表示 */}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {/* APIデータが存在する場合、結果を表示 */}
      {apiData && apiData.returned_count > 0 ? (
        <div>
          <Box
            sx={{
              backgroundColor: "#EDEDED", // 背景色をlightblueに設定
              padding: "12px",
            }}
          >
            <Stack spacing={1}>
              {/* APIデータから取得した各アイテムをアコーディオンリストとして表示 */}
              {apiData.data.map((item) => (
                <div key={item.what_day_id} style={{ gap: "4px" }}>
                  {/* タイトルをクリックするとアコーディオンが開閉 */}
                  <Accordion>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="panel1-content" id="panel1-header">
                      <Typography component="span">{item.title}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <h3>{item.artist}</h3>
                      <p>Article Note: {item.article_note}</p>
                      <p>Article Type: {item.article_type}</p>
                      <p>Modified At: {item.modified_at}</p>
                    </AccordionDetails>
                  </Accordion>
                </div>
              ))}
            </Stack>
          </Box>
        </div>
      ) : (
        // データが見つからなかった場合、メッセージを表示
        apiData && <p>データが見つかりませんでした。</p>
      )}
    </div>
  );
};

export default TodayWhatDay;
