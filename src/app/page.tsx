import Link from "next/link";
import Estimator from "./estimator";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-line bg-panel">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold tracking-wide">
            編集<span className="text-accent">ミツモリ</span>
          </h1>
          <Link
            href="/settings"
            className="rounded border border-line px-3 py-1 text-sm text-ink-soft hover:border-ink hover:text-ink"
          >
            料金表
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <p className="mb-6 text-sm text-ink-soft">
          案件の条件を入れるだけで、見積もり金額と返信文がすぐできます。
        </p>
        <Estimator />
      </main>
    </div>
  );
}
