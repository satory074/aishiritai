import data from "@/data/people.json";

export interface PersonLink {
  label: string;
  url: string;
}

export interface PersonPhoto {
  src: string; // public/ 以下の相対パス（例 "people/turing.jpg"）
  license: string; // ライセンス名（例 "CC BY-SA 4.0" / "Public domain"）
  by: string; // 撮影者・帰属
  source: string; // 取得元（Wikimedia Commons ファイルページ）
}

export interface Person {
  name: string; // 日本語表記
  en: string; // 英語表記
  born?: number; // 生年（不明なら省略）
  died?: number; // 没年
  role: string; // 肩書き・一言
  works: string[]; // 主要業績
  links?: PersonLink[]; // 外部リンク
  photo?: PersonPhoto; // 顔写真（自由ライセンスが見つかった人のみ。無ければイニシャル表示）
}

const people = data as Record<string, Person>;

export function getPerson(id: string): Person | undefined {
  return people[id];
}

export interface PersonWithId extends Person {
  id: string;
}

/** 生年順（不明は末尾）で全人物を返す（人物一覧ページ用）。 */
export function allPeople(): PersonWithId[] {
  return Object.entries(people)
    .map(([id, p]) => ({ id, ...p }))
    .sort((a, b) => (a.born ?? 9999) - (b.born ?? 9999));
}

/** 英語名のイニシャル（アバター用）。 */
export function initials(en: string): string {
  return en
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}
