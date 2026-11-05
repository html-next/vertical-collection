// Usage: node bench/recycle/run.mjs [--ember 7.4.0] [--rounds 15] [--steps 300] [--out name] [--chrome <path>]
// Each group runs recycling on and off back to back, in random order, so a pair shares its load.
// --baselines also runs plain {{#each}} and a minimal window, for the scroll and for the mount.
// compare.mjs compares builds of this app.
import { execSync, spawn } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { loadavg, tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    ember: { type: 'string', default: '7.4.0' },
    rounds: { type: 'string', default: '15' },
    steps: { type: 'string', default: '300' },
    out: { type: 'string', default: 'ember-7.4.0' },
    dist: { type: 'string' },
    baselines: { type: 'boolean', default: false },
    chrome: { type: 'string', default: process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' },
  },
});
const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '../..');
const work = mkdtempSync(join(tmpdir(), 'vc-recycle-'));
const sh = (cmd, cwd) => execSync(cmd, { cwd, stdio: ['ignore', 'ignore', 'inherit'] });
const edit = (file, change) => writeFileSync(file, change(readFileSync(file, 'utf8')));
const ref = execSync('git rev-parse HEAD', { cwd: repo }).toString().trim();

function build() {
  const dir = join(work, 'build');
  sh(`git worktree add -q --detach "${dir}" ${ref}`, repo);
  cpSync(join(here, 'app'), join(dir, 'test-app/app'), { recursive: true });
  edit(join(dir, 'test-app/app/router.ts'), (t) => t.replace("this.route('settings');", "this.route('settings');\n  this.route('recycle-benchmark');"));
  sh('pnpm install --no-frozen-lockfile', dir);
  sh(`pnpm add -D ember-source@${values.ember}`, join(dir, 'test-app'));
  sh('pnpm build', join(dir, 'vertical-collection'));
  sh('pnpm install --no-frozen-lockfile', dir);
  sh('pnpm exec vite build --mode production', join(dir, 'test-app'));
  return { dir, dist: join(dir, 'test-app/dist') };
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.map': 'application/json' };
const serve = (dist) =>
  new Promise((resolve) => {
    const server = createServer((req, res) => {
      const path = new URL(req.url, 'http://x').pathname;
      const file = join(dist, path === '/' ? 'index.html' : path);
      if (!existsSync(file)) return res.writeHead(404).end();
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
      res.end(readFileSync(file));
    });
    server.listen(0, () => resolve({ server, port: server.address().port }));
  });

async function startChrome() {
  const chrome = spawn(values.chrome, [
    '--headless=new', '--remote-debugging-port=0', `--user-data-dir=${join(work, 'chrome')}`,
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
    if (pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
    }
  };
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      pending.set(++id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  return { chrome, ws, send };
}

async function openPage({ send }, url) {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const call = (method, params) => send(method, params, sessionId);
  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (exceptionDetails) throw new Error(JSON.stringify(exceptionDetails).slice(0, 500));
    return result.value;
  };
  await call('Performance.enable');
  await call('Page.navigate', { url });
  for (let i = 0; i < 2400; i++) {
    if (await evaluate('Boolean(window.__bench)').catch(() => false)) break;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  await evaluate('window.__bench.ready()');
  const metrics = async () => Object.fromEntries((await call('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
  return { call, evaluate, metrics, close: () => send('Target.closeTarget', { targetId }) };
}

const GROUPS = [
  { kind: 'light', cpu: 1, step: 300 },
  { kind: 'light', cpu: 4, step: 300 },
  { kind: 'medium', cpu: 1, step: 300 },
  { kind: 'medium', cpu: 4, step: 300 },
  { kind: 'heavy', cpu: 1, step: 300 },
  { kind: 'heavy', cpu: 4, step: 300 },
  { kind: 'heavy', cpu: 1, step: 1500 },
  { kind: 'heavy', cpu: 4, step: 1500 },
];
const MOUNT_GROUPS = ['light', 'medium', 'heavy'].flatMap((kind) => [1, 4].map((cpu) => ({ kind, cpu })));
const shuffle = (list) => list.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(([, v]) => v);

const tree = values.dist ? undefined : build();
const dist = values.dist ?? tree.dist;
const { server, port } = await serve(dist);
const browser = await startChrome();
const steps = Number(values.steps);

const VARIANTS = [
  { impl: 'vc', recycle: true },
  { impl: 'vc', recycle: false },
  ...(values.baselines ? [{ impl: 'each', recycle: false }, { impl: 'window', recycle: false }] : []),
];
// The minimal window needs a fixed row height, and medium rows do not have one.
const variantsFor = ({ kind }) => VARIANTS.filter((v) => v.impl !== 'window' || kind !== 'medium');
const pageUrl = (group, { impl, recycle }, extra = '') => `http://localhost:${port}/?rows=10000&kind=${group.kind}&impl=${impl}&recycle=${recycle}${extra}#/recycle-benchmark`;

const mountOne = async (group, variant) => {
  const page = await openPage(browser, pageUrl(group, variant, '&defer=1'));
  await page.call('Emulation.setCPUThrottlingRate', { rate: group.cpu });
  await page.call('HeapProfiler.collectGarbage');
  const before = await page.metrics();
  const result = await page.evaluate('window.__bench.mount()');
  const after = await page.metrics();
  await page.call('HeapProfiler.collectGarbage');
  const collected = await page.metrics();
  await page.close();
  const delta = (name) => (after[name] - before[name]) * 1000;
  return {
    test: 'mount', ...group, ...variant, ...result,
    scriptMs: delta('ScriptDuration'), taskMs: delta('TaskDuration'),
    layoutMs: delta('LayoutDuration'), styleMs: delta('RecalcStyleDuration'),
    heapMb: (collected.JSHeapUsedSize - before.JSHeapUsedSize) / 2 ** 20,
    load1: loadavg()[0],
  };
};

const one = async (group, variant, observe) => {
  const page = await openPage(browser, pageUrl(group, variant));
  await page.call('Emulation.setCPUThrottlingRate', { rate: group.cpu });
  const before = await page.metrics();
  const result = await page.evaluate(`window.__bench.scroll(${group.step}, ${steps}, ${observe})`);
  const after = await page.metrics();
  await page.close();
  const delta = (name) => (after[name] - before[name]) * 1000;
  return {
    test: 'scroll', ...group, ...variant, ...result,
    scriptMs: delta('ScriptDuration'), taskMs: delta('TaskDuration'),
    layoutMs: delta('LayoutDuration'), styleMs: delta('RecalcStyleDuration'),
    load1: loadavg()[0],
  };
};

const chromeVersion = execSync(`"${values.chrome}" --version`).toString().trim();
const output = { ember: values.ember, ref, chrome: chromeVersion, rounds: Number(values.rounds), steps, baselines: values.baselines, validation: [], runs: [] };
mkdirSync(join(here, 'results'), { recursive: true });
const save = () => writeFileSync(join(here, 'results', `${values.out}.json`), JSON.stringify(output, null, 1) + '\n');

// The observer costs time, so these runs only show that the flag does what it says, and are not timed.
for (const group of GROUPS.filter((g) => g.cpu === 1)) {
  for (const variant of variantsFor(group)) {
    const { kind, step, distinctRows, firstRowId, scrollTop } = await one(group, variant, true);
    output.validation.push({ kind, step, ...variant, distinctRows, firstRowId, scrollTop });
    console.log(JSON.stringify(output.validation.at(-1)));
  }
}
save();

for (let round = 0; round < output.rounds; round++) {
  if (values.baselines) {
    for (const group of shuffle(MOUNT_GROUPS)) {
      for (const variant of shuffle(variantsFor(group))) {
        const run = { round, ...(await mountOne(group, variant)) };
        output.runs.push(run);
        console.log(`${round} mount ${run.kind} x${run.cpu} ${run.impl} ${run.recycle ? 'on ' : 'off'} mount=${run.mountMs.toFixed(0)} script=${run.scriptMs.toFixed(0)} task=${run.taskMs.toFixed(0)} rows=${run.rows} nodes=${run.domNodes} heap=${run.heapMb.toFixed(1)} load=${run.load1.toFixed(0)}`);
      }
    }
  }
  for (const group of shuffle(GROUPS)) {
    for (const variant of shuffle(variantsFor(group))) {
      const run = { round, ...(await one(group, variant, false)) };
      output.runs.push(run);
      console.log(`${round} ${run.kind} x${run.cpu} step${run.step} ${run.impl} ${run.recycle ? 'on ' : 'off'} script=${run.scriptMs.toFixed(0)} task=${run.taskMs.toFixed(0)} p95=${run.frameP95.toFixed(0)} long50=${run.long50} load=${run.load1.toFixed(0)}`);
    }
  }
  save();
}
browser.ws.close();
browser.chrome.kill();
server.close();
if (tree) sh(`git worktree remove --force "${tree.dir}"`, repo);
