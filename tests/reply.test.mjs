// 返信文の作成（src/lib/reply.ts）のテスト。npm test で実行する
import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { DEFAULT_PRICES, estimate } from "../src/lib/estimate.ts";
import { buildReply, formatJaDate } from "../src/lib/reply.ts";

const TODAY = "2026-10-30";

// requirements.md の例（10分・テロップ全編・BGMあり）を元に、変えたい所だけ上書きする
const reply = ({ clientName = "", ...overrides } = {}) => {
  const input = {
    minutes: 10,
    telop: "full",
    bgm: true,
    thumbnail: false,
    deliveryDate: "2026-11-06",
    ...overrides,
  };
  return buildReply({
    input,
    result: estimate(input, TODAY),
    clientName,
    today: TODAY,
    rushPercent: DEFAULT_PRICES.rushPercent,
  });
};

describe("formatJaDate", () => {
  test("同じ年なら月日と曜日", () => {
    assert.equal(formatJaDate("2026-11-06", TODAY), "11月6日（金）");
  });

  test("年が違えば年もつける", () => {
    assert.equal(
      formatJaDate("2027-01-05", "2026-12-30"),
      "2027年1月5日（火）",
    );
  });
});

describe("buildReply（F-03）", () => {
  test("宛名は前後の空白を取って「様」をつける", () => {
    assert.ok(reply({ clientName: "  山田 " }).startsWith("山田様\n"));
  });

  test("宛名が空・空白だけなら「ご担当者様」", () => {
    assert.ok(reply().startsWith("ご担当者様\n"));
    assert.ok(reply({ clientName: "　 " }).startsWith("ご担当者様\n"));
  });

  test("requirements.md の例：内容・金額・内訳4行が入り、特急の行はない", () => {
    const text = reply();
    for (const line of [
      "・完成尺：10分",
      "・テロップ：全編",
      "・BGM・効果音：あり",
      "・サムネイル：なし",
      "・納品日：11月6日（金）",
      "■ お見積もり金額：22,000円（税込）",
      "・基本料金：3,000円",
      "・編集（10分）：10,000円",
      "・テロップ 全編（10分）：8,000円",
      "・BGM・効果音：1,000円",
    ]) {
      assert.ok(text.includes(line), `「${line}」がない`);
    }
    assert.equal(text.includes("特急料金"), false);
  });

  test("特急なら理由つきの特急料金の行が入る", () => {
    const text = reply({ deliveryDate: TODAY });
    assert.ok(text.includes("■ お見積もり金額：28,600円（税込）"));
    assert.ok(text.includes("・特急料金（30%・当日納品のため）：6,600円"));
    assert.ok(text.includes("・納品日：10月30日（金）"));
  });
});
