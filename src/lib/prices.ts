// 料金表（F-04）。初期値と、ブラウザに保存した値の読み込み。tests/prices.test.mjs でテストする
// estimate.ts・reply.ts からは型だけを読み込ませるため、値（DEFAULT_PRICES）はこのファイルに置く
// （Node の型の取り除きは import type を消すだけで、拡張子なしの値の import は解決できないため）

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

export const STORAGE_KEY = "henshu-mitsumori:prices";

const YEN_MAX = 1_000_000;

export const PRICE_FIELDS: {
  key: keyof PriceTable;
  label: string;
  unit: "円" | "%";
  max: number;
}[] = [
  { key: "base", label: "基本料金", unit: "円", max: YEN_MAX },
  { key: "perMinute", label: "完成尺1分あたり", unit: "円", max: YEN_MAX },
  {
    key: "telopKeyPerMinute",
    label: "テロップ 要所のみ（1分あたり）",
    unit: "円",
    max: YEN_MAX,
  },
  {
    key: "telopFullPerMinute",
    label: "テロップ 全編（1分あたり）",
    unit: "円",
    max: YEN_MAX,
  },
  { key: "bgm", label: "BGM・効果音", unit: "円", max: YEN_MAX },
  { key: "thumbnail", label: "サムネイル", unit: "円", max: YEN_MAX },
  { key: "rushPercent", label: "特急料金（小計の）", unit: "%", max: 100 },
];

const MAX_BY_KEY = Object.fromEntries(
  PRICE_FIELDS.map((field) => [field.key, field.max]),
) as Record<keyof PriceTable, number>;

// 0以上の整数で、項目ごとの上限以下なら使える
export function isValidPrice(key: keyof PriceTable, value: unknown) {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_BY_KEY[key]
  );
}

// 保存された文字列を料金表にする。読めない項目だけ初期値に戻し、戻したら repaired: true
// （全部を初期値にすると、ちゃんと保存できていた他の単価まで消えてしまうため）
export function parsePrices(raw: string | null): {
  prices: PriceTable;
  repaired: boolean;
} {
  if (raw === null) return { prices: DEFAULT_PRICES, repaired: false };

  let saved: unknown;
  try {
    saved = JSON.parse(raw);
  } catch {
    return { prices: DEFAULT_PRICES, repaired: true };
  }
  if (typeof saved !== "object" || saved === null) {
    return { prices: DEFAULT_PRICES, repaired: true };
  }

  const record = saved as Record<string, unknown>;
  const prices = { ...DEFAULT_PRICES };
  let repaired = false;
  for (const { key } of PRICE_FIELDS) {
    const value = record[key];
    if (isValidPrice(key, value)) {
      prices[key] = value as number;
    } else {
      repaired = true;
    }
  }
  return { prices, repaired };
}
