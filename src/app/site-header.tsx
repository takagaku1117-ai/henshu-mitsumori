import Link from "next/link";

// 全ページ共通のヘッダー。右のリンクはページごとに変える
export default function SiteHeader({
  link,
}: {
  link: { href: "/" | "/settings"; label: string };
}) {
  return (
    <header className="border-b border-line bg-panel">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-bold tracking-wide">
          編集<span className="text-accent">ミツモリ</span>
        </Link>
        <Link
          href={link.href}
          className="rounded border border-line px-3 py-1 text-sm text-ink-soft hover:border-ink hover:text-ink"
        >
          {link.label}
        </Link>
      </div>
    </header>
  );
}
