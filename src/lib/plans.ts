// 松竹梅の3パターン（F-05・発展アイデア①）。依頼された条件を「竹」にして、
// 安い「梅」と充実した「松」を並べる。tests/plans.test.mjs でテストする
import type { EstimateInput, Telop } from "./estimate";

export type PlanId = "ume" | "take" | "matsu";

export type Plan = {
  id: PlanId;
  name: string;
  label: string;
  input: EstimateInput;
};

// テロップを1段下げる（全編 → 要所のみ → なし）
const LOWER_TELOP: Record<Telop, Telop> = {
  full: "key",
  key: "none",
  none: "none",
};

const sameContents = (a: EstimateInput, b: EstimateInput) =>
  a.telop === b.telop && a.bgm === b.bgm && a.thumbnail === b.thumbnail;

// 梅・竹・松の順に返す。中身が竹と同じになるプランは並べても意味がないので除く
// 完成尺と納品希望日は3プランとも依頼どおり
export function buildPlans(input: EstimateInput): Plan[] {
  const take: Plan = { id: "take", name: "竹", label: "ご依頼どおり", input };
  const ume: Plan = {
    id: "ume",
    name: "梅",
    label: "シンプル",
    input: {
      ...input,
      telop: LOWER_TELOP[input.telop],
      bgm: false,
      thumbnail: false,
    },
  };
  const matsu: Plan = {
    id: "matsu",
    name: "松",
    label: "しっかり",
    input: { ...input, telop: "full", bgm: true, thumbnail: true },
  };
  return [ume, take, matsu].filter(
    (plan) => plan.id === "take" || !sameContents(plan.input, input),
  );
}
