// Compares builds of the bench app. Each build runs with recycling on and off, in random order.
// The first build also runs the minimal window. After each scroll, this checks the rendered rows.
//
// Build each commit as run.mjs does, then:
//   node bench/recycle/compare.mjs --dist main=<dist> --dist patch=<dist> --out <name> [--rounds 10] [--cases light:1:300:down,heavy:4:1500:down]
//   node bench/recycle/compare.mjs --report results/<name>.json
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { loadavg, tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    dist: { type: 'string', multiple: true, default: [] },
    out: { type: 'string', default: 'compare' },
    rounds: { type: 'string', default: '10' },
    cases: { type: 'string', default: 'light:1:300:down,medium:1:300:down,heavy:1:300:down,heavy:4:1500:down,light:1:300:up,heavy:1:300:up' },
    report: { type: 'string' },
    chrome: { type: 'string', default: process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' },
  },
});

const median = (list) => {
  const a = [...list].sort((x, y) => x - y);
  const i = (a.length - 1) / 2;
  return (a[Math.floor(i)] + a[Math.ceil(i)]) / 2;
};

let seed = 1;
const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
const quantile = (list, p) => {
  const a = [...list].sort((x, y) => x - y);
  const i = (a.length - 1) * p;
  const low = Math.floor(i);
  return a[low] + (a[Math.ceil(i)] - a[low]) * (i - low);
};
const interval = (list) => {
  const medians = Array.from({ length: 10000 }, () => median(list.map(() => list[Math.floor(random() * list.length)])));
  return [quantile(medians, 0.025), quantile(medians, 0.975)];
};

if (values.report) {
  report(JSON.parse(readFileSync(values.report, 'utf8')));
  process.exit();
}

const here = dirname(fileURLToPath(import.meta.url));
const dists = values.dist.map((v) => v.split('='));
const ROW_HEIGHT = { light: 40, table: 44, heavy: 44 };
const CASES = values.cases.split(',').map((c) => {
  const [kind, cpu, step, dir] = c.split(':');
  return { kind, cpu: +cpu, step: +step, dir };
});

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const serve = (dist) =>
  new Promise((resolve) => {
    const server = createServer((req, res) => {
      const path = new URL(req.url, 'http://x').pathname;
      const file = join(dist, path === '/' ? 'index.html' : path);
      if (!existsSync(file)) return res.writeHead(404).end();
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      res.end(readFileSync(file));
    });
    server.listen(0, () => resolve(server));
  });

const servers = {};
for (const [name, dist] of dists) servers[name] = await serve(dist);

const VARIANTS = [
  ...dists.flatMap(([build]) => [
    { name: `${build} off`, build, query: 'impl=vc&recycle=false' },
    { name: `${build} on`, build, query: 'impl=vc&recycle=true' },
  ]),
  { name: 'window', build: dists[0][0], query: 'impl=window&recycle=false' },
];

const chrome = spawn(values.chrome, [
  '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'vc-compare-'))}`,
  '--window-size=1440,900', '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', 'about:blank',
]);
const url = await new Promise((resolve) => {
  let err = '';
  chrome.stderr.on('data', (d) => {
    err += d;
    const m = err.match(/ws:\/\/\S+/);
    if (m) resolve(m[0]);
  });
});
const ws = new WebSocket(url);
await new Promise((resolve) => (ws.onopen = resolve));
let id = 0;
const pending = new Map();
ws.onmessage = ({ data }) => {
  const message = JSON.parse(data);
  if (!pending.has(message.id)) return;
  const { resolve, reject } = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) reject(new Error(JSON.stringify(message.error)));
  else resolve(message.result);
};
const send = (method, params = {}, sessionId) =>
  new Promise((resolve, reject) => {
    pending.set(++id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params, sessionId }));
  });

const CHECK = `(async () => {
  for (let i = 0; i < 15; i++) await new Promise(requestAnimationFrame);
  const scroller = document.getElementById('bench-scroller');
  const rows = [...scroller.querySelectorAll('.bench-row')];
  const ids = rows.map((row) => +row.dataset.id);
  const top = scroller.getBoundingClientRect().top;
  const inView = rows.find((row) => row.getBoundingClientRect().bottom > top + 1);
  return {
    inOrder: ids.every((v, i) => i === 0 || v === ids[i - 1] + 1),
    rows: ids.length,
    topId: inView ? +inView.dataset.id : null,
    scrollTop: scroller.scrollTop,
  };
})()`;

