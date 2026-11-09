// Builds the three result figures from data/answers.jsonl, then renders them to PNG with Chrome.
// Usage: node figures/build.mjs   (CHROME=/path/to/chrome to override the browser)
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const out = join(root, 'docs', 'figures');
mkdirSync(out, { recursive: true });

const rows = readFileSync(join(root, 'data', 'answers.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
const median = (values) => {
  const v = [...values].sort((a, b) => a - b);
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
};
const DATASETS = [
  { key: 'arvenne', name: 'Arvenne RAG Bench', short: 'Arvenne' },
  { key: 'databench', name: 'DataBench', short: 'DataBench' },
  { key: 'hybridqa', name: 'HybridQA', short: 'HybridQA' },
];
function stats(dataset, system) {
  const r = rows.filter((x) => x.system === system && (dataset === 'all' || x.dataset === dataset));
  if (!r.length) throw new Error(`No rows for ${dataset}/${system}`);
  const correct = r.filter((x) => x.fully_correct).length;
  return { n: r.length, correct, pct: (100 * correct) / r.length, sec: median(r.map((x) => x.total_attempt_latency_ms)) / 1000 };
}
const data = {};
for (const d of ['all', ...DATASETS.map((x) => x.key)]) data[d] = { classic: stats(d, 'classic-rag'), lookio: stats(d, 'lookio-v2') };

const pct = (v) => `${v.toFixed(1)}%`;
const sec = (v) => `${v.toFixed(1)} s`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const LOGO = `<svg viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M 5.5 12 V 9.5 Q 5.5 5.5 9.5 5.5 H 12 M 28 5.5 H 30.5 Q 34.5 5.5 34.5 9.5 V 12 M 34.5 28 V 30.5 Q 34.5 34.5 30.5 34.5 H 28 M 12 34.5 H 9.5 Q 5.5 34.5 5.5 30.5 V 28" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><path d="M 9.4 20 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0 M 14.6 19.6 a 1.9 1.9 0 1 0 3.8 0 a 1.9 1.9 0 1 0 -3.8 0 M 20.6 20 a 5 5 0 1 0 10 0 a 5 5 0 1 0 -10 0 M 25.8 19.6 a 1.9 1.9 0 1 0 3.8 0 a 1.9 1.9 0 1 0 -3.8 0" fill="currentColor" fill-rule="evenodd"/></svg>`;

const FOOT = 'Fully correct within two attempts, partial answers score 0. Median time per question, attempts summed, local harness. Both answer with Claude Haiku 5.5.';

const CSS = `
@font-face { font-family: Inter; src: url(../../figures/assets/inter-latin-opsz.woff2) format('woff2-variations'); font-weight: 100 900; }
@font-face { font-family: JBM; src: url(../../figures/assets/jetbrains-mono-latin.woff2) format('woff2-variations'); font-weight: 100 800; }
:root { --bg: #09090a; --panel: #0f0f10; --line: #242426; --f1: #f6f6f4; --f2: #cfcfcc; --f3: #8b8b88; --f4: #626260; --f5: #2a2a2b; --y: oklch(0.905 0.182 98.111); }
* { box-sizing: border-box; margin: 0; }
html, body { width: 1600px; height: 900px; background: var(--bg); overflow: hidden; }
body { font-family: Inter, sans-serif; color: var(--f1); font-feature-settings: 'cv11', 'ss03'; -webkit-font-smoothing: antialiased; position: relative; }
.mono { font-family: JBM, monospace; }
.print { position: absolute; left: 32px; right: 32px; top: 214px; bottom: -40px; border-radius: 22px 22px 0 0; overflow: hidden; background: #121213;
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 16%);
  -webkit-mask-image: linear-gradient(to top, transparent 0, transparent 70px, #000 420px); }
.print img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 0; filter: brightness(.6) contrast(1.05); mix-blend-mode: lighten; opacity: .9; }
.print::after { content: ''; position: absolute; inset: 0; background: url(../../figures/assets/grain.png) 0 0 / 200px; mix-blend-mode: overlay; opacity: .5; }
header { position: absolute; left: 88px; right: 88px; top: 64px; display: flex; justify-content: space-between; align-items: flex-start; }
h1 { font-size: 50px; line-height: 1.06; font-weight: 450; letter-spacing: -.042em; }
h1 span { display: block; color: var(--f3); }
.brand { display: flex; align-items: center; gap: 12px; font-size: 26px; font-weight: 500; letter-spacing: -.03em; color: var(--f1); margin-top: 6px; }
.brand svg { width: 34px; height: 34px; color: var(--f1); }
.app { position: absolute; left: 88px; right: 88px; top: 270px; height: 560px; border-radius: 16px; padding: 7px;
  border: 1px solid transparent;
  background: linear-gradient(#09090a, #09090a) padding-box, linear-gradient(135deg, rgb(255 255 255 / 58%) 0%, rgb(255 255 255 / 17%) 13%, rgb(255 255 255 / 8%) 34%, rgb(255 255 255 / 6%) 66%, rgb(255 255 255 / 9%) 86%, rgb(255 255 255 / 26%) 100%) border-box;
  box-shadow: 0 30px 90px -24px rgb(0 0 0 / 70%); }
.panel { position: relative; height: 100%; border-radius: 11px; background: var(--panel); box-shadow: inset 0 0 0 1px var(--line); overflow: hidden; isolation: isolate; }
.panel::after { content: ''; position: absolute; inset: 0; background: url(../../figures/assets/grain.png) 0 0 / 200px; mix-blend-mode: overlay; opacity: .22; pointer-events: none; z-index: 5; }
.glow { position: absolute; width: 760px; height: 760px; transform: translate(-50%, -50%); background: radial-gradient(circle, rgb(255 255 255 / 6%), transparent 62%); pointer-events: none; z-index: 0; }
.yglow { position: absolute; width: 360px; height: 360px; transform: translate(-50%, -50%); background: radial-gradient(circle, color-mix(in oklch, var(--y) 22%, transparent), transparent 60%); pointer-events: none; z-index: 0; }
.shine { position: absolute; inset: 0; border-radius: inherit; box-shadow: inset 0 0 0 1px rgb(255 255 255 / 26%); z-index: 6; pointer-events: none;
  -webkit-mask-image: radial-gradient(300px 300px at 6% 0%, #000 0%, rgb(0 0 0 / 60%) 30%, rgb(0 0 0 / 20%) 50%, transparent 70%); }
.phead { position: relative; z-index: 2; display: flex; align-items: center; gap: 22px; height: 54px; padding: 0 24px; border-bottom: 1px solid rgb(255 255 255 / 6%); font-size: 15px; color: var(--f3); }
.phead b { font-weight: 500; color: var(--f1); }
.phead .end { margin-left: auto; font-size: 13px; color: var(--f4); }
.key { display: inline-flex; align-items: center; gap: 9px; }
.key i { display: inline-block; width: 11px; height: 11px; border-radius: 3px; background: var(--y); box-shadow: 0 0 12px color-mix(in oklch, var(--y) 60%, transparent); }
.key i.c { border-radius: 50%; background: var(--f3); box-shadow: none; }
svg.chart { position: relative; z-index: 2; display: block; }
svg text { font-family: Inter, sans-serif; }
footer { position: absolute; left: 88px; right: 88px; bottom: 30px; white-space: nowrap; display: flex; justify-content: space-between; gap: 40px; font-size: 13px; line-height: 1.5; color: var(--f4); }
footer .src { color: var(--f3); white-space: nowrap; }
`;

function page({ title, sub, print, body, head, height = 900 }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>${CSS}html, body { height: ${height}px; } .app { height: ${height - 340}px; }</style></head><body data-height="${height}">
<div class="print"><img src="../../figures/assets/${print}.webp" alt=""></div>
<header><h1>${esc(title)}<span>${esc(sub)}</span></h1><div class="brand">${LOGO}Lookio</div></header>
<div class="app"><div class="panel"><div class="shine"></div>${head}${body}</div></div>
<footer><span>${FOOT}</span><span class="src mono">github.com/DuvInc/lookio-rag-evaluation</span></footer>
</body></html>`;
}

const legend = `<span class="key"><i></i>Lookio</span><span class="key"><i class="c"></i>Classic RAG</span>`;

// A scatter of fully correct answers (y) against median time (x).
function scatter({ w, h, d, big, xMax = 20, zone }) {
  const L = big ? 78 : 52, R = big ? 40 : 22, T = big ? 34 : 24, B = big ? 58 : 46;
  const pw = w - L - R, ph = h - T - B;
  const x = (v) => L + (v / xMax) * pw, y = (v) => T + ((100 - v) / 100) * ph;
  const fs = big ? 14 : 12.5;
  let s = `<svg class="chart" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
  s += `<defs><filter id="g${w}" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="${big ? 9 : 6}"/></filter></defs>`;
  for (const t of [0, 25, 50, 75, 100]) {
    s += `<line x1="${L}" x2="${w - R}" y1="${y(t)}" y2="${y(t)}" stroke="rgb(255 255 255 / ${t === 0 ? 14 : 6}%)" stroke-width="1"/>`;
    s += `<text x="${L - 14}" y="${y(t) + 5}" fill="var(--f4)" font-size="${fs}" text-anchor="end">${t}%</text>`;
  }
  const ticks = big ? [0, 5, 10, 15, 20] : [0, 10, 20];
  for (const t of ticks) s += `<text x="${x(t)}" y="${h - B + 26}" fill="var(--f4)" font-size="${fs}" text-anchor="middle">${t} s</text>`;
  s += `<text x="${w - R}" y="${h - 8}" fill="var(--f3)" font-size="${fs}" text-anchor="end">Median time per question →</text>`;
  s += `<text x="${L - 14}" y="${T - (big ? 14 : 10)}" fill="var(--f3)" font-size="${fs}" text-anchor="start" transform="translate(${-(L - 14) + 2},0)">↑ Fully correct</text>`;

  // the quadrant worth being in: accurate enough, quick enough
  if (zone) {
    const zx = x(0), zy = y(100), zw = x(zone.maxSec) - zx, zh = y(zone.minPct) - zy;
    s += `<rect x="${zx}" y="${zy}" width="${zw}" height="${zh}" rx="6" fill="color-mix(in oklch, var(--y) 5%, transparent)" stroke="color-mix(in oklch, var(--y) 45%, transparent)" stroke-width="1.2" stroke-dasharray="5 6"/>`;
    s += `<text x="${zx + 18}" y="${zy + 30}" fill="var(--y)" font-size="${fs + 1}" font-weight="500">Above ${zone.minPct}% fully correct, under ${zone.maxSec} s</text>`;
  }
  const c = d.classic, l = d.lookio;
  // the jump between the two systems
  const x1 = x(c.sec), y1 = y(c.pct), x2 = x(l.sec), y2 = y(l.pct);
  const len = Math.hypot(x2 - x1, y2 - y1), ux = (x2 - x1) / len, uy = (y2 - y1) / len;
  const pad = big ? 20 : 14;
  s += `<line x1="${x1 + ux * (big ? 80 : pad)}" y1="${y1 + uy * (big ? 80 : pad)}" x2="${x2 - ux * (big ? 60 : pad + 4)}" y2="${y2 - uy * (big ? 60 : pad + 4)}" stroke="rgb(255 255 255 / 30%)" stroke-width="1.2" stroke-dasharray="3 6"/>`;
  // drop lines
  for (const [px, py] of [[x1, y1], [x2, y2]]) s += `<line x1="${px}" x2="${px}" y1="${py}" y2="${y(0)}" stroke="rgb(255 255 255 / 9%)" stroke-dasharray="2 5"/>`;
  // points
  const r = big ? 9 : 7;
  s += `<circle cx="${x1}" cy="${y1}" r="${r}" fill="var(--f3)"/>`;
  s += `<rect x="${x2 - r - 3}" y="${y2 - r - 3}" width="${2 * r + 6}" height="${2 * r + 6}" rx="5" fill="var(--y)" filter="url(#g${w})" opacity=".85"/>`;
  s += `<rect x="${x2 - r}" y="${y2 - r}" width="${2 * r}" height="${2 * r}" rx="4" fill="var(--y)"/>`;
  // labels
  const nf = big ? 30 : 22, lf = big ? 15 : 13;
  s += `<text x="${x1 + (big ? 22 : 14)}" y="${y1 - (big ? 26 : 18)}" fill="var(--f3)" font-size="${lf}">Classic RAG</text>`;
  s += `<text x="${x1 + (big ? 22 : 14)}" y="${y1 + (big ? 6 : 4)}" fill="var(--f2)" font-size="${nf}" font-weight="450" letter-spacing="-.03em">${pct(c.pct)}</text>`;
  s += `<text x="${x1 + (big ? 22 : 14)}" y="${y1 + (big ? 30 : 22)}" fill="var(--f4)" font-size="${lf}" class="mono">${sec(c.sec)}</text>`;
  // above the point, on the side away from the axis title; the line arrives from below left
  const anchor = big ? 'end' : 'start', lxx = big ? x2 - 22 : x2 + 14;
  s += `<text x="${lxx}" y="${y2 - (big ? 36 : 50)}" fill="var(--f1)" font-size="${lf}" text-anchor="${anchor}">Lookio</text>`;
  s += `<text x="${lxx}" y="${y2 - (big ? 4 : 24)}" fill="var(--f1)" font-size="${nf}" font-weight="450" letter-spacing="-.03em" text-anchor="${anchor}">${pct(l.pct)}</text>`;
  s += `<text x="${lxx}" y="${y2 + (big ? 20 : -6)}" fill="var(--f3)" font-size="${lf}" class="mono" text-anchor="${anchor}">${sec(l.sec)}</text>`;
  return { svg: s + '</svg>', x, y };
}

// 1. Matrix: all 450 questions, with each dataset as a faint point behind
function matrix() {
  const HEIGHT = 1200, w = 1408, h = HEIGHT - 340 - 72;
  const sc = scatter({ w, h, d: data.all, big: true, zone: { maxSec: 10, minPct: 60 } });
  const svg = sc.svg;
  const gx = sc.x(data.all.lookio.sec) + 7, gy = sc.y(data.all.lookio.pct) + 54;
  return page({
    height: HEIGHT,
    title: 'Built for the hard questions.',
    sub: '450 stress-test questions, the same answer model.',
    print: 'fine',
    head: `<div class="phead"><b>Fully correct against time</b>${legend}<span class="end mono">All 450 questions</span></div>`,
    body: `<div class="glow" style="left:${gx}px;top:${gy}px"></div><div class="yglow" style="left:${gx}px;top:${gy}px"></div>${svg}`,
  });
}

// 2. Small multiples: one scatter per dataset
function facets() {
  const cw = 452, h = 470;
  const cells = DATASETS.map((ds, i) => {
    const sc = scatter({ w: cw, h: h - 70, d: data[ds.key], big: false });
    const d = data[ds.key];
    return `<section style="position:absolute;left:${10 + i * (cw + 10)}px;top:62px;width:${cw}px">
      <div style="display:flex;justify-content:space-between;align-items:baseline;padding:4px 22px 0 52px;position:relative;z-index:2">
        <b style="font-size:18px;font-weight:500;letter-spacing:-.02em">${ds.name}</b>
        <span class="mono" style="font-size:13px;color:var(--f4)">${d.lookio.n} questions</span>
      </div>${sc.svg}</section>
      ${i ? `<div style="position:absolute;left:${5 + i * (cw + 10)}px;top:72px;bottom:24px;width:1px;background:rgb(255 255 255 / 6%);z-index:2"></div>` : ''}
      <div class="yglow" style="left:${10 + i * (cw + 10) + sc.x(d.lookio.sec)}px;top:${62 + 30 + sc.y(d.lookio.pct)}px;width:260px;height:260px"></div>`;
  }).join('');
  return page({
    title: 'Three stress tests, the same gap.',
    sub: 'Table arithmetic, tables mixed with text, messy company files.',
    print: 'lens',
    head: `<div class="phead"><b>Fully correct against time, per dataset</b>${legend}</div>`,
    body: `<div class="glow" style="left:6%;top:0"></div>${cells}`,
  });
}

// 3. Editorial: the two headline numbers, then one pair of bars per dataset
function editorial() {
  const a = data.all;
  const bar = (p, sys) => `<div style="height:10px;border-radius:3px;background:rgb(255 255 255 / 6%);overflow:hidden"><div style="height:100%;width:${p.pct}%;border-radius:3px;background:${sys === 'lookio' ? 'var(--y)' : 'var(--f4)'};${sys === 'lookio' ? 'box-shadow:0 0 18px color-mix(in oklch, var(--y) 55%, transparent)' : ''}"></div></div>`;
  const line = (label, p, sys) => `<div style="display:grid;grid-template-columns:120px 1fr 82px 70px;gap:18px;align-items:center;margin-top:12px;font-size:15px">
      <span style="color:${sys === 'lookio' ? 'var(--f1)' : 'var(--f3)'}">${label}</span>${bar(p, sys)}
      <span style="text-align:right;font-variant-numeric:tabular-nums;color:${sys === 'lookio' ? 'var(--f1)' : 'var(--f3)'};font-weight:${sys === 'lookio' ? 500 : 400}">${pct(p.pct)}</span>
      <span class="mono" style="text-align:right;font-size:13px;color:var(--f4)">${sec(p.sec)}</span></div>`;
  const rows = DATASETS.map((ds) => `<section style="padding:22px 0;border-top:1px solid rgb(255 255 255 / 7%)">
      <div style="display:flex;justify-content:space-between;font-size:14px;color:var(--f3)"><b style="font-weight:500;color:var(--f2)">${ds.name}</b><span class="mono" style="font-size:12.5px;color:var(--f4)">${data[ds.key].lookio.n} questions</span></div>
      ${line('Lookio', data[ds.key].lookio, 'lookio')}${line('Classic RAG', data[ds.key].classic, 'classic')}</section>`).join('');
  const big = `<div style="position:absolute;left:56px;top:96px;width:520px;z-index:2">
      <div style="font-size:15px;color:var(--f3)">Lookio</div>
      <div style="font-size:150px;line-height:1;font-weight:400;letter-spacing:-.06em;margin-top:8px">${a.lookio.pct.toFixed(1)}<span style="font-size:80px;color:var(--f3)">%</span></div>
      <div class="mono" style="margin-top:12px;font-size:14px;color:var(--f3)">${a.lookio.correct} of ${a.lookio.n} fully correct</div>
      <div style="height:1px;background:rgb(255 255 255 / 8%);margin:34px 0 26px;width:420px"></div>
      <div style="font-size:15px;color:var(--f4)">Classic RAG</div>
      <div style="font-size:72px;line-height:1;font-weight:400;letter-spacing:-.05em;margin-top:8px;color:var(--f3)">${a.classic.pct.toFixed(1)}<span style="font-size:40px">%</span></div>
      <div class="mono" style="margin-top:10px;font-size:14px;color:var(--f4)">${a.classic.correct} of ${a.classic.n} fully correct</div></div>`;
  return page({
    title: 'Hard questions, answered in full.',
    sub: 'Far harder than everyday questions, on purpose.',
    print: 'ring',
    head: `<div class="phead"><b>450 stress-test questions, three datasets</b><span class="end mono">Bar: fully correct · right: median time</span></div>`,
    body: `<div class="glow" style="left:14%;top:30%"></div><div class="yglow" style="left:200px;top:200px;width:520px;height:520px;opacity:.55"></div>${big}
      <div style="position:absolute;left:640px;right:56px;top:84px;z-index:2">${rows}</div>`,
  });
}

const figures = { matrix: matrix(), 'small-multiples': facets(), editorial: editorial() };
const chrome = process.env.CHROME || ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].find(existsSync);
for (const [name, html] of Object.entries(figures)) {
  const height = html.match(/data-height="(\d+)"/)[1];
  // the page lives two levels down so its relative asset paths resolve the same as from docs/figures
  const file = join(root, 'docs', 'figures', `${name}.source.html`);
  writeFileSync(file, html);
  if (!chrome) { console.log(`wrote ${file} (no Chrome found, PNG skipped)`); continue; }
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=2', `--window-size=1600,${height}`, '--virtual-time-budget=3000', '--allow-file-access-from-files', `--screenshot=${join(out, `${name}.png`)}`, `file://${file}`], { stdio: 'ignore' });
  console.log(`rendered docs/figures/${name}.png`);
}
