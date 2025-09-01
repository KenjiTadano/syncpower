// app/interview-column/all/page.js

"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Container, Pagination } from "@mui/material";

// 新しく作成するインタビュー・コラムリストコンポーネントをインポート
import InterviewColumnList from "../../components/InterviewColumnList";

const PAGE_SIZE = 10; // 1ページあたりの記事数
const LAST_PAGE_KEY = "lastInterviewColumnPage"; // localStorage のキー

const AllInterviewColumnPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1); // 現在のページ番号
  const [totalArticles, setTotalArticles] = useState(0); // 総記事数

  useEffect(() => {
    // URLのクエリパラメータから resetPage をチェック
    const resetPage = searchParams.get("resetPage");

    if (resetPage === "true") {
      // resetPage が true の場合、1ページ目にリセット
      setCurrentPage(1);
      localStorage.setItem(LAST_PAGE_KEY, "1"); // localStorage も1に更新
      // URLから resetPage クエリパラメータを削除 (オプション: URLをクリーンに保つため)
      // ただし、Next.jsの useRouter.replace はサーバー側のレンダリングと競合する場合があるため注意
      // シンプルなリセット動作ならこのままでもOK
      // router.replace('/interview-column/all', undefined, { shallow: true }); // これを使うと無限ループになる可能性があるので注意
    } else {
      // resetPage がない場合、localStorage からページ番号を読み込む
      const lastPage = localStorage.getItem(LAST_PAGE_KEY);
      if (lastPage) {
        setCurrentPage(parseInt(lastPage, 10));
      }
    }
  }, [searchParams]); // searchParams が変更されたときに実行

  // InterviewColumnList から総記事数を受け取るコールバック関数
  const handleTotalArticlesChange = (count) => {
    setTotalArticles(count);
  };

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    localStorage.setItem(LAST_PAGE_KEY, value.toString());
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 総ページ数を計算 (totalArticlesが0の場合は1ページとする)
  const pageCount = totalArticles > 0 ? Math.ceil(totalArticles / PAGE_SIZE) : 1;

  return (
    <div>
      <Container
        sx={{
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
        <Stack direction={"row"} spacing={3}>
          <IconButton color="#666666" aria-label="Back" onClick={() => router.back()}>
            <ArrowBackIosNewIcon />
          </IconButton>
          <Typography
            sx={{
              display: "block",
              fontSize: "16px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "flex", // flexbox を有効化
              alignItems: "center",
            }}
          >
            インタビュー・コラム一覧
          </Typography>
        </Stack>
      </Container>
      <Container
        sx={{
          backgroundColor: "#EDEDED", // 背景色をlightblueに設定
          padding: "12px",
          marginTop: "60px", // 固定ヘッダーの分だけコンテンツを下にずらす
        }}
      >
        {/* InterviewColumnList コンポーネントを配置し、ページ情報を渡す */}
        <InterviewColumnList page={currentPage} pageSize={PAGE_SIZE} onTotalArticlesChange={handleTotalArticlesChange} />
        {/* ページネーション */}
        {totalArticles > 0 && ( // 記事が1件でもある場合にのみページネーションを表示
          <Pagination
            count={pageCount} // 総ページ数
            page={currentPage}
            onChange={handlePageChange}
            sx={{
              display: "flex",
              justifyContent: "center",
              mt: 2,
              mb: 2, // 下部にも余白を追加
            }}
          />
        )}
      </Container>
    </div>
  );
};

export default AllInterviewColumnPage;
