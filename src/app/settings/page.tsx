import type { Metadata } from "next";
import SiteHeader from "../site-header";
import SettingsForm from "./settings-form";

export const metadata: Metadata = {
  title: "料金表の設定｜編集ミツモリ",
};

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader link={{ href: "/", label: "見積もりへ戻る" }} />

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6">
        <h1 className="mb-2 text-lg font-bold">料金表の設定</h1>
        <p className="mb-6 text-sm text-ink-soft">
          自分の単価に変えて保存すると、見積もりと返信文に反映されます。保存先はこのブラウザだけで、サーバーには送りません。
        </p>
        <SettingsForm />
      </main>
    </div>
  );
}
