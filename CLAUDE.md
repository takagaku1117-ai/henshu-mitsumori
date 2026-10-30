# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 編集ミツモリ 開発ルール

駆け出しの動画編集者が、案件の条件を入れるだけで見積もり金額とクライアントへの返信文を作れるツール。

@AGENTS.md

## 要件

@requirements.md

要件にない機能は勝手に足さない。必要そうなら先に提案して、要件定義書を更新してから実装する。

## 進め方

- 1回の作業は下の「実装ステップ」1つ分だけにする。
- 複数ファイルにまたがる作業は、Plan Mode で計画を出して承認をもらってから実装する。
- 1ステップごとに「動作確認 → コミット → 次へ」。動作確認の手順（どのURLを開いて何をすれば確認できるか）を必ず伝える。
- コミットメッセージは日本語で、関連する機能要件のIDを入れる（例: `F-02 見積もり計算の関数とテストを追加`）。
- 返答は日本語。

## 技術

- Next.js（App Router・TypeScript）+ Tailwind CSS + Vercel。データベース・ログイン・外部APIは使わない
- 料金表は localStorage にだけ保存する。クライアント名はどこにも保存しない
- 見積もり計算は `src/lib/estimate.ts` の関数にまとめ、`tests/*.test.mjs`（node:test）でテストする。計算を変えたらテストも足す
- 記事・提出物はこのリポジトリに入れない（`~/Desktop/課題2_編集ミツモリ/` に置く）

## コマンド

- `npm run dev` … 開発サーバー（http://localhost:3000）
- `npm test` … `tests/**/*.test.mjs` を全部実行。1ファイルだけなら `node --test tests/estimate.test.mjs`、1テストだけなら `--test-name-pattern="特急"` を足す
- `npm run lint` / `npm run build`

## 構成メモ（ファイルを見ただけでは気づきにくい点）

- Next.js 16（`node_modules/next/dist/docs/` を先に読む）。`next.config.ts` で `cacheComponents` と `partialPrefetching` が有効
- Tailwind v4 は PostCSS ではなく `next.config.ts` の turbopack ルール（`@tailwindcss/turbopack`）で読み込んでいる
- 色・フォントは `src/app/globals.css` の `@theme` にトークンとして定義済み（`paper` / `panel` / `ink` / `ink-soft` / `line` / `accent` / `accent-wash`）。色コードを直接書かず `bg-panel` `text-ink-soft` のように使う
- テストは `.mjs` から `src/lib/estimate.ts` を直接 import する想定（Node 24 の型ストリッピング）。そのため `estimate.ts` は型注釈を消すだけで動く書き方にする（`enum`・`namespace`・パス別名 `@/` の import は使わない）
- 特急判定は「今日」に依存するので、計算関数は今日の日付を引数で受け取り、テストで固定できるようにする

## 実装ステップ（MVP）

| #   | 内容                                 | 機能要件   | 動作確認                                                          |
| --- | ------------------------------------ | ---------- | ----------------------------------------------------------------- |
| 1   | Next.js の土台とトップページ         | —          | `npm run dev` で `/` が表示される                                 |
| 2   | 見積もり計算の関数とテスト           | F-02       | `npm test` が通る（22,000円の例・特急の境界を含む）               |
| 3   | 入力フォームと金額・内訳の表示       | F-01, F-02 | `/` で条件を変えると金額と内訳がすぐ変わる                        |
| 4   | 返信文の作成とコピー                 | F-03       | コピーボタンで返信文がクリップボードに入る                        |
| 5   | 料金表の設定ページ                   | F-04       | `/settings` で単価を変える → `/` の金額に反映、再読み込みでも残る |
| 6   | GitHub 公開・Vercel デプロイ・README | —          | 公開URLで 3〜5 をもう一度確認、375px で横スクロールなし           |
