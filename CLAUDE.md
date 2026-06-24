# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`aishiritai` — a Japanese learning site that traces the history of AI from Turing's era to generative AI, in 8 era-chapters, aimed at a technically sophisticated audience (real equations, architecture diagrams, original-paper links). Astro 5 + Tailwind v4 + TypeScript, deployed to GitHub Pages at `https://satory074.github.io/aishiritai/` (base path `/aishiritai`). It is a static, content-driven site — there is no runtime backend and no test suite.

## Commands

```bash
npm install
npm run dev        # dev server → http://localhost:4321/aishiritai/
npm run build      # production build to dist/ (the de-facto correctness gate)
npm run typecheck  # astro check (run this + build before considering work done)
```

There are no unit tests. `npm run typecheck` and `npm run build` together are the verification path; the build is stricter and catches MDX/content-schema errors that dev does not.

Deploy: pushing to `main` triggers `.github/workflows/deploy.yml` (build with `GH_USER` injected → `upload-pages-artifact` → `deploy-pages`). Pages source is set to "GitHub Actions".

## Architecture (the parts that span multiple files)

**Content pipeline — one MDX file per era.**
`src/content.config.ts` defines the `eras` collection via a `glob` loader over `src/content/eras/*.mdx`, with a Zod schema (`order`, `title`, `subtitle?`, `period`, `summary`, `topics[]`, `hue`, `people[]`). The **filename is the URL slug** and the collection entry id. `src/pages/eras/[id].astro` does `getStaticPaths` over the collection sorted by `order`, renders the MDX via `render()`, and derives prev/next from `order`. `src/pages/index.astro` lists all eras (sorted by `order`) as `EraCard`s. **To add a chapter: drop a new `.mdx` with valid frontmatter into `src/content/eras/` — it auto-routes and auto-appears on the index.**

**MDX component injection (non-obvious).**
Inside era MDX, `<Term>`, `<PersonCard>`, `<Milestone>`, and `<Figure>` are used **without imports** — they are injected by `eras/[id].astro` via `<Content components={{ Term, PersonCard, Milestone, Figure }} />`. Per-chapter SVG figure components (`src/components/figures/*.astro`) ARE imported at the top of each MDX file and passed into `<Figure>`. If you add a new MDX-level shared component, you must register it in that `components` object or MDX won't resolve it.

**Data layer keyed by id.**
`src/data/glossary.json` and `src/data/people.json` are objects keyed by id. `src/lib/glossary.ts` / `src/lib/people.ts` load them and expose `getTerm`/`getPerson`/`allTerms`/`allPeople`. `<Term id="...">label</Term>` and `<PersonCard id="..." />` reference those keys. **Gotcha: a bad id does NOT fail the build** — `Term` renders just the label, `PersonCard` renders nothing, with only a `console.warn` in dev. Keep ids in MDX in sync with the JSON. The `/glossary` and `/people` pages render the full JSON.

**Per-era theming via a single CSS variable.**
All accent color flows from `--era-hue`. Each era's `hue` (frontmatter) is passed as `Layout`'s `eraHue` prop and set as an inline style on `<body>`; every component composes accents as `hsl(var(--era-hue) ...)`. Design tokens live in `:root` in `src/styles/globals.css`. The `.prose` block in that file styles the **raw HTML that MDX emits** (h2/h3/p/ul/blockquote/code), and auto-prepends the `##`/`###` markers before headings — so in MDX, write `## 見出し` (not `# 見出し`) and do not add your own marker.

**Base path.**
`base` is `/aishiritai`. Astro auto-resolves `<a href>`/`<img src>`. For links built in JS or `getStaticPaths`, use `siteLink()` from `src/lib/url.ts` (and `absUrl()` for OGP/absolute URLs).

## Gotchas

- **KaTeX rendering is fragile — the KaTeX block in `globals.css` is load-bearing.** Two fixes there must not be removed or √/fractions break on the dark theme: (1) `.katex, .katex * { box-sizing: content-box }` undoes the global `box-sizing: border-box`, which otherwise corrupts KaTeX's rule/√/fraction-bar sizing; (2) `.katex .sqrt > .vlist-t .svg-align { z-index: 1 }` lifts the radicand above KaTeX's stretchy surd SVG (`width:400em`), which otherwise paints over and hides the content under the root. Math plugins (`remark-math` + `rehype-katex`) are configured in `astro.config.mjs` under `markdown`; the KaTeX CSS is imported in `Layout.astro`.
- **`<PersonCard>` is a block element** — in MDX it must sit on its own line at a paragraph boundary (blank line before/after), never inside a sentence.
- **MDX caveats:** avoid bare `<` / `>` in prose (parsed as JSX — use 未満/超 or wrap in `$...$`); only `<span class="mono">` is used as inline raw HTML besides the injected components.
- **Tailwind v4 + Astro type mismatch:** the Tailwind Vite plugin is wrapped in an `any` cast in `astro.config.mjs` (`plugins: [/** @type {any} */ (tailwindcss())]`). Tailwind is loaded via `@import "tailwindcss"` at the top of `globals.css`.
- Mobile glossary-popup toggling uses a small `data-term` delegated click handler in `Layout.astro`; desktop relies on CSS `:hover`/`:focus-within` (no JS).

## Content conventions

Each era chapter follows: intro connecting from the previous era → `## 概要` → `## 主要マイルストーン` (stacked `<Milestone>`) → `## 技術の中身…` (the technical core, with `$…$`/`$$…$$` math and optionally a `<Figure>`) → `<PersonCard>`s at paragraph boundaries → `## なぜこの時代が重要か → 次の時代へ` (bridge) → `### 原典・参考`. Use `dawn.mdx` as the canonical reference. Original-paper links should only be added when the URL is certain (arXiv/official); otherwise cite as plain text.
