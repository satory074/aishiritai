import data from "@/data/people.json";

export interface PersonLink {
  label: string;
  url: string;
}

export interface Person {
  name: string; // 日本語表記
  en: string; // 英語表記
  born?: number; // 生年（不明なら省略）
  died?: number; // 没年
  role: string; // 肩書き・一言
  works: string[]; // 主要業績
  links?: PersonLink[]; // 外部リンク
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
