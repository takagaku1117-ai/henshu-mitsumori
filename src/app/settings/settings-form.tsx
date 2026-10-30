"use client";

import { useState } from "react";
import { estimate } from "@/lib/estimate";
import {
  DEFAULT_PRICES,
  PRICE_FIELDS,
  isValidPrice,
  type PriceTable,
} from "@/lib/prices";
import { yen } from "@/lib/reply";
import { resetPrices, savePrices, usePrices } from "@/lib/use-prices";

type Draft = Record<keyof PriceTable, string>;
type SaveState = "idle" | "saved" | "reset" | "failed";

// 単価を変えたときの金額の変化を見せるための例（requirements.md の例と同じ条件・特急なし）
const SAMPLE_INPUT = {
  minutes: 10,
  telop: "full",
  bgm: true,
  thumbnail: false,
  deliveryDate: "2026-01-08",
} as const;
const SAMPLE_TODAY = "2026-01-01";

const toDraft = (prices: PriceTable) =>
  Object.fromEntries(
    PRICE_FIELDS.map(({ key }) => [key, String(prices[key])]),
  ) as Draft;

// 入力欄の文字列を料金表にする。1つでも使えない値があれば null
function fromDraft(draft: Draft): PriceTable | null {
  const prices = { ...DEFAULT_PRICES };
  for (const { key } of PRICE_FIELDS) {
    const value = draft[key].trim() === "" ? Number.NaN : Number(draft[key]);
    if (!isValidPrice(key, value)) return null;
    prices[key] = value;
  }
  return prices;
}

export default function SettingsForm() {
  const { prices, repaired, loaded } = usePrices();
  // 保存した値を入力欄の初期値にするため、ブラウザで読めるまでフォームを出さない
  if (!loaded) {
    return <p className="text-sm text-ink-soft">読み込み中…</p>;
  }
  return <PriceForm initial={prices} repaired={repaired} />;
}

function PriceForm({
  initial,
  repaired,
}: {
  initial: PriceTable;
  repaired: boolean;
}) {
  const [draft, setDraft] = useState(() => toDraft(initial));
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const parsed = fromDraft(draft);

  function update(key: keyof PriceTable, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaveState("idle");
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (parsed === null) return;
    setSaveState(savePrices(parsed) ? "saved" : "failed");
  }

  function handleReset() {
    setDraft(toDraft(DEFAULT_PRICES));
    setSaveState(resetPrices() ? "reset" : "failed");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-line bg-panel p-4"
    >
      {repaired && saveState === "idle" && (
        <p className="mb-4 rounded bg-accent-wash p-3 text-sm text-accent">
          保存された料金表の一部が読めなかったため、その項目を初期値にしています。確かめて保存し直してください。
        </p>
      )}

      <div className="space-y-4">
        {PRICE_FIELDS.map(({ key, label, unit, max }) => {
          const value = draft[key];
          const invalid =
            value.trim() === "" || !isValidPrice(key, Number(value));
          return (
            <label key={key} className="block">
              <span className="mb-1 flex items-baseline justify-between gap-2 text-sm font-medium">
                {label}
                <span className="text-xs font-normal text-ink-soft">
                  初期値 {DEFAULT_PRICES[key].toLocaleString("ja-JP")}
                  {unit}
                </span>
              </span>
              <span className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={max}
                  step={1}
                  value={value}
                  onChange={(e) => update(key, e.target.value)}
                  aria-invalid={invalid}
                  className="w-full min-w-0 rounded border border-line bg-paper px-3 py-2 text-right font-mono focus:border-ink focus:outline-none aria-invalid:border-accent"
                />
                <span className="w-4 shrink-0 text-sm">{unit}</span>
              </span>
              {invalid && (
                <span className="mt-1 block text-xs text-accent">
                  0〜{max.toLocaleString("ja-JP")}の整数で入れてください
                </span>
              )}
            </label>
          );
        })}
      </div>

      <p className="mt-6 border-t border-dashed border-line pt-4 text-sm text-ink-soft">
        例：10分・テロップ全編・BGMあり →{" "}
        <span className="font-mono text-base font-semibold text-ink">
          {parsed === null
            ? "—"
            : yen(estimate(SAMPLE_INPUT, SAMPLE_TODAY, parsed).total)}
        </span>
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row-reverse">
        <button
          type="submit"
          disabled={parsed === null}
          className="flex-1 rounded bg-ink py-2.5 text-sm font-bold text-panel hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saveState === "saved" ? "保存しました ✓" : "保存する"}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="flex-1 rounded border border-line py-2.5 text-sm text-ink-soft hover:border-ink hover:text-ink"
        >
          {saveState === "reset" ? "初期値に戻しました ✓" : "初期値に戻す"}
        </button>
      </div>
      {saveState === "failed" && (
        <p className="mt-2 text-xs text-accent" role="alert">
          このブラウザでは保存できませんでした（プライベートモードなど）。見積もりは初期値で計算されます。
        </p>
      )}
    </form>
  );
}
