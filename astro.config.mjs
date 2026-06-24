// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import mdx from "@astrojs/mdx";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

// GitHub Pages のプロジェクトページ運用前提（https://<user>.github.io/aishiritai/）。
// カスタムドメインにする場合は base を空文字に変更すること。
const repoName = "aishiritai";
const ghUser = process.env.GH_USER ?? "satory074";

export default defineConfig({
  site: `https://${ghUser}.github.io`,
  base: `/${repoName}`,
  trailingSlash: "ignore",
  integrations: [mdx()],
  markdown: {
    // 技術ガチ勢向け：本文中の数式を KaTeX で描画する（CSS は Layout で import）。
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
  vite: {
    // Tailwind v4 Vite plugin: cast to any to bridge Vite version typing mismatch
    plugins: [/** @type {any} */ (tailwindcss())],
  },
});
