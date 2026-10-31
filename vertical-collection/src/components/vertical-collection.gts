import { DEBUG } from '@glimmer/env';
import { assert } from '@ember/debug';

import Component from '@glimmer/component';
import type Owner from '@ember/owner';
import { registerDestructor } from '@ember/destroyable';
import { run } from '@ember/runloop';

import { scheduler, Token, type QueueName } from 'ember-raf-scheduler';

import {
  keyForItem,
  ViewportContainer,
  DynamicRadar,
  StaticRadar,
} from '../-private/index.ts';
import type Radar from '../-private/data-view/radar/radar.ts';
import type { RadarAction } from '../-private/data-view/radar/radar.ts';
import type { VerticalRect } from '../-private/utils/element/get-scaled-client-rect.ts';

export interface VerticalCollectionAPI {
  scrollToItem(index: number): Promise<void>;
}

export type VerticalCollectionAction<T> = (
  item: T,
  index: number,
  key: unknown,
) => void;

export interface VerticalCollectionSignature<T> {
  Args: {
    items?: readonly T[] | null;
    estimateHeight: number | string;
    key?: string;
    staticHeight?: boolean;
    shouldRecycle?: boolean;
    containerSelector?: string;
    bufferSize?: number;
    initialRenderCount?: number;
    idForFirstItem?: unknown;
    renderFromLast?: boolean;
    renderAll?: boolean;
    occlusionTagName?: string;
    firstReached?: VerticalCollectionAction<T>;
    lastReached?: VerticalCollectionAction<T>;
    firstVisibleChanged?: VerticalCollectionAction<T>;
    lastVisibleChanged?: VerticalCollectionAction<T>;
    registerAPI?: (api: VerticalCollectionAPI | null) => void;
    debugVis?: boolean;
    debugCSS?: boolean;
  };
  Blocks: {
    default: [item: T, index: number];
    else: [];
  };
}

/*
 * BEGIN DEBUG HELPERS
 *
 * These methods and the Visualization class are used by DEBUG code paths.
 */
function isNonZero(value: string): boolean {
  const int = parseInt(value, 10);
  const float = parseFloat(value);

  return !isNaN(int) && (int !== 0 || float !== 0);
}

function hasStyleValue(
  styles: CSSStyleDeclaration,
  key: string,
  value: string,
): boolean {
  return styles.getPropertyValue(key) === value;
}

function hasStyleWithNonZeroValue(
  styles: CSSStyleDeclaration,
  key: string,
): boolean {
  return isNonZero(styles.getPropertyValue(key));
}

function styleIsOneOf(
  styles: CSSStyleDeclaration,
  key: string,
  values: string[],
): boolean {
  const value = styles.getPropertyValue(key);
  return Boolean(value) && values.indexOf(value) !== -1;
}

function applyVerticalStyles(
  element: HTMLElement,
  geography: VerticalRect,
): void {
  element.style.height = `${geography.height}px`;
  element.style.top = `${geography.top}px`;
}

class Visualization<T> {
  radar: Radar<T>;
  satellites: HTMLElement[];
  cache: HTMLElement[];
  wrapper: HTMLElement;
  container: HTMLElement;
  itemContainer: HTMLElement;
  scrollContainer: HTMLElement;
  screen: HTMLElement;

  constructor(radar: Radar<T>) {
    this.radar = radar;
    this.satellites = [];
    this.cache = [];

    this.wrapper = document.createElement('div');
    this.wrapper.className = 'vertical-collection-visual-debugger';

    this.container = document.createElement('div');
    this.container.className = 'vc_visualization-container';
    this.wrapper.appendChild(this.container);

    this.itemContainer = document.createElement('div');
    this.itemContainer.className = 'vc_visualization-item-container';
    this.container.appendChild(this.itemContainer);

    this.scrollContainer = document.createElement('div');
    this.scrollContainer.className = 'vc_visualization-scroll-container';
    this.container.appendChild(this.scrollContainer);

    this.screen = document.createElement('div');
    this.screen.className = 'vc_visualization-screen';
    this.container.appendChild(this.screen);

    document.body.appendChild(this.wrapper);
  }

  render(): void {
    this.styleViewport();
    this.updateSatellites();
  }

