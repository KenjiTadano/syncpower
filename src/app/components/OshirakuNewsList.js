// app/components/OshirakuNewsList.js

// "use client" ディレクティブは、このコンポーネントがクライアントサイドで実行されることを示します。
// useState, useEffect などのReact Hooksや、DOM操作、イベントリスナーを使用するために必須です。
"use client";

// React の基本的な Hooks をインポート
import React, { useEffect, useState } from "react";
// HTTPリクエストを行うためのライブラリ
import axios from "axios";

// Material-UI (MUI) のコンポーネントをインポート
import { Box, Typography, CardMedia, Stack, Link, Chip } from "@mui/material";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemButton from "@mui/material/ListItemButton";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress"; // データ取得中のローディング表示用

/* Material-UI Icons をインポート */
import NewspaperIcon from "@mui/icons-material/Newspaper"; // 新聞アイコン
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos"; // 前方矢印アイコン

// MyImage コンポーネントを使用する場合はインポートしてください。
// 今回のCardMedia使用のケースでは直接は使用していませんが、
// もしNext.jsのImageコンポーネントと連携させる場合は必要になります。
// import MyImage from './MyImage';

/**
 * OshirakuNewsList コンポーネント
 * 推し楽APIから取得するニュースと、外部の静的HTMLページから取得するニュースを統合し、
 * 最新日時順にソートしてリスト表示します。
 */
