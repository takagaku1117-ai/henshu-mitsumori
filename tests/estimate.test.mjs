// 見積もりの計算（src/lib/estimate.ts）のテスト。npm test で実行する
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { DEFAULT_PRICES } from "../src/lib/prices.ts";
import {
  addDays,
  daysUntil,
  estimate,
  isRush,
  localDateString,
  validateInput,
} from "../src/lib/estimate.ts";

const TODAY = "2026-10-30";

// 納期に余裕がある（特急にならない）入力を元に、変えたい所だけ上書きする
const input = (overrides = {}) => ({
  minutes: 10,
  telop: "none",
  bgm: false,
  thumbnail: false,
  deliveryDate: "2026-11-13",
  ...overrides,
});

describe("estimate（F-02）", () => {
  test("requirements.md の例：10分・テロップ全編・BGMあり は 22,000円", () => {
    const result = estimate(input({ telop: "full", bgm: true }), TODAY, DEFAULT_PRICES);
    assert.equal(result.total, 22000);
    assert.equal(result.subtotal, 22000);
    assert.equal(result.rush, null);
    assert.deepEqual(result.lines, [
      { label: "基本料金", amount: 3000 },
      { label: "編集（10分）", amount: 10000 },
      { label: "テロップ 全編（10分）", amount: 8000 },
      { label: "BGM・効果音", amount: 1000 },
    ]);
  });

  test("テロップは なし / 要所のみ / 全編 で 0 / 3,000 / 8,000円 変わる", () => {
    assert.equal(estimate(input({ telop: "none" }), TODAY, DEFAULT_PRICES).total, 13000);
    assert.equal(estimate(input({ telop: "key" }), TODAY, DEFAULT_PRICES).total, 16000);
    assert.equal(estimate(input({ telop: "full" }), TODAY, DEFAULT_PRICES).total, 21000);
  });

  test("サムネイルありで 2,000円 足される", () => {
    assert.equal(estimate(input({ thumbnail: true }), TODAY, DEFAULT_PRICES).total, 15000);
  });

  test("特急は小計の30%を足し、100円単位で切り上げる", () => {
    // 1分・テロップ要所：3,000 + 1,000 + 300 = 4,300 → ×1.3 = 5,590 → 5,600
    const result = estimate(
      input({ minutes: 1, telop: "key", deliveryDate: TODAY }),
      TODAY,
      DEFAULT_PRICES,
    );
    assert.equal(result.subtotal, 4300);
    assert.equal(result.total, 5600);
    assert.deepEqual(result.rush, { daysLeft: 0, amount: 1300 });
  });

  test("渡した料金表の単価で計算する", () => {
    const prices = { ...DEFAULT_PRICES, base: 5000, perMinute: 1500 };
    assert.equal(estimate(input(), TODAY, prices).total, 20000);
  });

  test("0円にした項目は内訳に出さない", () => {
    const prices = { ...DEFAULT_PRICES, bgm: 0 };
    const result = estimate(input({ bgm: true }), TODAY, prices);
    assert.equal(
      result.lines.some((line) => line.label === "BGM・効果音"),
      false,
    );
  });
});

describe("特急の境界（今日〜3日後は特急）", () => {
  test("当日（0日後）は特急", () => {
    assert.equal(isRush(daysUntil(TODAY, "2026-10-30")), true);
  });

  test("3日後は特急", () => {
    assert.equal(daysUntil(TODAY, "2026-11-02"), 3);
    assert.equal(isRush(3), true);
  });

  test("4日後は特急ではない", () => {
    const result = estimate(input({ deliveryDate: "2026-11-03" }), TODAY, DEFAULT_PRICES);
    assert.equal(result.rush, null);
  });

  test("月をまたいでも日数を正しく数える（10/30 → 11/2 は3日後）", () => {
    const result = estimate(input({ deliveryDate: "2026-11-02" }), TODAY, DEFAULT_PRICES);
    assert.equal(result.rush?.daysLeft, 3);
    assert.equal(result.total, 16900); // 13,000 × 1.3
  });

  test("年をまたいでも数えられる（12/30 → 1/2 は3日後）", () => {
    assert.equal(daysUntil("2026-12-30", "2027-01-02"), 3);
  });
});

describe("validateInput", () => {
  test("正しい入力ならエラーなし", () => {
    assert.deepEqual(validateInput(input(), TODAY), []);
  });

  test("完成尺は1〜60分の整数だけ", () => {
    for (const minutes of [0, 61, 1.5, Number.NaN]) {
      assert.deepEqual(validateInput(input({ minutes }), TODAY), [
        "完成尺は1〜60分の整数で入れてください",
      ]);
    }
    assert.deepEqual(validateInput(input({ minutes: 1 }), TODAY), []);
    assert.deepEqual(validateInput(input({ minutes: 60 }), TODAY), []);
  });

  test("納品希望日が空・過去ならエラー", () => {
    assert.deepEqual(validateInput(input({ deliveryDate: "" }), TODAY), [
      "納品希望日を選んでください",
    ]);
    assert.deepEqual(
      validateInput(input({ deliveryDate: "2026-10-29" }), TODAY),
      ["納品希望日に過去の日付は選べません"],
    );
  });
});

describe("addDays（納品希望日の初期値）", () => {
  test("7日後", () => {
    assert.equal(addDays("2026-10-30", 7), "2026-11-06");
  });

  test("月またぎ・年またぎ", () => {
    assert.equal(addDays("2026-01-31", 1), "2026-02-01");
    assert.equal(addDays("2026-12-29", 7), "2027-01-05");
  });

  test("7日後は特急にならない", () => {
    assert.equal(isRush(daysUntil(TODAY, addDays(TODAY, 7))), false);
  });
});

describe("localDateString", () => {
  test("端末の日付を YYYY-MM-DD にする", () => {
    assert.equal(localDateString(new Date(2026, 0, 5, 23, 59)), "2026-01-05");
  });
});