  styleViewport(): void {
    const _scrollContainer = this.radar.scrollContainer;
    this.container.style.height = `${_scrollContainer.getBoundingClientRect().height}px`;

    applyVerticalStyles(
      this.scrollContainer,
      _scrollContainer.getBoundingClientRect(),
    );
    applyVerticalStyles(this.screen, ViewportContainer.getBoundingClientRect());
  }

  makeSatellite(): void {
    let satellite = this.cache.pop();

    if (satellite === undefined) {
      satellite = document.createElement('div');
      satellite.className = 'vc_visualization-virtual-component';
    }

    this.satellites.push(satellite);
    this.itemContainer.append(satellite);
  }

  updateSatellites(): void {
    const { satellites: sats } = this;
    let {
      firstItemIndex,
      lastItemIndex,

      totalItems,

      totalBefore,
      totalAfter,
      _calculatedEstimateHeight,
    } = this.radar;
    const skipList =
      this.radar instanceof DynamicRadar ? this.radar.skipList : null;

    const itemHeights = skipList?.values;

    const firstVisualizedIndex = Math.max(firstItemIndex - 10, 0);
    const lastVisualizedIndex = Math.min(lastItemIndex + 10, totalItems - 1);

    const lengthWithBuffer = lastVisualizedIndex - firstVisualizedIndex + 1;
    const isShrinking = sats.length > lengthWithBuffer;

    while (sats.length !== lengthWithBuffer) {
      const satellite = isShrinking ? sats.pop() : undefined;

      if (satellite !== undefined) {
        satellite.remove();
        this.cache.push(satellite);
      } else {
        this.makeSatellite();
      }
    }

    sats.forEach((element, i) => {
      const itemIndex = firstVisualizedIndex + i;
      const itemHeight = itemHeights?.[itemIndex] ?? _calculatedEstimateHeight;

      element.style.height = `${itemHeight}px`;
      element.setAttribute('index', String(itemIndex));
      element.innerText = String(itemIndex);

      if (itemIndex < firstItemIndex) {
        element.classList.add('culled');
        totalBefore -= itemHeight;
      } else if (itemIndex > lastItemIndex) {
        element.classList.add('culled');
        totalAfter -= itemHeight;
      } else {
        element.classList.remove('culled');
      }
    });

    this.itemContainer.style.paddingTop = `${totalBefore}px`;
    this.itemContainer.style.paddingBottom = `${totalAfter}px`;
  }

  destroy(): void {
    this.wrapper.remove();
    this.satellites.forEach((satellite) => satellite.remove());
    this.satellites = [];
    this.cache = [];
  }
}
/*
 * END DEBUG HELPERS
 */

class VerticalCollection<T = unknown> extends Component<
  VerticalCollectionSignature<T>
