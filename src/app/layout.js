import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";

// Noto Sans JP フォントを定義
const notoSansJP = Noto_Sans_JP({
  weight: ["400", "700"], // 使用するウェイトを指定 (例: RegularとBold)
  subsets: ["latin"], // 日本語サブセットを指定
  variable: "--font-noto-sans-jp", // CSS変数として利用可能にする
  display: "swap", // FOIT (Flash of Invisible Text) を防ぐ
});

export const metadata = {
  title: "楽天ミュージック 音楽ニュースサイト",
  description: "最新の音楽・エンタメの情報がここで見つかる！",
};

export default function RootLayout({ children }) {
  return (
    // `className`でフォントを適用するか、`style`でCSS変数を定義する
    // ここではHTML要素全体に適用するために `className` に変数を渡します。
    <html lang="ja" className={notoSansJP.variable}>
      <body>
        <AppRouterCacheProvider>{children}</AppRouterCacheProvider>
      </body>
    </html>
  );
}
