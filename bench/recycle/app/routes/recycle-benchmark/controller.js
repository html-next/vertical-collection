import Controller from '@ember/controller';
import { tracked } from '@glimmer/tracking';

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const params = new URLSearchParams(location.search);
const kind = params.get('kind') ?? 'medium';

const series = (id) => Array.from({ length: 30 }, (_, i) => ((id * 7 + i * 13) % 97) + Math.sin(i + id) * 10);

export const makeRows = (count) =>
  Array.from({ length: count }, (_, id) => ({
    id,
    title: `Equipment ${id}`,
    date: `2026-${String((id % 12) + 1).padStart(2, '0')}-14`,
    note: id % 3 === 0 ? 'Long note. '.repeat((id % 5) + 2) : null,
    tags: Array.from({ length: (id % 5) + 1 }, (_, t) => `tag ${t}`),
    values: kind === 'heavy' ? Array.from({ length: 8 }, (_, i) => id * (i + 1) * 1.37) : [],
    seriesList: kind === 'heavy' ? [series(id), series(id + 1), series(id + 2)] : [],
  }));

const quantile = (sorted, p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0;

export default class extends Controller {
  @tracked items = [];
  shouldRecycle = params.get('recycle') !== 'false';
  isLight = kind === 'light';
  isMedium = kind === 'medium';
  isHeavy = kind === 'heavy';

  constructor() {
    super(...arguments);
    window.__bench = {
      ready: async () => {
        while (!document.querySelector('.bench-row')) await nextFrame();
        for (let i = 0; i < 20; i++) await nextFrame();
        return true;
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
