#!/usr/bin/env node
/**
 * generate-readme-assets.mjs — single source of truth for every SVG under assets/.
 *
 * Emits the GitHub profile README asset suite in the Kinetic Cobalt design
 * system (github.com/carlomigueldy/senior-portfolio — docs/DESIGN.md):
 * cool-paper light-canonical ground, one cobalt accent, Archivo variable
 * display voice, JetBrains Mono labels, hairlines + corner ticks, mono
 * ( annotations ), and the cmd brand mark with its blinking block cursor.
 *
 * Never hand-edit the emitted SVGs — change this script and re-run:
 *   node scripts/generate-readme-assets.mjs
 *
 * Fonts: pinned static instances of the variable fonts are fetched from the
 * Google Fonts css2 API (axis-pinned + `text=`-subsetted, so each woff2 is a
 * few KB) and embedded as data URIs. Network is required to regenerate.
 * The cmd-mark geometry is copied verbatim from the generated brand suite
 * (senior-portfolio scripts/generate-brand-assets.mjs) — never redrawn.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../assets");

/* ── Kinetic Cobalt tokens (values verbatim from tokens.css) ───────────── */

const LIGHT = {
  bg: "#EFF1F4",
  surface: "#E6E9EF",
  borderSubtle: "#D7DBE3",
  borderStrong: "#AEB6C4",
  text: "#0D1015",
  textSecondary: "#3D4452",
  textMuted: "#5C6573",
  accent: "#2742F5",
  markStroke: "#0D1015",
  cursor: "#2742F5",
};

const DARK = {
  bg: "#0D1015",
  surface: "#141923",
  borderSubtle: "#222938",
  borderStrong: "#39435A",
  text: "#EFF1F4",
  textSecondary: "#C3CAD7",
  textMuted: "#8E97A8",
  accent: "#6F84FF",
  markStroke: "#EFF1F4",
  cursor: "#6F84FF",
};

const INK = "#0D1015";
const PAPER = "#EFF1F4";
const COBALT = "#2742F5";
const COBALT_BRIGHT = "#6F84FF";
// .band-star: color-mix(in srgb, paper 65%, violet #5B2BFF) precomputed.
const STAR_TINT = "#BBACF8";

/* ── Content (grounded in senior-portfolio @cmd/content — never invented) ── */

const NAME_LINES = ["CARLO MIGUEL", "DY"]; // hero splits name before last word
const PITCH = "I ship Web3 products and AI-augmented systems end-to-end.";
const META_TOP = "SENIOR FULLSTACK ENGINEER · 7+ YRS SHIPPING · 4+ YRS WEB3";
const AVAILABILITY = "JOINING A TEAM · REPLIES < 24H";
const META_BOTTOM_LEFT = "northern mindanao, philippines · utc+8 · remote";
const META_BOTTOM_RIGHT = "( github.com/carlomigueldy )";
const ROLE_LINE = "web3 product builds + ai-augmented systems — owned end-to-end";

// Marquee rows: row 1 = flagship tools, row 2 = skills-taxonomy group titles,
// exactly as the landing StackMarquee sources them from skills.ts.
const BAND_ROW_1 = [
  "TYPESCRIPT",
  "NEXT.JS",
  "REACT",
  "SOLIDITY",
  "NESTJS",
  "TAILWIND",
  "FLUTTER",
  "SUPABASE",
  "AWS",
  "PLAYWRIGHT",
];
const BAND_ROW_2 = [
  "FRONTEND",
  "FRONTEND ARCHITECTURE",
  "AI · AGENTIC",
  "WEB3",
  "BACKEND",
  "TESTING",
  "INFRASTRUCTURE",
];

const FOOTER_EYEBROW = "( have a web3 product to ship? )";
const FOOTER_CTA = ["LET’S", "BUILD"];
const FOOTER_LINK = "CARLOMIGUELDY.DEV";
const FOOTER_TAGLINE = ["built end-to-end", "tested before shipped", "shipped before perfected"];
const FOOTER_META_LEFT = "northern mindanao, philippines · utc+8";

