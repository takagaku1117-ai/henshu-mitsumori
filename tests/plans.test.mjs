// 松竹梅の3パターン（src/lib/plans.ts）と、返信文への載せ方のテスト。npm test で実行する
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { estimate } from "../src/lib/estimate.ts";
import { buildPlans } from "../src/lib/plans.ts";
import { DEFAULT_PRICES } from "../src/lib/prices.ts";
import { buildReply, describePlan } from "../src/lib/reply.ts";

const TODAY = "2026-10-30";

// requirements.md の例（10分・テロップ全編・BGMあり）を元に、変えたい所だけ上書きする
const input = (overrides = {}) => ({
  minutes: 10,
  telop: "full",
  bgm: true,
  thumbnail: false,
  deliveryDate: "2026-11-06",
  ...overrides,
});

const total = (plan) => estimate(plan.input, TODAY, DEFAULT_PRICES).total;

describe("buildPlans（F-05）", () => {
  test("22,000円の例：梅 16,000円・竹 22,000円・松 24,000円", () => {
    const plans = buildPlans(input());
    assert.deepEqual(
      plans.map((plan) => plan.id),
      ["ume", "take", "matsu"],
    );
    assert.deepEqual(plans.map(total), [16000, 22000, 24000]);
  });

  test("梅はテロップを1段下げ、オプションを外す", () => {
    const [ume] = buildPlans(input());
    assert.equal(ume.input.telop, "key");
    assert.equal(ume.input.bgm, false);
    assert.equal(ume.input.thumbnail, false);
    assert.equal(buildPlans(input({ telop: "key" }))[0].input.telop, "none");
  });

  test("テロップなし・オプションなしの依頼なら、梅は竹と同じなので出さない", () => {
    const plans = buildPlans(input({ telop: "none", bgm: false }));
    assert.deepEqual(
      plans.map((plan) => plan.id),
      ["take", "matsu"],
    );
  });

  test("全部ありの依頼なら、松は竹と同じなので出さない", () => {
    const plans = buildPlans(input({ thumbnail: true }));
    assert.deepEqual(
      plans.map((plan) => plan.id),
      ["ume", "take"],
    );
  });

  test("完成尺と納品希望日は全プランで依頼どおり（特急なら全プランに特急）", () => {
    const plans = buildPlans(input({ minutes: 3, deliveryDate: TODAY }));
    for (const plan of plans) {
      assert.equal(plan.input.minutes, 3);
      assert.equal(plan.input.deliveryDate, TODAY);
      assert.notEqual(estimate(plan.input, TODAY, DEFAULT_PRICES).rush, null);
    }
  });
});

describe("describePlan", () => {
  test("中身を「・」でつなぐ。何もなければ「編集のみ」", () => {
    assert.equal(
      describePlan(input({ thumbnail: true })),
      "テロップ 全編・BGM・効果音・サムネイル",
    );
    assert.equal(
      describePlan(input({ telop: "none", bgm: false })),
      "編集のみ",
    );
  });
});

describe("buildReply にほかのプランを載せる", () => {
  const reply = (otherPlans) => {
    const base = input();
    return buildReply({
      input: base,
      result: estimate(base, TODAY, DEFAULT_PRICES),
      clientName: "",
      today: TODAY,
      rushPercent: DEFAULT_PRICES.rushPercent,
      otherPlans,
    });
  };

  test("渡したときだけ「ほかのプラン」が入る", () => {
    const others = buildPlans(input())
      .filter((plan) => plan.id !== "take")
      .map((plan) => ({ ...plan, total: total(plan) }));
    const text = reply(others);
    assert.ok(text.includes("■ ほかのプランもご用意できます"));
    assert.ok(
      text.includes("・梅（シンプル）：テロップ 要所のみ … 16,000円（税込）"),
    );
    assert.ok(
      text.includes(
        "・松（しっかり）：テロップ 全編・BGM・効果音・サムネイル … 24,000円（税込）",
      ),
    );
    assert.equal(reply(undefined).includes("ほかのプラン"), false);
    assert.equal(reply([]).includes("ほかのプラン"), false);
  });
});
