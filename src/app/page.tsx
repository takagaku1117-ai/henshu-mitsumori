import Estimator from "./estimator";
import SiteHeader from "./site-header";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader link={{ href: "/settings", label: "料金表" }} />

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <h1 className="sr-only">動画編集の見積もり</h1>
        <p className="mb-6 text-sm text-ink-soft">
          案件の条件を入れるだけで、見積もり金額と返信文がすぐできます。
        </p>
        <Estimator />
      </main>
    </div>
  );
}
