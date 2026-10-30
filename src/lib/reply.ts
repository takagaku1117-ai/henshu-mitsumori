// 返信文の作成（F-03）。画面から切り離して tests/reply.test.mjs でテストする
// estimate.ts からは型だけを読み込む（Node の型の取り除きで import ごと消えるので、テストからも読める）
import type { Estimate, EstimateInput, Telop } from "./estimate";

export const TELOP_LABELS: Record<Telop, string> = {
  none: "なし",
  key: "要所のみ",
  full: "全編",
};

const WEEKDAYS = "日月火水木金土";

export const yen = (amount: number) => `${amount.toLocaleString("ja-JP")}円`;

export function rushReason(daysLeft: number) {
  return daysLeft === 0 ? "当日納品のため" : `納品まで${daysLeft}日のため`;
}

// "2026-11-06" → "11月6日（金）"。今日と年が違うときは "2027年1月5日（火）" と年もつける
// 曜日は UTC で出す（ブラウザのタイムゾーンで日付がずれないように）
export function formatJaDate(date: string, today: string) {
  const [y, m, d] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const year = date.slice(0, 4) === today.slice(0, 4) ? "" : `${y}年`;
  return `${year}${m}月${d}日（${weekday}）`;
}

type ReplyParams = {
  input: EstimateInput;
  result: Estimate;
  clientName: string;
  today: string;
  rushPercent: number;
};

export function buildReply({
  input,
  result,
  clientName,
  today,
  rushPercent,
}: ReplyParams) {
  const name = clientName.trim();
  const yesNo = (value: boolean) => (value ? "あり" : "なし");
  const breakdown = result.lines.map(
    (line) => `・${line.label}：${yen(line.amount)}`,
  );
  if (result.rush) {
    breakdown.push(
      `・特急料金（${rushPercent}%・${rushReason(result.rush.daysLeft)}）：${yen(result.rush.amount)}`,
    );
  }

  return [
    `${name === "" ? "ご担当者" : name}様`,
    "",
    "ご相談いただきありがとうございます。",
    "以下の内容でお見積もりいたしました。",
    "",
    "■ 内容",
    `・完成尺：${input.minutes}分`,
    `・テロップ：${TELOP_LABELS[input.telop]}`,
    `・BGM・効果音：${yesNo(input.bgm)}`,
    `・サムネイル：${yesNo(input.thumbnail)}`,
    `・納品日：${formatJaDate(input.deliveryDate, today)}`,
    "",
    `■ お見積もり金額：${yen(result.total)}（税込）`,
    ...breakdown,
    "",
    "ご検討のほど、よろしくお願いいたします。",
  ].join("\n");
}
