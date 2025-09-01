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
import { Container, Pagination, Box } from "@mui/material"; // コンテナ、ページネーション、汎用ボックス

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

  // useEffect フックは、コンポーネントのマウント時や依存配列の変更時に副作用を実行する
  // このuseEffectは、localStorageから前回のページ番号を読み込むために一度だけ実行される
  // ただし、useSearchParamsによるリセットロジックは ResetPageOnLoad コンポーネントに移動したため、
  // ここでlocalStorageから読み込むのは、resetPage=true がない通常のアクセス時のみとなる。
  // ResetPageOnLoad コンポーネントが currentPage を設定するため、この useEffect は不要になるか、
  // ResetPageOnLoad が設定した後にさらに上書きする形になるため、慎重に扱う必要がある。
  // -> ResetPageOnLoad が localStorage の読み込みも担当するため、この useEffect は削除する。
  //    もし残すなら、ResetPageOnLoad の useEffect が先に実行されるように調整が必要。
  //    今回は ResetPageOnLoad が全てを制御するため、この useEffect は削除が適切。

  // 💡 以前の useEffect は ResetPageOnLoad コンポーネントに移動したため、この部分は削除されます。
  // useEffect(() => {
  //   const lastPage = localStorage.getItem(LAST_PAGE_KEY);
  //   if (lastPage) {
  //     setCurrentPage(parseInt(lastPage, 10));
  //   }
  // }, []);

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
          backgroundColor: "#EDEDED", // 背景色
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
        <Suspense fallback={<Box sx={{ textAlign: "center", py: 2 }}>ページ情報を読み込み中...</Box>}>
          <ResetPageOnLoad
            setCurrentPage={setCurrentPage} // currentPage ステートを更新するための関数を渡す
            localStorageKey={LAST_PAGE_KEY} // localStorage のキーを渡す
          />
        </Suspense>

        {/* インタビュー・コラム記事リストコンポーネント */}
        <InterviewColumnList
          page={currentPage} // 現在のページ番号を渡す
          pageSize={PAGE_SIZE} // 1ページあたりの記事数を渡す
          onTotalArticlesChange={handleTotalArticlesChange} // 総記事数を受け取るコールバック関数を渡す
        />

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
