// 見積もりの計算（F-02）。画面から切り離して tests/estimate.test.mjs でテストする
// Node の型の取り除き（type stripping）で読み込むので、enum などの TS 独自の書き方は使わない

export type Telop = "none" | "key" | "full";

export type PriceTable = {
  base: number;
  perMinute: number;
  telopKeyPerMinute: number;
  telopFullPerMinute: number;
  bgm: number;
  thumbnail: number;
  // 特急料金は小計の何％か。小数の誤差を避けるため 0.3 ではなく 30 で持つ
  rushPercent: number;
};

export const DEFAULT_PRICES: PriceTable = {
  base: 3000,
  perMinute: 1000,
  telopKeyPerMinute: 300,
  telopFullPerMinute: 800,
  bgm: 1000,
  thumbnail: 2000,
  rushPercent: 30,
};

export type EstimateInput = {
  minutes: number;
  telop: Telop;
  bgm: boolean;
  thumbnail: boolean;
  deliveryDate: string; // "YYYY-MM-DD"
};

export type EstimateLine = { label: string; amount: number };

export type Estimate = {
  lines: EstimateLine[];
  subtotal: number;
  rush: { daysLeft: number; amount: number } | null;
  total: number;
};

// 納品希望日が今日〜3日後（両端を含む）なら特急
const RUSH_DAYS = 3;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// "YYYY-MM-DD" を UTC の0時として数値にする。時刻・タイムゾーン・夏時間の影響を受けない
function toUtcDay(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function daysUntil(today: string, deliveryDate: string) {
  return Math.round(
    (toUtcDay(deliveryDate) - toUtcDay(today)) / (24 * 60 * 60 * 1000),
  );
}

export function isRush(daysLeft: number) {
  return daysLeft >= 0 && daysLeft <= RUSH_DAYS;
}

// 計算はブラウザで動かすので、見ている人の端末の「今日」を使う（Vercel のサーバーは UTC）
export function localDateString(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function validateInput(input: EstimateInput, today: string) {
  const errors: string[] = [];
  if (
    !Number.isInteger(input.minutes) ||
    input.minutes < 1 ||
    input.minutes > 60
  ) {
    errors.push("完成尺は1〜60分の整数で入れてください");
  }
  if (!DATE_PATTERN.test(input.deliveryDate)) {
    errors.push("納品希望日を選んでください");
  } else if (daysUntil(today, input.deliveryDate) < 0) {
    errors.push("納品希望日に過去の日付は選べません");
  }
  return errors;
}

// 入力は validateInput を通ったものとして計算する
export function estimate(
  input: EstimateInput,
  today: string,
  prices: PriceTable = DEFAULT_PRICES,
): Estimate {
  const { minutes } = input;
  const lines: EstimateLine[] = [
    { label: "基本料金", amount: prices.base },
    { label: `編集（${minutes}分）`, amount: prices.perMinute * minutes },
  ];
  if (input.telop === "key") {
    lines.push({
      label: `テロップ 要所のみ（${minutes}分）`,
      amount: prices.telopKeyPerMinute * minutes,
    });
  }
  if (input.telop === "full") {
    lines.push({
      label: `テロップ 全編（${minutes}分）`,
      amount: prices.telopFullPerMinute * minutes,
    });
  }
  if (input.bgm) lines.push({ label: "BGM・効果音", amount: prices.bgm });
  if (input.thumbnail) {
    lines.push({ label: "サムネイル", amount: prices.thumbnail });
  }

  const visibleLines = lines.filter((line) => line.amount > 0);
  const subtotal = visibleLines.reduce((sum, line) => sum + line.amount, 0);

  const daysLeft = daysUntil(today, input.deliveryDate);
  const rushPercent = isRush(daysLeft) ? prices.rushPercent : 0;
  // 整数だけで「小計 ×（100＋特急％）÷ 100 を100円単位で切り上げ」を計算する
  const total = Math.ceil((subtotal * (100 + rushPercent)) / 10000) * 100;

  return {
    lines: visibleLines,
    subtotal,
    // 切り上げぶんも特急料金に含め、内訳の合計と total がそろうようにする
    rush: rushPercent > 0 ? { daysLeft, amount: total - subtotal } : null,
    total,
  };
}
