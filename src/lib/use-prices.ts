"use client";

// 料金表をブラウザ（localStorage）に保存・読み込みする（F-04）
import { useSyncExternalStore } from "react";
import { STORAGE_KEY, parsePrices, type PriceTable } from "./prices";

// 同じタブで保存したことを、見積もり画面などに知らせるためのイベント
const CHANGE_EVENT = "henshu-mitsumori:prices-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange); // 別のタブでの変更
  window.addEventListener(CHANGE_EVENT, onChange); // このタブでの保存
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

// 文字列のまま返す。中身が同じなら同じ値と見なされ、描き直しが起きない
function readRaw() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // 保存が使えない環境では初期値で動かす
  }
}

// 保存された料金表。サーバーで描くときは初期値（loaded: false）
export function usePrices() {
  const raw = useSyncExternalStore(subscribe, readRaw, () => undefined);
  if (raw === undefined) {
    return { ...parsePrices(null), loaded: false };
  }
  return { ...parsePrices(raw), loaded: true };
}

function write(update: () => void) {
  try {
    update();
  } catch {
    return false; // Safari のプライベートモードなど、保存できない環境
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
  return true;
}

export function savePrices(prices: PriceTable) {
  return write(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(prices)));
}

export function resetPrices() {
  return write(() => localStorage.removeItem(STORAGE_KEY));
}
