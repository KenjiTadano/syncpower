// app/interview-column/all/ResetPageOnLoad.js

"use client"; // このコンポーネントはクライアントサイドで動作

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * URLのクエリパラメータに基づいてページ番号をリセットするコンポーネント。
 * Suspense境界内で使用されることを想定。
 * @param {object} props
 * @param {function} props.setCurrentPage - 親コンポーネントのcurrentPageを更新する関数
 * @param {string} props.localStorageKey - localStorageに保存するキー
 */
const ResetPageOnLoad = ({ setCurrentPage, localStorageKey }) => {
  const searchParams = useSearchParams(); // クライアントサイドでのみ利用可能

  useEffect(() => {
    const resetPage = searchParams.get("resetPage");

    if (resetPage === "true") {
      // resetPage が true の場合、1ページ目にリセット
      setCurrentPage(1);
      localStorage.setItem(localStorageKey, "1"); // localStorage も1に更新
      // URLから resetPage クエリパラメータを削除 (オプション: URLをクリーンに保つため)
      // router.replace を使うと Suspense の問題が再発する可能性があるので、ここでは行わない
    } else {
      // resetPage がない場合、localStorage からページ番号を読み込む
      const lastPage = localStorage.getItem(localStorageKey);
      if (lastPage) {
        setCurrentPage(parseInt(lastPage, 10));
      }
    }
  }, [searchParams, setCurrentPage, localStorageKey]); // 依存配列に含める

  // このコンポーネントはUIをレンダリングしないので null を返す
  return null;
};

export default ResetPageOnLoad;
