"use client";

import { useState, useSyncExternalStore } from "react";
import {
  DEFAULT_PRICES,
  RUSH_DAYS,
  addDays,
  estimate,
  localDateString,
  validateInput,
  type Telop,
} from "@/lib/estimate";

const TELOP_OPTIONS: { value: Telop; label: string }[] = [
  { value: "none", label: "なし" },
  { value: "key", label: "要所のみ" },
  { value: "full", label: "全編" },
];

// 納品希望日の初期値は1週間後（特急にならない日）
const DEFAULT_LEAD_DAYS = 7;

const yen = (amount: number) => `${amount.toLocaleString("ja-JP")}円`;

// 「今日」はブラウザでだけ読む。サーバーの事前レンダリングでは null にして「読み込み中」を出す
// （cacheComponents のビルドで new Date() を呼ぶとエラーになり、UTC のサーバーとは日付もずれるため）
const noSubscribe = () => () => {};
function useToday() {
  return useSyncExternalStore(noSubscribe, localDateString, () => null);
}

const cardClass = "rounded-lg border border-line bg-panel p-4";
const cardTitleClass = "mb-3 border-b border-dashed border-line pb-2 font-bold";

export default function Estimator() {
  const today = useToday();
  const [minutes, setMinutes] = useState("10");
  const [telop, setTelop] = useState<Telop>("none");
  const [bgm, setBgm] = useState(false);
  const [thumbnail, setThumbnail] = useState(false);
  // null のあいだは「今日から1週間後」を使う（今日が分かるまで初期値を決められないため）
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null);

  if (today === null) {
    return (
      <div className={`${cardClass} text-sm text-ink-soft`}>読み込み中…</div>
    );
  }

  const input = {
    minutes: minutes === "" ? Number.NaN : Number(minutes),
    telop,
    bgm,
    thumbnail,
    deliveryDate: deliveryDate ?? addDays(today, DEFAULT_LEAD_DAYS),
  };
  const errors = validateInput(input, today);
  const result = errors.length === 0 ? estimate(input, today) : null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className={`${cardClass} md:row-span-2`}>
        <h2 className={cardTitleClass}>条件を入れる</h2>
        <div className="space-y-5">
          <label className="block">
            <span className="mb-1 block text-sm font-medium">完成尺</span>
            <span className="flex items-center gap-2">
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={60}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-24 rounded border border-line bg-paper px-3 py-2 text-right font-mono focus:border-ink focus:outline-none"
              />
              <span className="text-sm">分</span>
            </span>
          </label>

          <fieldset>
            <legend className="mb-1 text-sm font-medium">テロップ量</legend>
            <div className="grid grid-cols-3 gap-2">
              {TELOP_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="cursor-pointer rounded border border-line py-2 text-center text-sm has-checked:border-ink has-checked:bg-ink has-checked:text-panel has-focus-visible:outline-2 has-focus-visible:outline-accent"
                >
                  <input
                    type="radio"
                    name="telop"
                    value={option.value}
                    checked={telop === option.value}
                    onChange={() => setTelop(option.value)}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1 text-sm font-medium">オプション</legend>
            <div className="space-y-2">
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={bgm}
                  onChange={(e) => setBgm(e.target.checked)}
                  className="size-4 accent-ink"
                />
                BGM・効果音
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={thumbnail}
                  onChange={(e) => setThumbnail(e.target.checked)}
                  className="size-4 accent-ink"
                />
                サムネイル
              </label>
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-1 block text-sm font-medium">納品希望日</span>
            <input
              type="date"
              min={today}
              value={input.deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              className="rounded border border-line bg-paper px-3 py-2 font-mono focus:border-ink focus:outline-none"
            />
            <span className="mt-1 block text-xs text-ink-soft">
              今日から{RUSH_DAYS}日後までの納品は特急料金（
              {DEFAULT_PRICES.rushPercent}%）がつきます
            </span>
          </label>
        </div>
      </section>

      <section className={cardClass} aria-live="polite">
        <h2 className={cardTitleClass}>見積もり金額</h2>
        {result === null ? (
          <ul className="space-y-1 text-sm text-accent">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        ) : (
          <>
            <p className="mb-4 text-right">
              <span className="mr-2 text-sm text-ink-soft">合計（税込）</span>
              <span className="font-mono text-3xl font-semibold">
                {yen(result.total)}
              </span>
            </p>
            <table className="w-full text-sm">
              <tbody>
                {result.lines.map((line) => (
                  <tr key={line.label} className="border-t border-line">
                    <td className="py-1.5">{line.label}</td>
                    <td className="py-1.5 text-right font-mono">
                      {yen(line.amount)}
                    </td>
                  </tr>
                ))}
                {result.rush && (
                  <tr className="border-t border-line bg-accent-wash text-accent">
                    <td className="px-1 py-1.5">
                      特急料金（{DEFAULT_PRICES.rushPercent}%）
                      <span className="block text-xs">
                        {result.rush.daysLeft === 0
                          ? "当日納品のため"
                          : `納品まで${result.rush.daysLeft}日のため`}
                      </span>
                    </td>
                    <td className="px-1 py-1.5 text-right font-mono">
                      ＋{yen(result.rush.amount)}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </>
        )}
      </section>

      <section className={cardClass}>
        <h2 className={cardTitleClass}>返信文</h2>
        <p className="text-sm text-ink-soft">
          クライアントにそのまま送れる文面をコピー
        </p>
        <p className="mt-4 text-xs text-ink-soft">（準備中）</p>
      </section>
    </div>
  );
}