async function one(group, variant) {
  const port = servers[variant.build].address().port;
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const call = (method, params) => send(method, params, sessionId);
  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (exceptionDetails) throw new Error(JSON.stringify(exceptionDetails).slice(0, 500));
    return result.value;
  };
  const metrics = async () => Object.fromEntries((await call('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));

  await call('Performance.enable');
  await call('Page.navigate', { url: `http://localhost:${port}/?rows=10000&kind=${group.kind}&${variant.query}#/recycle-benchmark` });
  for (let i = 0; i < 2400; i++) {
    if (await evaluate('Boolean(window.__bench)').catch(() => false)) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await evaluate('window.__bench.ready()');
  await evaluate(`window.__errors = []; addEventListener('error', (e) => __errors.push(String(e.message))); addEventListener('unhandledrejection', (e) => __errors.push(String(e.reason)));`);
  if (group.dir === 'up') {
    await evaluate('window.__bench.scroll(90000, 1, false)');
    await evaluate(CHECK);
  }

  await call('Emulation.setCPUThrottlingRate', { rate: group.cpu });
  const before = await metrics();
  const scroll = await evaluate(`window.__bench.scroll(${group.dir === 'up' ? -group.step : group.step}, 300, false)`);
  const after = await metrics();
  await call('Emulation.setCPUThrottlingRate', { rate: 1 });

  const check = await evaluate(CHECK);
  const errors = await evaluate('window.__errors');
  await send('Target.closeTarget', { targetId });

  const height = ROW_HEIGHT[group.kind];
  return {
    ...group,
    name: variant.name,
    taskMs: (after.TaskDuration - before.TaskDuration) * 1000,
    wallMs: scroll.wallMs,
    frameP95: scroll.frameP95,
    long50: scroll.long50,
    ...check,
    topOk: height ? check.topId === Math.floor(check.scrollTop / height) : null,
    errors,
    load1: loadavg()[0],
  };
}

const shuffle = (list) => list.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);
const output = { variants: VARIANTS.map((v) => v.name), rounds: +values.rounds, runs: [] };
const file = join(here, 'results', `${values.out}.json`);
for (let round = 0; round < output.rounds; round++) {
  for (const group of shuffle(CASES)) {
    for (const variant of shuffle(VARIANTS)) {
      if (variant.name === 'window' && group.kind === 'medium') continue;
      const run = { round, ...(await one(group, variant)) };
      output.runs.push(run);
      console.log(`${round} ${run.kind} ${run.cpu}x ${run.step} ${run.dir} ${run.name} task=${run.taskMs.toFixed(0)} p95=${run.frameP95.toFixed(0)} long50=${run.long50} inOrder=${run.inOrder} topOk=${run.topOk} errors=${errors(run)} load=${run.load1.toFixed(0)}`);
      writeFileSync(file, JSON.stringify(output, null, 1) + '\n');
    }
  }
}
ws.close();
chrome.kill();
Object.values(servers).forEach((server) => server.close());

function errors(run) {
  return run.errors.length;
}

function report({ variants, runs }) {
  const groupOf = (r) => `${r.kind} | ${r.cpu}x | ${r.step} | ${r.dir}`;
  const groups = [...new Set(runs.map(groupOf))].sort();
  const load = runs.map((r) => r.load1);
  const failed = runs.filter((r) => !r.inOrder || r.topOk === false || r.errors.length > 0);
  console.log(`${runs.length} runs, ${new Set(runs.map((r) => r.round)).size} rounds, 10 000 rows, 300 steps. Load average median ${median(load).toFixed(0)}, max ${Math.max(...load).toFixed(0)}. Runs with wrong rows or errors: ${failed.length}.`);
  const [offA, onA, offB, onB] = variants;
  console.log(`\n### All tasks, paired by round, ms (95% bootstrap interval)\n\n| Rows | CPU | Step | Direction | ${offB} vs ${onA} | ${offA} vs ${onA} | ${offB} vs ${offA} | ${onB} vs ${onA} |\n|---|---|---|---|---|---|---|---|`);
  for (const group of groups) {
    const inGroup = runs.filter((r) => groupOf(r) === group);
    const pair = (x, y) => {
      const diff = inGroup.filter((r) => r.name === x).map((r) => r.taskMs - inGroup.find((o) => o.name === y && o.round === r.round)?.taskMs).filter(Number.isFinite);
      const [low, high] = interval(diff);
      const base = median(inGroup.filter((r) => r.name === y).map((r) => r.taskMs));
      return `${median(diff).toFixed(0)} (${low.toFixed(0)} to ${high.toFixed(0)}), ${((median(diff) / base) * 100).toFixed(0)}%`;
    };
    console.log(`| ${group} | ${pair(offB, onA)} | ${pair(offA, onA)} | ${pair(offB, offA)} | ${pair(onB, onA)} |`);
  }
  for (const [metric, label] of [['taskMs', 'All tasks, ms'], ['frameP95', 'Frame interval p95, ms'], ['long50', 'Frames over 50 ms'], ['wallMs', 'Wall time of the scroll, ms']]) {
    console.log(`\n### ${label}\n\n| Rows | CPU | Step | Direction | ${variants.join(' | ')} |\n|---|---|---|---${'|---'.repeat(variants.length)}|`);
    for (const group of groups) {
      const cells = variants.map((v) => {
        const list = runs.filter((r) => groupOf(r) === group && r.name === v).map((r) => r[metric]);
        return list.length ? median(list).toFixed(0) : '–';
      });
      console.log(`| ${group} | ${cells.join(' | ')} |`);
    }
  }
}
