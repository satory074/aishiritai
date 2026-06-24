import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// 各時代＝1 MDX ファイル（src/content/eras/<slug>.mdx）。
// glob loader のエントリ id はファイル名（拡張子なし）＝ URL スラッグになる。
const eras = defineCollection({
  loader: glob({ pattern: "*.mdx", base: "./src/content/eras" }),
  schema: z.object({
    order: z.number().int(), // 章の並び順（1〜8）
    title: z.string(), // 邦題
    subtitle: z.string().optional(), // 補助タイトル
    period: z.string(), // "1936–1956" など
    summary: z.string(), // 目次カード用の一文
    topics: z.array(z.string()).default([]), // 目次カードに出す主要トピック
    hue: z.number().int(), // 時代の色相（188〜322）
    people: z.array(z.string()).default([]), // 主要人物 id（people.json のキー）
  }),
});

export const collections = { eras };