const CHIPS = [
  { file: "chip-portfolio", label: "PORTFOLIO", solid: true, arrow: true },
  { file: "chip-email", label: "EMAIL", solid: false, arrow: true },
  { file: "chip-linkedin", label: "LINKEDIN", solid: false, arrow: true },
  { file: "chip-x", label: "X", solid: false, arrow: true },
];

/* ── Google Fonts fetching (axis-pinned instances, text-subsetted) ─────── */

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

const fontCache = new Map();

async function gfont(family, axes, text) {
  const key = `${family}|${axes}|${[...new Set(text)].sort().join("")}`;
  if (fontCache.has(key)) return fontCache.get(key);
  const subset = [...new Set(text + " ")].join("");
  const url =
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, "+")}` +
    `:${axes}&text=${encodeURIComponent(subset)}&display=block`;
  const css = await (await fetch(url, { headers: { "User-Agent": UA } })).text();
  const m = css.match(/src:\s*url\((https:[^)]+)\)\s*format\('woff2'\)/);
  if (!m) throw new Error(`No woff2 for ${family}:${axes} — got:\n${css.slice(0, 300)}`);
  const buf = Buffer.from(await (await fetch(m[1], { headers: { "User-Agent": UA } })).arrayBuffer());
  // Keep Google's weight/stretch descriptors: the subset woff2 stays a
  // variable font, so the descriptors are what pin the axis instance.
  const font = {
    uri: `data:font/woff2;base64,${buf.toString("base64")}`,
    weight: css.match(/font-weight:\s*([\d.]+)/)?.[1] ?? "400",
    stretch: css.match(/font-stretch:\s*([\d.]+%)/)?.[1] ?? null,
  };
  fontCache.set(key, font);
  return font;
}

const fontFace = (name, f) =>
  `@font-face{font-family:'${name}';font-weight:${f.weight};${f.stretch ? `font-stretch:${f.stretch};` : ""}src:url(${f.uri}) format('woff2');}`;
const fontProps = (f) => `font-weight:${f.weight};${f.stretch ? `font-stretch:${f.stretch};` : ""}`;

/* ── Shared SVG helpers ────────────────────────────────────────────────── */

const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/'/g, "&#39;");

// JetBrains Mono is exactly 0.6em advance — mono runs measure deterministically.
const monoW = (str, fs, ls = 0) => str.length * (0.6 * fs + ls) - ls;

function ticks(w, h, inset, len, stroke) {
  const i = inset;
  const l = len;
  return `<g fill="none" stroke="${stroke}" stroke-width="2">
    <path d="M${i} ${i + l} V${i} H${i + l}"/>
    <path d="M${w - i - l} ${i} H${w - i} V${i + l}"/>
    <path d="M${w - i} ${h - i - l} V${h - i} H${w - i - l}"/>
    <path d="M${i + l} ${h - i} H${i} V${h - i - l}"/>
  </g>`;
}

// The cmd mark, geometry verbatim from the brand suite (viewBox -29.5 -77 485.5 206.5).
// `blink` gives the cursor the house block-cursor blink (the one idle loop).
function cmdMark(x, y, height, stroke, cursor, blink) {
  const s = height / 206.5;
  return `<g transform="translate(${x},${y}) scale(${s.toFixed(5)}) translate(29.5,77)" aria-hidden="true">
    <g fill="none" stroke="${stroke}" stroke-width="22">
      <path d="M80.1 22.9 A40.5 40.5 0 1 0 80.1 77.1"/>
      <path d="M135 100 V30.5 A19.5 19.5 0 0 1 174 30.5 V100 M174 30.5 A19.5 19.5 0 0 1 213 30.5 V100"/>
      <circle cx="296.5" cy="50" r="40.5"/>
      <path d="M337 -38 V100"/>
    </g>
    <rect x="378" y="-30" width="50" height="130" fill="${cursor}"${blink ? ' class="blink"' : ""}/>
  </g>`;
}

// Eight-spoked star drawn as paths — the ✳ glyph isn't in the embedded subsets.
function star(cx, cy, r, color) {
  cx = +cx;
  cy = +cy;
  const d = r / Math.SQRT2;
  const n = (v) => v.toFixed(2);
  return `<g stroke="${color}" stroke-width="${n(r * 0.46)}" aria-hidden="true">
    <path d="M${n(cx - r)} ${n(cy)} H${n(cx + r)} M${n(cx)} ${n(cy - r)} V${n(cy + r)}"/>
    <path d="M${n(cx - d)} ${n(cy - d)} L${n(cx + d)} ${n(cy + d)} M${n(cx - d)} ${n(cy + d)} L${n(cx + d)} ${n(cy - d)}"/>
  </g>`;
}

// External-link arrow ↗ drawn as a path (kept off the font subsets on purpose).
function arrow(x, y, size, color, sw = 2.5) {
  const s = size;
  return `<g transform="translate(${x},${y})" fill="none" stroke="${color}" stroke-width="${sw}" aria-hidden="true">
    <path d="M0 ${s} L${s} 0 M${s * 0.25} 0 H${s} V${s * 0.75}"/>
  </g>`;
}

const REDUCED_MOTION = `@media (prefers-reduced-motion: reduce){*{animation:none !important;}}`;

/* ── Hero banner (light + dark) ────────────────────────────────────────── */

async function heroSvg(t) {
  const W = 1760;
  const H = 760;
  const M = 84;

  const jb = await gfont(
    "JetBrains Mono",
    "wght@500",
    META_TOP + AVAILABILITY + META_BOTTOM_LEFT + META_BOTTOM_RIGHT + ROLE_LINE,
  );
  const archivo = await gfont("Archivo", "wdth,wght@96,720", "CARLO MIGUELDY.LET’SBUILD");
  const hanken = await gfont("Hanken Grotesk", "wght@300", PITCH);

  // Availability pill (right-aligned) — .pill: hairline, fully rounded, mono.
  const pillFs = 22;
  const pillLs = pillFs * 0.13;
  const pillTextW = monoW(AVAILABILITY, pillFs, pillLs);
  const pillH = 56;
  const pillPad = 28;
  const dotR = 5.5;
  const pillW = pillPad + dotR * 2 + 14 + pillTextW + pillPad;
  const pillX = W - M - pillW;
  const pillY = 76;

  const nameFs = 164;
  const nameLh = nameFs * 0.94;
  const l1Base = 372;
  const l2Base = l1Base + nameLh;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">Carlo Miguel Dy — senior fullstack engineer</title>
  <desc id="d">${esc(PITCH)} 7+ years software, 4+ years Web3. Joining a team — replies under 24 hours. Northern Mindanao, Philippines, UTC+8, remote.</desc>
  <defs>
    <pattern id="grid" width="88" height="88" patternUnits="userSpaceOnUse">
      <path d="M88 0H0V88" fill="none" stroke="${t.borderSubtle}" stroke-width="1"/>
    </pattern>
    <radialGradient id="fade" cx="0.32" cy="0.36" r="0.85">
      <stop offset="0.45" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
    <mask id="gridmask"><rect width="${W}" height="${H}" fill="url(#fade)"/></mask>
  </defs>
  <style>
    ${fontFace("JB", jb)}
    ${fontFace("AD", archivo)}
    ${fontFace("HG", hanken)}
    .mono{font-family:'JB',ui-monospace,'JetBrains Mono',monospace;${fontProps(jb)}}
    .disp{font-family:'AD','Archivo',system-ui,sans-serif;letter-spacing:-0.02em;${fontProps(archivo)}}
    .body{font-family:'HG','Hanken Grotesk',system-ui,sans-serif;${fontProps(hanken)}}
    .blink{animation:blink 1.1s steps(1,end) infinite;}
    @keyframes blink{0%,52%{opacity:1;}53%,100%{opacity:0.14;}}
    .ring{animation:pulse 2.6s cubic-bezier(0.2,0.74,0.2,1) infinite;transform-origin:center;transform-box:fill-box;}
    @keyframes pulse{0%{opacity:0.55;transform:scale(1);}70%,100%{opacity:0;transform:scale(2.4);}}
    ${REDUCED_MOTION}
  </style>

  <rect width="${W}" height="${H}" fill="${t.bg}"/>
  <rect width="${W}" height="${H}" fill="url(#grid)" mask="url(#gridmask)" opacity="0.5"/>
  ${ticks(W, H, 28, 26, t.borderStrong)}

  ${cmdMark(M, 72, 64, t.markStroke, t.cursor, true)}

  <g>
    <rect x="${pillX}" y="${pillY}" width="${pillW.toFixed(1)}" height="${pillH}" rx="${pillH / 2}" fill="none" stroke="${t.borderSubtle}"/>
    <circle class="ring" cx="${(pillX + pillPad + dotR).toFixed(1)}" cy="${pillY + pillH / 2}" r="${dotR}" fill="none" stroke="${t.accent}" stroke-width="2"/>
    <circle cx="${(pillX + pillPad + dotR).toFixed(1)}" cy="${pillY + pillH / 2}" r="${dotR}" fill="${t.accent}"/>
    <text class="mono" x="${(pillX + pillPad + dotR * 2 + 14).toFixed(1)}" y="${pillY + pillH / 2 + pillFs * 0.34}" font-size="${pillFs}" letter-spacing="${pillLs}" fill="${t.textSecondary}">${esc(AVAILABILITY)}</text>
  </g>

  <text class="mono" x="${M}" y="${196}" font-size="24" letter-spacing="3.36" fill="${t.textMuted}">${esc(META_TOP)}</text>

  <text class="disp" x="${M - 6}" y="${l1Base}" font-size="${nameFs}" fill="${t.text}">${esc(NAME_LINES[0])}</text>
  <text class="disp" x="${M - 6}" y="${l2Base}" font-size="${nameFs}" fill="${t.text}">${esc(NAME_LINES[1])}<tspan fill="${t.accent}">.</tspan></text>

  <text class="body" x="${M}" y="${618}" font-size="33" fill="${t.textSecondary}">${esc(PITCH)}</text>
  <text class="mono" x="${M}" y="${664}" font-size="21" fill="${t.textMuted}">${esc(ROLE_LINE)}</text>

  <line x1="${M}" y1="694" x2="${W - M}" y2="694" stroke="${t.borderSubtle}" stroke-width="1"/>
  <text class="mono" x="${M}" y="${726}" font-size="20" fill="${t.textMuted}">${esc(META_BOTTOM_LEFT)}</text>
  <text class="mono" x="${W - M}" y="${726}" font-size="20" fill="${t.textMuted}" text-anchor="end">${esc(META_BOTTOM_RIGHT)}</text>
</svg>`;
}

