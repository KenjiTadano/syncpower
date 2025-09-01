// app/interview-column/all/page.js

// このファイルがクライアントサイドで実行されることを示すディレクティブ
// Next.jsのApp Routerでは、デフォルトでサーバーコンポーネントとなるため、
// ブラウザのAPI (useState, useEffect, localStorageなど) を使う場合は必須。
"use client";

// Reactのフックをインポート
import React, { useState, useEffect, Suspense } from "react"; // Suspense もインポート

// Next.jsのナビゲーション関連フックをインポート
import { useRouter } from "next/navigation";

// Material-UIのアイコンとコンポーネントをインポート
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew"; // 戻るボタンのアイコン
import IconButton from "@mui/material/IconButton"; // アイコンボタン
import Stack from "@mui/material/Stack"; // 要素のレイアウト用
import Typography from "@mui/material/Typography"; // テキスト表示用
// CircularProgress もインポートに追加
import { Container, Pagination, Box, Paper, CircularProgress } from "@mui/material"; // コンテナ、ページネーション、汎用ボックス、紙のようなコンポーネント

// カスタムコンポーネントをインポート
import InterviewColumnList from "../../components/InterviewColumnList"; // インタビュー・コラム記事のリスト表示用
import ResetPageOnLoad from "./ResetPageOnLoad"; // useSearchParams を使用してページをリセットするロジックを分離した子コンポーネント

// 定数定義
const PAGE_SIZE = 10; // 1ページあたりの記事表示件数
const LAST_PAGE_KEY = "lastInterviewColumnPage"; // localStorage にページ番号を保存する際のキー

/**
 * インタビュー・コラム記事の一覧ページコンポーネント。
 * 記事リストの表示とページネーション機能を提供する。
 */
const AllInterviewColumnPage = () => {
  // Next.jsのルーターフック。ページ遷移や履歴操作に使用。
  const router = useRouter();

  // ステート変数の定義
  // currentPage: 現在表示しているページ番号 (デフォルトは1)
  const [currentPage, setCurrentPage] = useState(1);
  // totalArticles: APIから取得した全記事の総件数 (ページネーションの総ページ数計算に使用)
  const [totalArticles, setTotalArticles] = useState(0);

  /**
   * InterviewColumnList コンポーネントから総記事数を受け取るコールバック関数。
   * @param {number} count - APIから取得した全記事の総件数。
   */
  const handleTotalArticlesChange = (count) => {
    setTotalArticles(count);
  };

  /**
   * ページネーションコンポーネントのページ変更イベントハンドラ。
   * @param {object} event - イベントオブジェクト。
   * @param {number} value - 新しいページ番号。
   */
  const handlePageChange = (event, value) => {
    setCurrentPage(value); // 現在のページ番号を更新
    localStorage.setItem(LAST_PAGE_KEY, value.toString()); // 新しいページ番号をlocalStorageに保存
    // ページ変更時に画面の最上部へスムーズにスクロール
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 総ページ数を計算。総記事数が0の場合は、少なくとも1ページは表示されるようにする。
  const pageCount = totalArticles > 0 ? Math.ceil(totalArticles / PAGE_SIZE) : 1;

  // コンポーネントのレンダリング
  return (
    <div>
      {/* 固定ヘッダー部分 */}
      <Container
        sx={{
          position: "fixed", // 画面上部に固定
          top: 0, // 上端に配置
          left: 0, // 左端に配置
          width: "100%", // 幅を100%に設定
          backgroundColor: "white", // 背景色
          zIndex: 1000, // 他の要素より手前に表示
          justifyContent: "flex-start", // アイテムを左寄せに配置
          alignItems: "center", // アイテムを中央揃えに配置
          padding: "12px", // 内側の余白
          background: "#ffffff", // 背景色 (backgroundColor と重複しているが念のため)
        }}
      >
        <Stack direction={"row"} spacing={3}>
          {/* 戻るボタン */}
          <IconButton color="#666666" aria-label="Back" onClick={() => router.back()}>
            <ArrowBackIosNewIcon />
          </IconButton>
          {/* ページタイトル */}
          <Typography
            sx={{
              display: "block",
              fontSize: "16px",
              whiteSpace: "nowrap", // テキストを折り返さない
              overflow: "hidden", // はみ出したテキストを隠す
              textOverflow: "ellipsis", // はみ出したテキストを三点リーダーで表示
              display: "flex", // flexbox を有効化して中央揃えを可能にする
              alignItems: "center", // 垂直方向の中央揃え
            }}
          >
            インタビュー・コラム一覧
          </Typography>
        </Stack>
      </Container>

      {/* メインコンテンツ部分 */}
      <Container
        sx={{
          backgroundColor: "#f8f8f8", // 背景色
          padding: "12px", // 内側の余白
          marginTop: "60px", // 固定ヘッダーの高さ分、コンテンツを下にずらす
        }}
      >
        {/*
          ResetPageOnLoad コンポーネントを Suspense でラップする。
          useSearchParams はクライアントサイドでのみ利用可能であり、
          サーバーサイドでのプリレンダリング時にエラーとならないようにするため。
          fallback は、ResetPageOnLoad がクライアントサイドでハイドレーションされるまでの間に表示される。
        */}
        <Suspense
          fallback={
            // 💡 ここが修正箇所: ローディングインジケータを画面中央に配置
            <Box
              sx={{
                display: "flex", // flexbox を有効に
                justifyContent: "center", // 水平方向の中央揃え
                alignItems: "center", // 垂直方向の中央揃え
                // 画面の高さいっぱいに広げ、ヘッダーの高さ分を引く
                minHeight: "calc(100vh - 120px)", // 画面全体の高さからヘッダーと下部の余白を引いた高さ
                width: "100%", // 幅を100%に
              }}
            >
              <CircularProgress /> {/* 円形プログレスインジケータ */}
            </Box>
          }
        >
          <ResetPageOnLoad
            setCurrentPage={setCurrentPage} // currentPage ステートを更新するための関数を渡す
            localStorageKey={LAST_PAGE_KEY} // localStorage のキーを渡す
          />
        </Suspense>

        {/* 記事リスト部分を Paper で囲む */}
        <Paper
          variant="outlined"
          elevation={3}
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            // 💡 InterviewColumnList のローディングと Paper が重複しないように、
            //    ローディング中は Paper を表示しない。
            //    ただし、ここでは Suspense の fallback を使っているので、
            //    InterviewColumnList のローディングは Suspense の fallback の後に表示される。
            //    つまり、InterviewColumnList 自身のローディングは LinearProgress のまま。
          }}
        >
          {/* インタビュー・コラム記事リストコンポーネント */}
          <InterviewColumnList
            page={currentPage} // 現在のページ番号を渡す
            pageSize={PAGE_SIZE} // 1ページあたりの記事数を渡す
            onTotalArticlesChange={handleTotalArticlesChange} // 総記事数を受け取るコールバック関数を渡す
          />
        </Paper>

        {/* ページネーションコンポーネント */}
        {/* 総記事数が0件より多い場合にのみページネーションを表示 */}
        {totalArticles > 0 && (
          <Pagination
            count={pageCount} // 総ページ数
            page={currentPage} // 現在のページ番号
            onChange={handlePageChange} // ページ変更時のイベントハンドラ
            sx={{
              display: "flex", // flexbox を有効化
              justifyContent: "center", // 水平方向の中央揃え
              mt: 2, // 上部のマージン
              mb: 2, // 下部のマージン
            }}
          />
        )}
      </Container>
    </div>
  );
};

export default AllInterviewColumnPage;
