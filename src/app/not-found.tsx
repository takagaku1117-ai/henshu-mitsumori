import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "./site-header";

export const metadata: Metadata = {
  title: "ページが見つかりません｜編集ミツモリ",
};

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader link={{ href: "/", label: "見積もりへ戻る" }} />

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-16">
        <section className="rounded-lg border border-line bg-panel p-6">
          <p className="mb-1 font-mono text-5xl font-semibold text-accent">
            404
          </p>
          <h1 className="mb-2 text-xl font-bold">ページが見つかりません</h1>
          <p className="mb-6 text-sm text-ink-soft">
            URL がまちがっている可能性があります。
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded bg-ink px-5 py-2 text-sm font-bold text-panel hover:opacity-90"
            >
              見積もりへ
            </Link>
            <Link
              href="/settings"
              className="rounded border border-line px-5 py-2 text-sm text-ink-soft hover:border-ink hover:text-ink"
            >
              料金表へ
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
