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

**第0章 `primer.mdx` (order 0) — a non-era "数学の道具箱" (math toolbox).** It lives in the same `eras` collection but is **not one of the "8つの時代"**: it teaches the prerequisite math (vectors, dot/matrix, derivative/gradient, probability/expectation, log/KL, convex/norm, ML basics) so a zero-knowledge reader can climb to the chapters' `$$…$$`. `index.astro` separates it out (`primer = allEras.find(order===0)`, grid = `order >= 1`) and renders it as a distinct `.primer-card` above the 8-era grid; the hero CTA points at `order === 1` (dawn), with a secondary CTA to the primer. `[id].astro` shows a "CHAPTER 00 · 前提知識" header for `order === 0`. Each chapter's math-heavy "技術の中身" section opens with a `<Prereq>` callout linking back here.

**MDX component injection (non-obvious).**
Inside era MDX, `<Term>`, `<PersonCard>`, `<Milestone>`, `<Figure>`, `<Prereq>`, and `<Paper>` are used **without imports** — they are injected by `eras/[id].astro` via `<Content components={{ Term, PersonCard, Milestone, Figure, Prereq, Paper }} />`. Per-chapter SVG figure components (`src/components/figures/*.astro`) ARE imported at the top of each MDX file and passed into `<Figure>`. If you add a new MDX-level shared component, you must register it in that `components` object or MDX won't resolve it.

**Per-paper explanations (`<Paper>`).** Each era chapter ends with a `## 原典を読み解く` section of `<Paper>` cards — one per cited paper — placed **directly above** the original `### 原典・参考` bare link list (which is kept as a compact citation index; don't remove it). `<Paper title authors year venue? url? badge?>…explanation slot…</Paper>` (`src/components/Paper.astro`, modeled on `PersonCard`) is a script-free block card: header (year node, title, badge chip, authors·venue) + a `.prose`-styled slot body (so `$math$`/`<Term>`/lists work — do NOT add `.not-prose` to the body) + an optional "原文 ↗" link. Like `<PersonCard>` it must sit at a paragraph boundary. The explanations follow the site's warm-but-technical voice (what it solved → key idea → why it mattered → forward link). `url` is only set when the arXiv/official link is certain.

`<Prereq terms={["derivative","gradient",…]} />` is a block-level callout (like `<PersonCard>`, place it at a paragraph boundary) placed at the head of each math-heavy "技術の中身" section: it resolves each glossary id via `getTerm`, renders chips linking to `/glossary#<id>`, and links to the 第0章 primer. The glossary (`glossary.json`) carries not just named techniques but also **foundational math/ML primitives** (`vector`, `dot-product`, `matrix`, `derivative`, `gradient`, `expectation`, `gaussian`, `kl-divergence`, `supervised-learning`, `overfitting`, `token`, …) so `<Term>` popups cover the symbols that appear in the equations.

Figure components are self-contained: an inline `<svg viewBox="…">` plus a scoped `<style>` that colors strokes/fills with `hsl(var(--era-hue) … )` so each diagram auto-matches its era's accent (don't hard-code colors). `FormalNeuron.astro` is the reference to copy. Give each a unique name (often chapter-prefixed, e.g. `Tf…`/`Dl…`) to avoid collisions, and wrap usage in `<Figure caption="…" label="FIG n.m">`.

**Interactive demos (`src/components/demos/*.astro`).**
Most chapters have 2+ hands-on demos (chapter-prefixed names, e.g. `NeuronPlayground`/`DawnTuringMachine`, `PerceptronLearn`/`SymEliza`, `GradientDescent`/`WeBackpropChain`, `MarginDemo`/`StKernelTrick`, `ConvolutionDemo`/`DlReluVsSigmoid`/`DlWord2Vec`, `QLearningGrid`/`RlBandit`, `AttentionDemo`/`TfPositionalEncoding`/`TfTokenizer`, `DiffusionDemo`/`GaSoftmaxTemp`/`GaRlhf`; the primer adds `PrVectorDot`). Like figures, they are **imported at the top of each MDX** (not in the injected `components` object) and used inline. Each wraps its UI in the shared `<Demo title caption label="DEMO n.m">` chrome (`src/components/Demo.astro`) and carries a client `<script>`. **Pattern (copy `NeuronPlayground.astro`):** the script does `document.querySelectorAll("[data-xxx]").forEach(setup)` and scopes all DOM queries to that root element — so it works even with multiple instances and never uses module-global element refs. Controls reuse the global `.d-*` classes (`.d-btn`, `.d-chip`, `.d-slider`, `.d-panel`, `.d-val`, `.d-readout`, `.d-fire`…) defined in the "インタラクティブ・デモの共通コントロール" block of `globals.css`, and all accents use `hsl(var(--era-hue) …)` so each demo auto-matches its era color. Keep them type-clean (`astro check` covers `<script>` blocks; the project tsconfig is `strict` but not `strictest`, so unused-locals are hints not errors).

**Demo styling gotcha — injected elements need global CSS.** A demo whose script **creates DOM at runtime** (`createElement`/`createElementNS`/`innerHTML` — e.g. SVG bars, grid cells, chat bubbles, the readout's `<b>`) must not rely on a plain scoped `<style>`: Astro only adds its scope attribute to elements present at build time, so injected elements miss it and lose all styling (SVG `<rect>`/`<circle>` then fall back to **black fill**). Two fixes in this codebase: older demos wrap each injected-element selector in `:global(...)` (see `QLearningGrid`/`ConvolutionDemo`); the newer demos use `<style is:global>` for the whole block (safe because every selector is uniquely demo-prefixed). Either is fine — just never leave an injected-element selector plain-scoped.

**Data layer keyed by id.**
`src/data/glossary.json` and `src/data/people.json` are objects keyed by id. `src/lib/glossary.ts` / `src/lib/people.ts` load them and expose `getTerm`/`getPerson`/`allTerms`/`allPeople`. `<Term id="...">label</Term>` and `<PersonCard id="..." />` reference those keys. **Gotcha: a bad id does NOT fail the build** — `Term` renders just the label, `PersonCard` renders nothing, with only a `console.warn` in dev. Keep ids in MDX in sync with the JSON. The `/glossary` and `/people` pages render the full JSON.

**Person photos.**
A person may have an optional `photo` object (`{ src, license, by, source }`) in `people.json`; the image lives in `public/people/<id>.jpg`. `PersonCard` renders it as a circular avatar (via `siteLink("/" + photo.src)` — a JS-built `src` is NOT auto-base-resolved by Astro) with a small attribution line, and **falls back to the initials avatar when `photo` is absent**. Only freely-licensed portraits (Wikimedia Commons, PD/CC) are used; 7 people have no free image and intentionally keep initials. Photos were sourced via the Wikipedia REST/pageimages + Wikidata P18 APIs filtered to free licenses (one-off, not part of the build).

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