export default function OshirakuNewsList() {
  // `articles` ステート: 取得した全てのニュース記事（推し楽+静的）を格納する配列
  const [articles, setArticles] = useState([]);
  // `loading` ステート: データ取得中かどうかを示すブール値 (true: ロード中, false: ロード完了)
  const [loading, setLoading] = useState(true);
  // `error` ステート: データ取得中に発生したエラーメッセージを格納する文字列 (null: エラーなし)
  const [error, setError] = useState(null);

  // `useEffect` フック: コンポーネントがマウントされた時（初回レンダリング後）に一度だけ実行される
  // 依存配列が空 (`[]`) なので、この効果は一度しか実行されないことを保証します。
  useEffect(() => {
    // 非同期関数 `fetchAllNews`: 複数のAPIからデータを取得し、統合・ソートするメインロジック
    async function fetchAllNews() {
      setLoading(true); // データ取得開始時にローディング状態をtrueに設定
      setError(null); // 前回のエラーがあればリセット

      try {
        // --- 1. 推し楽ニュースの取得 ---
        // `/api/oshiraku-news` は、Next.jsのAPI Routeとして実装されていることを想定しています。
        // このAPI Routeは、実際の推し楽APIへのプロキシとして機能し、CORSなどの問題を回避します。
        const oshirakuRes = await axios.get("/api/oshiraku-news");
        // 取得した推し楽ニュースの配列を整形 (map)
        const oshirakuArticles = (oshirakuRes.data || []).map((article) => ({
          ...article, // 元の記事オブジェクトの全てのプロパティをコピー
          id: article.articleId, // 各記事にユニークな `id` を割り当てる (Reactのkeyプロパティ用)
          type: "oshiraku", // この記事が「推し楽ニュース」であることを識別するためのフラグ
          // ソート用に日時を `Date` オブジェクトに変換
          // 推し楽ニュースの公開日 (`openDate`) を使用します。
          // `new Date(0)` は1970年1月1日を表し、日付が不正または存在しない場合のフォールバックとして、
          // ソート時に最も古い日付として扱われるようにします。
          sortDate: article.openDate ? new Date(article.openDate) : new Date(0),
          // ユーザーに表示するための、整形された日付文字列
          displayDate: article.openDate ? new Date(article.openDate).toLocaleDateString() : "日付不明",
        }));

        // --- 2. 静的ニュースの取得 ---
        // `/api/static-news` は、外部の静的HTMLページの内容をJSONで返す新しいAPI Routeです。
        // このAPI Routeがサーバーサイドで外部HTMLをフェッチし、パースします。
        const staticRes = await axios.get("/api/static-news");
        // `staticRes.data.staticNews` は `app/api/static-news/route.js` から返される配列です。
        const staticArticles = (staticRes.data.staticNews || []).map((article) => ({
          ...article, // 元の記事オブジェクトの全てのプロパティをコピー
          id: article.id, // 静的ニュースのIDは既にAPI Route側で設定済み
          type: "static", // この記事が「静的ニュース」であることを識別するためのフラグ
          // ソート用に日時を `Date` オブジェクトに変換
          // 静的ニュースの公開日 (`publishDate`) を使用します。
          sortDate: article.publishDate ? new Date(article.publishDate) : new Date(0),
          // ユーザーに表示するための、整形された日付文字列
          displayDate: article.publishDate ? new Date(article.publishDate).toLocaleDateString() : "日付不明",
        }));

        // --- 3. 両方のニュースを結合 ---
        // スプレッド構文 (`...`) を使って、推し楽ニュースと静的ニュースの配列を一つの配列に結合します。
        const combinedNews = [...oshirakuArticles, ...staticArticles];

        // --- 4. 最新の日時順にソート (降順) ---
        // `sort()` メソッドは配列を「インプレース」（元の配列を直接変更）でソートします。
        combinedNews.sort((a, b) => {
          // ソートキーとなる `sortDate` が有効な `Date` オブジェクトであり、
          // かつ有効な日付（`isNaN(date)` でチェック）であるかを確認します。
          // `getTime()` メソッドは `Date` オブジェクトをミリ秒単位の数値に変換します。
          const dateA = a.sortDate instanceof Date && !isNaN(a.sortDate) ? a.sortDate.getTime() : 0;
          const dateB = b.sortDate instanceof Date && !isNaN(b.sortDate) ? b.sortDate.getTime() : 0;
          // `b - a` の形式でソートすると降順になります（大きい値（新しい日付）が先にくる）。
          return dateB - dateA;
        });

        // 結合・ソートされた最終的なニュース記事の配列をステートに設定
        setArticles(combinedNews);
      } catch (err) {
        // データ取得中にエラーが発生した場合
        console.error("記事の取得に失敗しました:", err); // コンソールにエラーを出力
        setError("記事の読み込み中にエラーが発生しました。"); // エラーメッセージをステートに設定
      } finally {
        // `try-catch` ブロックの成功・失敗に関わらず、最後に必ず実行される
        setLoading(false); // ローディング状態をfalseに設定 (ロード完了)
      }
    }

    // `useEffect` が実行された際に、上記で定義した `fetchAllNews` 関数を呼び出す
    fetchAllNews();
  }, []); // 依存配列が空なので、コンポーネントのマウント時に一度だけ実行される

  // --- ローディング中の表示 ---
  // `loading` ステートが true の場合、ローディングスピナーを表示
  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
        <CircularProgress /> {/* MUI の円形プログレスインジケータ */}
      </Box>
    );
  }

  // --- エラー発生時の表示 ---
  // `error` ステートが null でない場合（エラーメッセージがある場合）、エラーメッセージを表示
  if (error) {
    return (
      <Box sx={{ p: 2, color: "error.main" }}>
        <Typography variant="h6">エラー:</Typography>
        <Typography>{error}</Typography>
      </Box>
    );
  }

  // --- メインコンテンツのレンダリング ---
  return (
    <div>
      {/* ヘッダー部分 (背景画像とアイコン、タイトル) */}
      <Box
        sx={{
          backgroundImage: "url(images/base.png)", // `public` フォルダからの相対パス
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          height: "50px",
          width: "100%",
          maxWidth: "400px", // 最大幅を設定
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

      {/* ニュースリストのコンテナ */}
      <Box
        sx={{
          backgroundColor: "#EDEDED", // 背景色
          padding: "12px",
        }}
      >
        <List>
          {/* ニュース記事の配列をループして各ListItemをレンダリング */}
          {articles.map((article) => (
            // 各リストアイテムには一意の `key` プロパティが必要
            // `article.id` は各記事でユニークになるように生成済み
            <React.Fragment key={article.id}>
              <ListItem
                alignItems="flex-start" // テキストが上揃えになるように設定
                sx={{
                  backgroundColor: "#ffffff", // リストアイテムの背景色
                  padding: "0", // 内側のパディングを0に設定
                }}
              >
                {/* リストアイテム全体をボタンとして機能させ、詳細ページへのリンクにする */}
                <ListItemButton
                  component={Link} // MUIのLinkコンポーネントとして機能させる
                  href={article.url} // 記事のURLへリンク
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                    padding: "4px",
                    paddingRight: "18px",
                  }}
                >
                  {/* サムネイル画像部分 */}
                  {article.thumbnailImage?.url && ( // サムネイルURLが存在する場合のみ表示
                    <CardMedia
                      component="img" // HTMLの`<img>`タグとしてレンダリング
                      // `image` プロパティのURL生成ロジック:
                      // 推し楽ニュースの画像 (元のAPIからの画像) も、
                      // 静的ニュースの画像 (外部の楽天ミュージックからの画像) も、
                      // どちらもクロスオリジンであるため、`/api/image-proxy` を経由させます。
                      // これにより、CORSの問題を回避し、一元的に画像を取得できます。
                      image={article.thumbnailImage.url}
                      alt={article.title} // 画像の代替テキスト
                      sx={{
                        width: 120, // 幅
                        height: 80, // 高さ
                        objectFit: "cover", // 画像が指定された領域に収まるようにトリミング
                      }}
                    />
                  )}
                  {/* 記事のテキストコンテンツ部分 (タイトル、日時、ラベル/種別) */}
                  {/* タイトルとメタ情報 */}
                  <ListItemText
                    primary={
                      <Box
                        sx={{
                          display: "flex", // Flexbox を有効にする
                          alignItems: "center", // 垂直方向の中央揃え
                          justifyContent: "space-between",
                          gap: 1, // 要素間のスペース (MUIのspacing単位)
                          paddingLeft: "6px", // 元々Typographyにあった左パディングをBoxに移動
                        }}
                      >
                        <Typography
                          // display を inline に戻すか、デフォルトのままで良い
                          // Boxがflexコンテナなので、Typographyはflexアイテムとして扱われる
                          // sx={{ display: "block", fontSize: "10px", paddingLeft: "6px" }} の paddingLeft は Box に移動
                          sx={{ fontSize: "10px" }}
                          component="span" // spanタグとしてレンダリング
                          variant="body2"
                          color="text.primary"
                        >
                          {article.displayDate}
                        </Typography>

                        {/* バッジはそのまま */}
                        {article.type === "oshiraku" && (
                          <Chip
                            label="推し楽"
                            size="small"
                            color="primary"
                            sx={{
                              fontSize: "0.7rem",
                              height: "18px",
                              lineHeight: "18px",
                              "& .MuiChip-label": {
                                padding: "0 6px",
                              },
                            }}
                          />
                        )}
                        {article.type === "static" && (
                          <Chip
                            label="楽天ミュージック"
                            size="small"
                            color="#bf0000"
                            sx={{
                              fontSize: "0.7rem",
                              height: "18px",
                              lineHeight: "18px",
                              "& .MuiChip-label": {
                                padding: "0 6px",
                                color: "#ffffff",
                              },
                              backgroundColor: "#bf0000",
                            }}
                          />
                        )}
                      </Box>
                    }
                    // `secondary` プロパティ: 副次的なテキスト (ここではタイトルとラベル/種別)
                    secondary={
                      <React.Fragment>
                        {/* 記事のタイトル */}
                        <Typography
                          variant="subtitle1"
                          style={{ fontSize: "16px", fontWeight: "normal" }}
                          sx={{
                            overflow: "hidden", // はみ出たテキストを非表示
                            textOverflow: "ellipsis", // はみ出たテキストを三点リーダーで表示
                            display: "-webkit-box", // Webkit系ブラウザで複数行の省略を可能にする
                            WebkitLineClamp: "2", // 2行で省略
                            WebkitBoxOrient: "vertical", // 垂直方向のボックスオリエンテーション
                            wordBreak: "break-all", // 単語の途中で改行を許可
                            paddingLeft: "6px", // 左パディング
                          }}
                        >
                          {article.title}
                        </Typography>
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
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      </Box>
    </div>
  );
}
