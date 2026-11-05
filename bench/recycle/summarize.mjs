// Usage: node bench/recycle/summarize.mjs results/<name>.json
// Recycling on minus off, paired within a round, with 95% bootstrap intervals over the rounds.
import { readFileSync } from 'node:fs';

const data = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const quantile = (list, p) => {
  const a = [...list].sort((x, y) => x - y);
  const i = (a.length - 1) * p;
  const low = Math.floor(i);
  return a[low] + (a[Math.ceil(i)] - a[low]) * (i - low);
};
const median = (list) => quantile(list, 0.5);
let seed = 1;
const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const interval = (list) => {
  const medians = Array.from({ length: 10000 }, () => median(list.map(() => list[Math.floor(random() * list.length)])));
  return [quantile(medians, 0.025), quantile(medians, 0.975)];
};
const groups = [...new Set(data.runs.map((r) => `${r.kind}|${r.cpu}|${r.step}`))].sort();
const n = (v) => (Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(1));
const sign = (v) => (v > 0 ? '+' : '') + n(v);

const table = (metric, label) => {
  console.log(`\n### ${label}\n\n| Rows | CPU | Step | On | Off | On minus off | Change | On won |\n|---|---|---|---|---|---|---|---|`);
  for (const group of groups) {
    const [kind, cpu, step] = group.split('|');
    const select = (recycle) => data.runs.filter((r) => r.kind === kind && r.cpu === +cpu && r.step === +step && r.recycle === recycle);
    const off = select(false);
    const pairs = select(true).map((a) => [a[metric], off.find((b) => b.round === a.round)?.[metric]]).filter(([, b]) => b !== undefined);
    const diff = pairs.map(([a, b]) => a - b);
    const [low, high] = interval(diff);
    const baseline = median(pairs.map(([, b]) => b));
    const clear = low > 0 || high < 0;
    const text = `${sign(median(diff))} (${sign(low)} to ${sign(high)})`;
    const change = baseline ? `${sign((median(diff) / baseline) * 100)}%` : '–';
    console.log(`| ${kind} | ${cpu}x | ${step} | ${n(median(pairs.map(([a]) => a)))} | ${n(baseline)} | ${clear ? `**${text}**` : text} | ${change} | ${diff.filter((v) => v < 0).length}/${diff.length} |`);
  }
};
console.log(`Ember ${data.ember}, ${data.chrome}, ${data.ref.slice(0, 7)}, ${new Set(data.runs.map((r) => r.round)).size} rounds, ${data.steps} steps. Load average ${n(median(data.runs.map((r) => r.load1)))}.`);
console.log(`\n### Flag check: distinct row elements during the scroll\n\n| Rows | Step | On | Off |\n|---|---|---|---|`);
for (const v of data.validation.filter((x) => x.recycle)) {
  const off = data.validation.find((x) => !x.recycle && x.kind === v.kind && x.step === v.step);
  console.log(`| ${v.kind} | ${v.step} | ${v.distinctRows} | ${off?.distinctRows} |`);
}
table('scriptMs', 'Script time, ms');
table('taskMs', 'All tasks, ms');
table('frameP95', 'Frame interval p95, ms');
table('long50', 'Frames over 50 ms');
table('long25', 'Frames over 25 ms');
table('wallMs', 'Wall time of the scroll, ms');
