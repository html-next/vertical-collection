import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const params = new URLSearchParams(location.search);
const kind = params.get('kind') ?? 'medium';
const impl = params.get('impl') ?? 'vc';
const deferred = params.has('defer');
const windowSizes = { light: { height: 40, buffer: 5 }, table: { height: 44, buffer: 10 }, heavy: { height: 44, buffer: 10 } };

const series = (id) => Array.from({ length: 30 }, (_, i) => ((id * 7 + i * 13) % 97) + Math.sin(i + id) * 10);

export const makeRows = (count) =>
  Array.from({ length: count }, (_, id) => ({
    id,
    title: `Equipment ${id}`,
    date: `2026-${String((id % 12) + 1).padStart(2, '0')}-14`,
    note: id % 3 === 0 ? 'Long note. '.repeat((id % 5) + 2) : null,
    tags: Array.from({ length: (id % 5) + 1 }, (_, t) => `tag ${t}`),
    cells: kind === 'table' ? Array.from({ length: 8 }, (_, i) => `${id * (i + 1)} km`) : [],
    values: kind === 'heavy' ? Array.from({ length: 8 }, (_, i) => id * (i + 1) * 1.37) : [],
    seriesList: kind === 'heavy' ? [series(id), series(id + 1), series(id + 2)] : [],
  }));

const quantile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;

export default class extends Controller {
  @tracked items = [];
  @tracked mounted = !deferred;
  @tracked windowStart = 0;
  shouldRecycle = params.get('recycle') !== 'false';
  isLight = kind === 'light';
  isMedium = kind === 'medium';
  isTable = kind === 'table';
  isHeavy = kind === 'heavy';
  isVc = impl === 'vc';
  isEach = impl === 'each';
  isWindow = impl === 'window';
  windowRowHeight = windowSizes[kind]?.height;

  // Same row count as vertical-collection: Math.ceil(containerHeight / height) + bufferSize * 2 + 1
  get windowItems() {
    const { height, buffer } = windowSizes[kind];
    return this.items.slice(this.windowStart, this.windowStart + Math.ceil(600 / height) + buffer * 2 + 1);
  }

  get windowTotalHeight() {
    return this.items.length * this.windowRowHeight;
  }

  get windowOffset() {
    return this.windowStart * this.windowRowHeight;
  }

  onScroll = ({ target }) => {
    if (!this.isWindow) return;
    this.windowStart = Math.max(0, Math.floor(target.scrollTop / this.windowRowHeight) - windowSizes[kind].buffer);
  };

  constructor() {
    super(...arguments);
    window.__bench = {
      ready: async () => {
        while (!document.querySelector(deferred ? '#bench-scroller' : '.bench-row')) await nextFrame();
        for (let i = 0; i < 20; i++) await nextFrame();
        return true;
      },
      mount: async () => {
        const started = performance.now();
        this.mounted = true;
        let last = 0;
        let stable = 0;
        let settledAt;
        while (stable < 10) {
          await nextFrame();
          const rows = document.querySelectorAll('.bench-row').length;
          if (rows > 0 && rows === last) {
            if (++stable === 1) settledAt = performance.now();
          } else {
            stable = 0;
            last = rows;
          }
        }
        return { mountMs: settledAt - started, rows: last, domNodes: document.getElementsByTagName('*').length };
      },
      scroll: async (step, count, observe) => {
        const scroller = document.getElementById('bench-scroller');
        const seen = new WeakSet();
        let distinctRows = 0;
        const note = (element) => {
          if (!seen.has(element)) {
            seen.add(element);
            distinctRows++;
          }
        };
        const observer = observe
          ? new MutationObserver((list) => {
              for (const { addedNodes } of list) {
                for (const node of addedNodes) if (node.classList?.contains('bench-row')) note(node);
              }
            })
          : undefined;
        if (observe) {
          document.querySelectorAll('.bench-row').forEach(note);
          observer.observe(scroller, { childList: true, subtree: true });
        }
        const intervals = [];
        let active = true;
        let last = performance.now();
        const watch = (now) => {
          intervals.push(now - last);
          last = now;
          if (active) requestAnimationFrame(watch);
        };
        requestAnimationFrame(watch);
        const started = performance.now();
        for (let i = 0; i < count; i++) {
          scroller.scrollTop += step;
          await nextFrame();
          await nextFrame();
        }
        const wallMs = performance.now() - started;
        active = false;
        observer?.disconnect();
        const sorted = intervals.slice(1).sort((a, b) => a - b);
        return {
          wallMs,
          frames: sorted.length,
          frameP50: quantile(sorted, 0.5),
          frameP95: quantile(sorted, 0.95),
          frameMax: sorted.at(-1) ?? 0,
          long25: sorted.filter((v) => v > 25).length,
          long50: sorted.filter((v) => v > 50).length,
          distinctRows,
          firstRowId: document.querySelector('.bench-row')?.dataset.id,
          scrollTop: scroller.scrollTop,
        };
      },
    };
  }
}
