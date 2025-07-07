// app/music-news/all/page.js
"use client";

import React, { useState, useEffect } from "react";
import MusicNewsList from "../MusicNewsList";
import { useRouter } from "next/navigation";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Container, Pagination } from "@mui/material";

const PAGE_SIZE = 10; // 1ページあたりのニュース数
const LAST_PAGE_KEY = "lastMusicNewsPage"; // localStorage のキー

const AllMusicNewsPage = () => {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1); // 現在のページ番号

  useEffect(() => {
    // localStorage からページ番号を読み込む
    const lastPage = localStorage.getItem(LAST_PAGE_KEY);
    if (lastPage) {
      setCurrentPage(parseInt(lastPage, 10));
    }
  }, []);

  const handlePageChange = (event, value) => {
    setCurrentPage(value);
    localStorage.setItem(LAST_PAGE_KEY, value.toString()); // ページ変更時に localStorage に保存
  };

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
          <IconButton color="#666666" aria-label="" onClick={() => router.back()}>
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
            音楽ニュース一覧
          </Typography>
        </Stack>
      </Container>
      <Container
        sx={{
          backgroundColor: "#EDEDED", // 背景色をlightblueに設定
          padding: "12px",
          marginTop: "60px",
        }}
      >
        <MusicNewsList offset={(currentPage - 1) * PAGE_SIZE} limit={PAGE_SIZE} />
        <Pagination
          count={10} // 100件 / 20件 = 5ページ
          page={currentPage}
          onChange={handlePageChange}
          sx={{
            display: "flex",
            justifyContent: "center",
            mt: 2,
          }}
        />
      </Container>
    </div>
  );
};

export default AllMusicNewsPage;
