// base path（/aishiritai）を意識せずに内部リンクを組むためのヘルパ。
// Astro は <a href> / <img src> 等の HTML 属性は自動で base 解決するが、
// JS で文字列を組む場面・getStaticPaths の href 生成では本関数を必ず使う。

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export function siteLink(path: string): string {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${base}${path}`;
}

const SITE_ORIGIN = "https://satory074.github.io";

/** base path を含む絶対 URL（OGP / JSON-LD など host が必須の場面で使う）。 */
export function absUrl(path: string): string {
  return `${SITE_ORIGIN}${siteLink(path)}`;
}