> {
  private token: Token;
  private _radar: Radar<T>;
  private _scheduledActions: [RadarAction, number][];
  private _nextSendActions: ReturnType<typeof setTimeout> | null;
  private __visualization: Visualization<T> | null = null;

  /**
   * Property name used for storing references to each item in items. Accessing this attribute for each item
   * should yield a unique result for every item in the list.
   *
   * @property key
   * @type String
   * @default '@identity'
   */
  get key(): string {
    return this.args.key ?? '@identity';
  }

  // –––––––––––––– Required Settings

  /**
   * Estimated height of an item to be rendered. Use best guess as this will be used to determine how many items
   * are displayed virtually, before and after the vertical-collection viewport.
   *
   * @property estimateHeight
   * @type Number
   * @required
   */
  get estimateHeight(): number | string | null {
    return this.args.estimateHeight ?? null;
  }

  /**
   * List of objects to svelte-render.
   * Can be called like `<VerticalCollection @items={{itemsArray}} />`.
   *
   * @property items
   * @type Array
   * @required
   */
  get items(): readonly T[] | null {
    return this.args.items ?? null;
  }

  // –––––––––––––– Optional Settings
  /**
   * Indicates if the occluded items' heights will change or not.
   * If true, the vertical-collection will assume that items' heights are always equal to estimateHeight;
   * this is more performant, but less flexible.
   *
   * @property staticHeight
   * @type Boolean
   */
  get staticHeight(): boolean {
    return this.args.staticHeight ?? false;
  }

  /**
   * Indicates whether the rendered block of an item that scrolls out of the rendered range is
   * reused for the item that scrolls in. Reuse keeps the `{{#each}}` key of the block stable, so
   * the components inside it are not torn down and only the yielded item and index change. This
   * does less work than rendering a block again for every item that scrolls in.
   *
   * Reuse is only safe if the block derives everything it renders from the yielded item and index.
   * A reused block keeps all other state, which then belongs to the item that was rendered there
   * before, and shows as stale content. Set to false when the block holds:
   *  - `unbound` values
   *  - state copied from arguments in a constructor, an init, or a class field
   *  - state set once from an element modifier or from didInsertElement
   *  - uncontrolled DOM state, e.g. a nested scroll position, typed input, or a running transition
   *
   * Also set to false when the templates for individual items vary widely, or depend on
   * conditionals that are likely to change, because that defeats the benefit of reuse anyway.
   *
   * @property shouldRecycle
   * @type Boolean
   * @default true
   */
  get shouldRecycle(): boolean {
    return this.args.shouldRecycle ?? true;
  }

  /*
   * A selector string that will select the element from
   * which to calculate the viewable height and needed offsets.
   *
   * This element will also have the `scroll` event handler added to it.
   *
   * Usually this element will be the component's immediate parent element,
   * if so, you can leave this null.
   *
   * Set this to "body" to scroll the entire web page.
   */
  get containerSelector(): string {
    return this.args.containerSelector ?? '*';
  }

  // –––––––––––––– Performance Tuning
  /**
   * The amount of extra items to keep visible on either side of the viewport -- must be greater than 0.
   * Increasing this value is useful when doing infinite scrolling and loading data from a remote service,
   * with the desire to allow records to show as the user scrolls and the backend API takes time to respond.
   *
   * @property bufferSize
   * @type Number
   * @default 1
   */
  get bufferSize(): number {
    return this.args.bufferSize ?? 1;
  }

  // –––––––––––––– Initial Scroll State
  /**
   * If set, upon initialization the scroll
   * position will be set such that the item
   * with the provided id is at the top left
   * on screen.
   *
   * If the item cannot be found, scrollTop
   * is set to 0.
   * @property idForFirstItem
   */
  get idForFirstItem(): unknown {
    return this.args.idForFirstItem ?? null;
  }

  /**
   * If set, if scrollPosition is empty
   * at initialization, the component will
   * render starting at the bottom.
   * @property renderFromLast
   * @type Boolean
   * @default false
   */
  get renderFromLast(): boolean {
    return this.args.renderFromLast ?? false;
  }

  /**
   * If set to true, the collection will render all of the items passed into the component.
   * This counteracts the performance benefits of using vertical collection, but has several potential applications,
   * including but not limited to:
   *
   * - It allows for improved accessibility since all elements are rendered and can be picked up by a screen reader.
   * - Can be applied in SEO solutions (i.e. fastboot) where rendering every item is desirable.
   * - Can be used to respond to the keyboard input for Find (i.e. ctrl+F/cmd+F) to show all elements, which then
   *    allows the list items to be searchable
   *
   * @property renderAll
   * @type Boolean
   * @default false
   */
  get renderAll(): boolean {
    return this.args.renderAll ?? false;
  }

  /**
   * The tag name used in DOM elements before and after the rendered list. By default, it is set to
   * 'occluded-content' to avoid any confusion with user's CSS settings. However, it could be
   * overriden to provide custom behavior (for example, in table user wants to set it to 'tr' to
   * comply with table semantics).
   */
  get occlusionTagName(): string {
    return this.args.occlusionTagName ?? 'occluded-content';
  }

  get isEmpty(): boolean {
    return !this.items?.length;
  }

  get shouldYieldToInverse(): boolean {
    return this.isEmpty;
  }

  /**
   * The pool of components the template renders. Called from the template with the
   * inputs it depends on, so it runs again when one of them changes: the items, their
   * length, which a tracked array reports when it changes in place, and the radar settings.
   */
  private virtualComponents = (
    items: readonly T[] | null,
    itemsLength: number | undefined,
    renderAll: boolean,
    estimateHeight: number | string | null,
    bufferSize: number,
  ) => {
    const { _radar } = this;

    items ??= [];
    assert(
      '@items must be an array. ArrayProxy and PromiseArray are not supported.',
      Array.isArray(items),
    );

    _radar.items = items;
    _radar.estimateHeight = estimateHeight;
    _radar.renderAll = renderAll;
    _radar.bufferSize = bufferSize;

    _radar.scheduleUpdate(true);
    this._clearScheduledActions();

    return _radar.virtualComponents;
  };

  private schedule(queueName: QueueName, job: () => void): Token {
    return scheduler.schedule(queueName, job, this.token);
  }

  private _clearScheduledActions(): void {
    clearTimeout(this._nextSendActions ?? undefined);
    this._nextSendActions = null;
    this._scheduledActions.length = 0;
  }

  private _scheduleSendAction(action: RadarAction, index: number): void {
    this._scheduledActions.push([action, index]);

    if (this._nextSendActions === null) {
      this._nextSendActions = setTimeout(() => {
        this._nextSendActions = null;

        // eslint-disable-next-line ember/no-runloop
        run(() => {
          const items = this.items ?? [];
          const keyPath = this.key;

          this._scheduledActions.forEach(([action, index]) => {
            const item = items[index];

            if (item !== undefined) {
              this.args[action]?.(
                item,
                index,
                keyForItem(item, keyPath, index),
              );
            }
          });
          this._scheduledActions.length = 0;
        });
      });
    }
  }

  /* Public API Methods
     @index => number
     This will return offset height of the indexed item.
  */
  scrollToItem(index: number): Promise<void> {
    const { _radar } = this;
    // Getting the offset height from Radar
    const scrollTop = _radar.getOffsetForIndex(index);
    _radar.scrollContainer.scrollTop = scrollTop;
    // To scroll exactly to specified index, we are changing the prevIndex values to specified index
    _radar._prevFirstVisibleIndex = _radar._prevFirstItemIndex = index;
    // Components will be rendered after schedule 'measure' inside 'update' method.
    // In our case, we need to focus the element after component is rendered. So passing the promise.
    return new Promise<void>((resolve) => {
      _radar.scheduleUpdate(false, resolve);
    });
  }

  // –––––––––––––– Setup/Teardown

  constructor(owner: Owner, args: VerticalCollectionSignature<T>['Args']) {
    super(owner, args);

    this.token = new Token();
    registerDestructor(this, () => {
      this.token.cancel();
      this._radar.destroy();
      this.args.registerAPI?.(null);
      clearTimeout(this._nextSendActions ?? undefined);

      if (DEBUG && this.__visualization) {
        console.info('destroying visualization');
        this.__visualization.destroy();
        this.__visualization = null;
      }
    });
    const RadarClass = this.staticHeight ? StaticRadar : DynamicRadar;

    const items = this.items || [];

    const {
      bufferSize,
      containerSelector,
      estimateHeight,
      renderAll,
      renderFromLast,
      shouldRecycle,
      occlusionTagName,
      idForFirstItem,
      key,
    } = this;
    const { initialRenderCount } = this.args;

    const startingIndex = calculateStartingIndex(
      items,
      idForFirstItem,
      key,
      renderFromLast,
    );

    this._radar = new RadarClass<T>(this.token, {
      bufferSize,
      containerSelector,
      estimateHeight,
      initialRenderCount,
      items,
      key,
      renderAll,
      renderFromLast,
      shouldRecycle,
      startingIndex,
      occlusionTagName,
    });

    this._scheduledActions = [];
    this._nextSendActions = null;

    const a = !!this.args.lastReached;
    const b = !!this.args.firstReached;
    const c = !!this.args.lastVisibleChanged;
    const d = !!this.args.firstVisibleChanged;
    const any = a || b || c || d;

    if (any) {
      const hasAction: Record<RadarAction, boolean> = {
        lastReached: a,
        firstReached: b,
        lastVisibleChanged: c,
        firstVisibleChanged: d,
      };

      this._radar.notify = (action, index) => {
        if (hasAction[action]) {
          this._scheduleSendAction(action, index);
        }
      };
    }

    /* Public methods to Expose to parent

      Usage:

      Template:

      <VerticalCollection @registerAPI={{this.registerAPI}} />

      Component:

      export default class extends Component {
        @action
        registerAPI(api) {
          this.collectionAPI = api;
        }

        @action
        scrollToItem(index) {
          this.collectionAPI.scrollToItem(index);
        }
      }

      Need to pass this property in the vertical-collection template
      Listen in the component actions and do your custom logic
       This API will have below methods.
        1. scrollToItem
    */

    const registerAPI = this.args.registerAPI;
    if (registerAPI) {
      /* List of methods to be exposed to public should be added here */
      const publicAPI: VerticalCollectionAPI = {
        scrollToItem: this.scrollToItem.bind(this),
      };
      registerAPI(publicAPI);
    }

    if (DEBUG) {
      this.__visualization = null;
      this._radar._debugDidUpdate = () => {
        // Update visualization
        //
        // This debugging mode can be controlled via the argument
        // `@debugVis={{true}}` at component invocation.
        //
        if (this.args.debugVis !== true) {
          if (this.__visualization !== null) {
            console.info('tearing down existing visualization');
            this.__visualization.destroy();
            this.__visualization = null;
          }
          return;
        }

        if (this.__visualization === null) {
          this.__visualization = new Visualization(this._radar);
        }

        this.__visualization.render();

        // Detect issues with CSS
        //
        // This debugging mode can be controlled via the argument
        // `@debugCSS={{true}}` at component invocation.
        //
        if (this.args.debugCSS !== true) {
          return;
        }

        const { scrollContainer, itemContainer } = this._radar;

        // check telescope
        let styles = window.getComputedStyle(
          scrollContainer instanceof HTMLElement
            ? scrollContainer
            : document.body,
        );

        assert(
          `scrollContainer cannot be inline.`,
          styleIsOneOf(styles, 'display', [
            'block',
            'inline-block',
            'flex',
            'inline-flex',
          ]),
        );
        assert(
          `scrollContainer must define position`,
          styleIsOneOf(styles, 'position', ['static', 'relative', 'absolute']),
        );
        assert(
          `scrollContainer must define height or max-height`,
          hasStyleWithNonZeroValue(styles, 'height') ||
            hasStyleWithNonZeroValue(styles, 'max-height'),
        );

        // conditional perf check for non-body scrolling
        if (scrollContainer !== ViewportContainer) {
          assert(
            `scrollContainer must define overflow-y`,
            hasStyleValue(styles, 'overflow-y', 'scroll') ||
              hasStyleValue(styles, 'overflow', 'scroll'),
          );
        }

        // check itemContainer
        styles = window.getComputedStyle(itemContainer);

        assert(
          `itemContainer cannot be inline.`,
          styleIsOneOf(styles, 'display', [
            'block',
            'inline-block',
            'flex',
            'inline-flex',
          ]),
        );
        assert(
          `itemContainer must define position`,
          styleIsOneOf(styles, 'position', ['static', 'relative', 'absolute']),
        );

        // check item defaults
        assert(
          `You must supply at least one item to the collection to debug it's CSS.`,
          this.items?.length,
        );

        const element = itemContainer.firstElementChild;

        assert('itemContainer has no element to check', element);

        styles = window.getComputedStyle(element);

        assert(
          `Item cannot be inline.`,
          styleIsOneOf(styles, 'display', [
            'block',
            'inline-block',
            'flex',
            'inline-flex',
          ]),
        );
        assert(
          `Item must define position`,
          styleIsOneOf(styles, 'position', ['static', 'relative', 'absolute']),
        );
      };
    }

    // Fastboot has no requestAnimationFrame, and no DOM for the radar to measure
    if (typeof document !== 'undefined') {
      this.schedule('sync', () => {
        this._radar.start();
      });
    }
  }

  <template>
    {{#each
      (this.virtualComponents
        this.items
        this.items.length
        this.renderAll
        this.estimateHeight
        this.bufferSize
      )
      key="id"
      as |virtualComponent|
    ~}}
      {{~unbound virtualComponent.upperBound~}}
      {{~#if virtualComponent.isOccludedContent~}}
        {{{unbound virtualComponent.element}}}
      {{~else~}}
        {{~yield virtualComponent.content virtualComponent.index~}}
      {{~/if~}}
      {{~unbound virtualComponent.lowerBound~}}
    {{~/each}}

    {{#if this.shouldYieldToInverse}}
      {{yield to="else"}}
    {{/if}}
  </template>
}

function calculateStartingIndex(
  items: readonly unknown[],
  idForFirstItem: unknown,
  key: string,
  renderFromLast: boolean,
): number {
  const totalItems = items.length;

  let startingIndex = 0;

  if (idForFirstItem !== undefined && idForFirstItem !== null) {
    for (let i = 0; i < totalItems; i++) {
      if (keyForItem(items[i], key, i) === idForFirstItem) {
        startingIndex = i;
        break;
      }
    }
  } else if (renderFromLast === true) {
    // If no id was set and `renderFromLast` is true, start from the bottom
    startingIndex = totalItems - 1;
  }

  return startingIndex;
}

export default VerticalCollection;
