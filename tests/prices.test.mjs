// 料金表の読み込み（src/lib/prices.ts）のテスト。npm test で実行する
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  DEFAULT_PRICES,
  isValidPrice,
  parsePrices,
} from "../src/lib/prices.ts";

const SAVED = {
  base: 5000,
  perMinute: 1500,
  telopKeyPerMinute: 400,
  telopFullPerMinute: 1000,
  bgm: 0,
  thumbnail: 3000,
  rushPercent: 50,
};

describe("parsePrices（F-04）", () => {
  test("未保存なら初期値", () => {
    assert.deepEqual(parsePrices(null), {
      prices: DEFAULT_PRICES,
      repaired: false,
    });
  });

  test("正しく保存された値はそのまま使う", () => {
    assert.deepEqual(parsePrices(JSON.stringify(SAVED)), {
      prices: SAVED,
      repaired: false,
    });
  });

  test("JSON として読めなければ初期値", () => {
    for (const raw of ["{abc", "", "null", "123"]) {
      assert.deepEqual(parsePrices(raw), {
        prices: DEFAULT_PRICES,
        repaired: true,
      });
    }
  });

  test("読めない項目だけ初期値に戻し、ほかは保存した値のまま", () => {
    for (const base of ["abc", -500, 1.5, "5000", null]) {
      const { prices, repaired } = parsePrices(
        JSON.stringify({ ...SAVED, base }),
      );
      assert.equal(repaired, true);
      assert.deepEqual(prices, { ...SAVED, base: DEFAULT_PRICES.base });
    }
  });

  test("特急が100%を超えたら初期値の30%", () => {
    const { prices } = parsePrices(
      JSON.stringify({ ...SAVED, rushPercent: 150 }),
    );
    assert.equal(prices.rushPercent, 30);
  });

  test("項目が足りない（昔の形）なら、その項目だけ初期値", () => {
    const withoutThumbnail = { ...SAVED };
    delete withoutThumbnail.thumbnail;
    const { prices, repaired } = parsePrices(JSON.stringify(withoutThumbnail));
    assert.equal(repaired, true);
    assert.deepEqual(prices, { ...SAVED, thumbnail: DEFAULT_PRICES.thumbnail });
  });
});

describe("isValidPrice", () => {
  test("0 と上限ちょうどは使える。上限を1でも超えたら使えない", () => {
    assert.equal(isValidPrice("base", 0), true);
    assert.equal(isValidPrice("base", 1_000_000), true);
    assert.equal(isValidPrice("base", 1_000_001), false);
    assert.equal(isValidPrice("rushPercent", 100), true);
    assert.equal(isValidPrice("rushPercent", 101), false);
  });
});
