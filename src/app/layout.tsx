import type { Metadata } from "next";
import { IBM_Plex_Mono, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";

// 日本語フォントはファイルが大きいので preload せず、使う文字だけ読み込ませる
const zenKaku = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  preload: false,
});

// 金額の数字は等幅にして、桁がそろって見えるようにする
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  weight: ["500", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "編集ミツモリ｜動画編集の見積もりメーカー",
  description:
    "完成尺・テロップ量・納期を入れるだけで、動画編集の見積もり金額とクライアントへの返信文を作れるツール。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${zenKaku.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