/* ── Cobalt stack band (theme-invariant — always cobalt-on-paper) ──────── */

async function bandSvg() {
  const W = 1760;
  const H = 224;
  const fs = 66;

  const a800 = await gfont("Archivo", "wdth,wght@118,800", BAND_ROW_1.join(""));
  const a600 = await gfont("Archivo", "wdth,wght@110,600", BAND_ROW_2.join(""));

  // Lay a row out once with per-keyword pinned widths, then duplicate at +seqW
  // and translate by exactly one sequence width for a seamless wrap.
  function row(items, adv, cls, textAttrs, y) {
    const gap = fs * 0.42;
    const starR = fs * 0.26;
    let x = 0;
    let cells = "";
    for (const item of items) {
      const tl = (item.length * adv * fs).toFixed(1);
      cells += `<text class="${cls}" x="${x.toFixed(1)}" y="${y}" font-size="${fs}" ${textAttrs} textLength="${tl}">${esc(item)}</text>`;
      x += +tl + gap + starR;
      cells += star(x.toFixed(1), y - fs * 0.32, starR, STAR_TINT);
      x += starR + gap;
    }
    return { cells, seqW: x };
  }

  const r1 = row(BAND_ROW_1, 0.76, "r1", `fill="${PAPER}"`, 96);
  const r2 = row(BAND_ROW_2, 0.68, "r2", `fill="none" stroke="${PAPER}" stroke-opacity="0.85" stroke-width="1.4"`, 188);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t">
  <title id="t">Stack marquee — ${BAND_ROW_1.join(", ")} — ${BAND_ROW_2.join(", ")}</title>
  <style>
    ${fontFace("AB", a800)}
    ${fontFace("AO", a600)}
    .r1{font-family:'AB','Archivo',system-ui,sans-serif;letter-spacing:-0.01em;${fontProps(a800)}}
    .r2{font-family:'AO','Archivo',system-ui,sans-serif;letter-spacing:-0.01em;${fontProps(a600)}}
    .mq1{animation:mq1 52s linear infinite;}
    .mq2{animation:mq2 64s linear infinite;}
    @keyframes mq1{to{transform:translateX(${-r1.seqW.toFixed(1)}px);}}
    @keyframes mq2{from{transform:translateX(${-r2.seqW.toFixed(1)}px);}to{transform:translateX(0);}}
    ${REDUCED_MOTION}
  </style>
  <rect width="${W}" height="${H}" fill="${COBALT}"/>
  <g class="mq1">${r1.cells}<g transform="translate(${r1.seqW.toFixed(1)},0)">${r1.cells}</g><g transform="translate(${(r1.seqW * 2).toFixed(1)},0)">${r1.cells}</g></g>
  <g class="mq2">${r2.cells}<g transform="translate(${r2.seqW.toFixed(1)},0)">${r2.cells}</g><g transform="translate(${(r2.seqW * 2).toFixed(1)},0)">${r2.cells}</g></g>
</svg>`;
}

/* ── Ink footer panel (theme-invariant — always ink-on-paper) ──────────── */

async function footerSvg() {
  const W = 1760;
  const H = 560;
  const M = 84;

  const jb = await gfont(
    "JetBrains Mono",
    "wght@500",
    FOOTER_EYEBROW + AVAILABILITY + FOOTER_LINK + FOOTER_TAGLINE.join("") + FOOTER_META_LEFT,
  );
  const archivo = await gfont("Archivo", "wdth,wght@96,720", "CARLO MIGUELDY.LET’SBUILD");

  const ctaFs = 196;

  // Bottom-right tagline with drawn stars between segments (right-aligned).
  const tagFs = 20;
  let tagX = W - M;
  let tagline = "";
  const starR = tagFs * 0.3;
  const gap = tagFs * 0.75;
  for (let i = FOOTER_TAGLINE.length - 1; i >= 0; i--) {
    const seg = FOOTER_TAGLINE[i];
    const w = monoW(seg, tagFs);
    tagX -= w;
    tagline += `<text class="mono" x="${tagX.toFixed(1)}" y="528" font-size="${tagFs}" fill="#8E97A8">${esc(seg)}</text>`;
    if (i > 0) {
      tagX -= gap + starR;
      tagline += star(tagX.toFixed(1), 528 - tagFs * 0.32, starR, STAR_TINT);
      tagX -= starR + gap;
    }
  }

  const availFs = 22;
  const availLs = availFs * 0.13;
  const linkFs = 26;
  const linkLs = linkFs * 0.08;
  const linkW = monoW(FOOTER_LINK, linkFs, linkLs);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="t d">
  <title id="t">Let’s build — carlomigueldy.dev</title>
  <desc id="d">Joining a team, replies under 24 hours. ${FOOTER_TAGLINE.join(" — ")}.</desc>
  <style>
    ${fontFace("JB", jb)}
    ${fontFace("AD", archivo)}
    .mono{font-family:'JB',ui-monospace,'JetBrains Mono',monospace;${fontProps(jb)}}
    .disp{font-family:'AD','Archivo',system-ui,sans-serif;letter-spacing:-0.02em;${fontProps(archivo)}}
    .ring{animation:pulse 2.6s cubic-bezier(0.2,0.74,0.2,1) infinite;transform-origin:center;transform-box:fill-box;}
    @keyframes pulse{0%{opacity:0.55;transform:scale(1);}70%,100%{opacity:0;transform:scale(2.4);}}
    ${REDUCED_MOTION}
  </style>
  <rect width="${W}" height="${H}" fill="${INK}"/>
  ${ticks(W, H, 28, 26, "#39435A")}

  <text class="mono" x="${M}" y="104" font-size="22" letter-spacing="3.08" fill="#8E97A8">${esc(FOOTER_EYEBROW.toUpperCase())}</text>

  <text class="disp" x="${M - 7}" y="330" font-size="${ctaFs}" fill="${PAPER}">${esc(FOOTER_CTA.join(" "))}<tspan fill="${COBALT_BRIGHT}">.</tspan></text>

  <g>
    <circle class="ring" cx="${M + 6}" cy="${412}" r="5.5" fill="none" stroke="${COBALT_BRIGHT}" stroke-width="2"/>
    <circle cx="${M + 6}" cy="${412}" r="5.5" fill="${COBALT_BRIGHT}"/>
    <text class="mono" x="${M + 26}" y="${412 + availFs * 0.34}" font-size="${availFs}" letter-spacing="${availLs}" fill="${PAPER}" opacity="0.72">${esc(AVAILABILITY)}</text>
  </g>
  <g>
    <text class="mono" x="${(W - M - linkW - 34).toFixed(1)}" y="${412 + linkFs * 0.34}" font-size="${linkFs}" letter-spacing="${linkLs}" fill="${PAPER}">${esc(FOOTER_LINK)}</text>
    ${arrow(W - M - 20, 412 - 9, 18, COBALT_BRIGHT, 3)}
  </g>

  <line x1="${M}" y1="470" x2="${W - M}" y2="470" stroke="#222938" stroke-width="1"/>
  <text class="mono" x="${M}" y="528" font-size="${tagFs}" fill="#8E97A8">${esc(FOOTER_META_LEFT)}</text>
  ${tagline}
</svg>`;
}

