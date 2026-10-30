"use client";

import Link from "next/link";
import { useRef, useState, useSyncExternalStore } from "react";
import {
  RUSH_DAYS,
  addDays,
  estimate,
  localDateString,
  validateInput,
  type Telop,
} from "@/lib/estimate";
import { buildPlans } from "@/lib/plans";
import {
  TELOP_LABELS,
  buildReply,
  describePlan,
  rushReason,
  yen,
} from "@/lib/reply";
import { usePrices } from "@/lib/use-prices";

const TELOP_OPTIONS = Object.entries(TELOP_LABELS) as [Telop, string][];

// 納品希望日の初期値は1週間後（特急にならない日）
const DEFAULT_LEAD_DAYS = 7;

type CopyState = "idle" | "copied" | "failed";

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
  const { prices, repaired } = usePrices();
  const [minutes, setMinutes] = useState("10");
  const [telop, setTelop] = useState<Telop>("none");
  const [bgm, setBgm] = useState(false);
  const [thumbnail, setThumbnail] = useState(false);
  // null のあいだは「今日から1週間後」を使う（今日が分かるまで初期値を決められないため）
  const [deliveryDate, setDeliveryDate] = useState<string | null>(null);
  // 宛名は画面の中だけで使い、どこにも保存しない
  const [clientName, setClientName] = useState("");
  const [includePlans, setIncludePlans] = useState(false);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const copyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

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
  const result = errors.length === 0 ? estimate(input, today, prices) : null;
  // 松竹梅（F-05）。竹＝依頼どおりなので、金額は上の result と同じになる
  const plans =
    result === null
      ? []
      : buildPlans(input).map((plan) => ({
          ...plan,
          total: estimate(plan.input, today, prices).total,
        }));
  const reply =
    result === null
      ? null
      : buildReply({
          input,
          result,
          clientName,
          today,
          rushPercent: prices.rushPercent,
          otherPlans: includePlans
            ? plans.filter((plan) => plan.id !== "take")
            : [],
        });

  async function copyReply() {
    if (reply === null) return;
    clearTimeout(copyTimer.current);
    try {
      await navigator.clipboard.writeText(reply);
      setCopyState("copied");
      copyTimer.current = setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("failed");
    }
  }

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
              {TELOP_OPTIONS.map(([value, label]) => (
                <label
                  key={value}
                  className="cursor-pointer rounded border border-line py-2 text-center text-sm has-checked:border-ink has-checked:bg-ink has-checked:text-panel has-focus-visible:outline-2 has-focus-visible:outline-accent"
                >
                  <input
                    type="radio"
                    name="telop"
                    value={value}
                    checked={telop === value}
                    onChange={() => setTelop(value)}
                    className="sr-only"
                  />
                  {label}
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
              {prices.rushPercent}%）がつきます
            </span>
          </label>
        </div>
      </section>

      <section className={cardClass} aria-live="polite">
        <h2 className={cardTitleClass}>見積もり金額</h2>
        {repaired && (
          <p className="mb-3 rounded bg-accent-wash p-2 text-xs text-accent">
            保存された料金表の一部が読めなかったため、その項目は初期値で計算しています。
            <Link href="/settings" className="underline">
              料金表を確認
            </Link>
          </p>
        )}
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
                      特急料金（{prices.rushPercent}%）
                      <span className="block text-xs">
                        {rushReason(result.rush.daysLeft)}
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
        <label className="mb-3 block">
          <span className="mb-1 block text-sm font-medium">宛名（任意）</span>
          <span className="flex items-center gap-2">
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="例：山田"
              className="w-full min-w-0 rounded border border-line bg-paper px-3 py-2 focus:border-ink focus:outline-none"
            />
            <span className="shrink-0 text-sm">様</span>
          </span>
        </label>
        <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includePlans}
            onChange={(e) => setIncludePlans(e.target.checked)}
            className="size-4 accent-ink"
          />
          返信文に松竹梅のプランも入れる
        </label>
        {reply === null ? (
          <p className="text-sm text-ink-soft">条件を直すと返信文ができます</p>
        ) : (
          <textarea
            readOnly
            value={reply}
            rows={12}
            aria-label="返信文"
            className="w-full resize-y rounded border border-line bg-paper p-3 text-sm leading-relaxed"
          />
        )}
        <button
          type="button"
          onClick={copyReply}
          disabled={reply === null}
          className="mt-3 w-full rounded bg-ink py-2.5 text-sm font-bold text-panel hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copyState === "copied" ? "コピーしました ✓" : "返信文をコピー"}
        </button>
        {copyState === "failed" && (
          <p className="mt-2 text-xs text-accent" role="alert">
            コピーできませんでした。文面を長押し（右クリック）してコピーしてください
          </p>
        )}
      </section>

      {plans.length > 0 && (
        <section className={`${cardClass} md:col-span-2`}>
          <h2 className={cardTitleClass}>松竹梅で提案</h2>
          <p className="mb-3 text-xs text-ink-soft">
            ご依頼どおりの「竹」に、安い「梅」と充実した「松」を並べます。完成尺と納品日は同じです。
          </p>
          <ul className="grid gap-3 sm:grid-cols-3">
            {plans.map((plan) => (
              <li
                key={plan.id}
                className={`rounded border p-3 ${plan.id === "take" ? "border-2 border-ink" : "border-line"}`}
              >
                <p className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="font-bold">
                    {plan.name}
                    <span className="ml-1 text-xs font-normal text-ink-soft">
                      {plan.label}
                    </span>
                  </span>
                  <span className="font-mono text-lg font-semibold">
                    {yen(plan.total)}
                  </span>
                </p>
                <p className="text-xs text-ink-soft">
                  {describePlan(plan.input)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
