import data from "@/data/glossary.json";

export interface GlossaryEntry {
  term: string; // 日本語の見出し
  reading?: string; // 英語名・読み
  def: string; // 定義（1〜2文）
  link?: string; // 詳細リンク（任意）
}

const glossary = data as Record<string, GlossaryEntry>;

export function getTerm(id: string): GlossaryEntry | undefined {
  return glossary[id];
}

export interface GlossaryEntryWithId extends GlossaryEntry {
  id: string;
}

/** 見出しの五十音/アルファベット順で全用語を返す（用語集ページ用）。 */
export function allTerms(): GlossaryEntryWithId[] {
  return Object.entries(glossary)
    .map(([id, e]) => ({ id, ...e }))
    .sort((a, b) => a.term.localeCompare(b.term, "ja"));
}
