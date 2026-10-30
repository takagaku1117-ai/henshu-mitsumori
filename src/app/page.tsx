import Link from "next/link";

// ステップ1では画面の枠だけ。中身はステップ3（F-01, F-02）・ステップ4（F-03）で作る
const cards = [
  { title: "条件を入れる", note: "完成尺・テロップ量・オプション・納品希望日" },
  { title: "見積もり金額", note: "合計金額と内訳。納期が近いと特急料金がつく" },
  { title: "返信文", note: "クライアントにそのまま送れる文面をコピー" },
];

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
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((card, i) => (
            <section
              key={card.title}
              className={`rounded-lg border border-line bg-panel p-4 ${i === 0 ? "md:row-span-2" : ""}`}
            >
              <h2 className="mb-2 border-b border-dashed border-line pb-2 font-bold">
                {card.title}
              </h2>
              <p className="text-sm text-ink-soft">{card.note}</p>
              <p className="mt-4 text-xs text-ink-soft">（準備中）</p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