/* ── Link chips (.btn voice — mono uppercase, 2px radius at render size) ── */

async function chipSvg({ label, solid }, t, jb) {
  const H = 64;
  const fs = 24;
  const ls = fs * 0.08;
  const padX = 30;
  const arrowS = 15;
  const textW = monoW(label, fs, ls);
  const W = Math.round(padX + textW + 12 + arrowS + padX);

  const bg = solid ? `<rect width="${W}" height="${H}" rx="4" fill="${COBALT}"/>` : `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="4" fill="none" stroke="${t.borderStrong}" stroke-width="2"/>`;
  const fg = solid ? PAPER : t.text;

  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
  <style>${fontFace("JB", jb)}.mono{font-family:'JB',ui-monospace,'JetBrains Mono',monospace;${fontProps(jb)}}</style>
  ${bg}
  <text class="mono" x="${padX}" y="${H / 2 + fs * 0.34}" font-size="${fs}" letter-spacing="${ls}" fill="${fg}">${esc(label)}</text>
  ${arrow(padX + textW + 12, H / 2 - arrowS / 2, arrowS, solid ? PAPER : t.accent, 2.5)}
</svg>`,
  };
}

/* ── Emit ──────────────────────────────────────────────────────────────── */

await mkdir(OUT, { recursive: true });

const files = {
  "hero-light.svg": await heroSvg(LIGHT),
  "hero-dark.svg": await heroSvg(DARK),
  "band.svg": await bandSvg(),
  "footer-ink.svg": await footerSvg(),
};

const chipFont = await gfont("JetBrains Mono", "wght@600", CHIPS.map((c) => c.label).join(""));
for (const chip of CHIPS) {
  if (chip.solid) {
    files[`${chip.file}.svg`] = (await chipSvg(chip, LIGHT, chipFont)).svg;
  } else {
    files[`${chip.file}-light.svg`] = (await chipSvg(chip, LIGHT, chipFont)).svg;
    files[`${chip.file}-dark.svg`] = (await chipSvg(chip, DARK, chipFont)).svg;
  }
}

for (const [name, svg] of Object.entries(files)) {
  await writeFile(path.join(OUT, name), svg.trim() + "\n");
  console.log(`  assets/${name}  ${(svg.length / 1024).toFixed(1)}kb`);
}
console.log("done.");
