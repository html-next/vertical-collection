export default /* ! BEGIN-SNIPPET vertical-collection-defaults-example */
{
  // required

  // The items to render, e.g.
  //
  // `<VerticalCollection @items={{items}} as |item|>`
  items: null,

  // Can be an integer, but also attempts to work
  // with em, rem, px, and percentage values for things
  // like flex.
  estimateHeight: null,

  // performance

  // This key is the property used by the collection
  // to determine whether an array mutation is an
  // append, prepend, or complete replacement. It is
  // also the key that is passed to the actions, and
  // can be used to restore scroll position with
  // `idForFirstItem`.
  //
  // Note: `@identity` is a randomly generated value.
  // If you want to save the id, use a unique property
  // on your model (e.g. the `id` field on Ember Data
  // models)
  key: '@identity',

  // Determines the rendering strategy. If set to true,
  // will use a simpler strategy that is much faster,
  // but requires all item heights to be the same.
  staticHeight: false,

  // The size of the buffer before and after the
  // collection. Represents a static number of components
  // that will be added, such that:
  //
  // numComponents === Math.ceil(containerHeight / estimateHeight) + (bufferSize * 2) + 1
  bufferSize: 1,

  // Determines whether the rendered block of an item that
  // scrolls out of range is reused for the item that
  // scrolls in. Reuse does less work, but the block must derive
  // everything it renders from the yielded item and index.
  // A reused block keeps all other state, which then
  // belongs to the item rendered there before and shows as
  // stale content. Set to false when the block cannot be
  // fully derived.
  shouldRecycle: true,

  // Renders all items instead of only the visible ones.
  // This gives up the performance benefit, but screen
  // readers, server rendering and find in page see every
  // item.
  renderAll: false,

  // actions

  // Each action has the signature (item, index, key) => {}
  firstReached: null,
  lastReached: null,
  firstVisibleChanged: null,
  lastVisibleChanged: null,

  // Called with an object that has `scrollToItem(index)`,
  // and with null when the collection is destroyed.
  registerAPI: null,

  // initial state

  // Id for the first item to be rendered. Will be the
  // top item by default, and the bottom item if
  // `renderFromLast` is set.
  idForFirstItem: null,

  // Tells the collection to render from the last item.
  renderFromLast: false,

  // The number of items in the first render, before the
  // collection starts to measure.
  initialRenderCount: undefined,

  // scroll setup

  // Selector for the scrollContainer. The collection
  // will traverse its ancestry to find the first element
  // that matches the selector. Defaults to '*', which
  // will match the immediate parent of the collection.
  containerSelector: '*',

  // markup

  // The tag name of the elements before and after the
  // rendered items, e.g. `tr` inside a table.
  occlusionTagName: 'occluded-content',

  // debugging

  // Development builds only. Shows a debug visualization.
  debugVis: false,

  // Development builds only, and needs `debugVis`. Fails an
  // assertion if the CSS of the container or items cannot work.
  debugCSS: false,
};
/* ! END-SNIPPET vertical-collection-defaults-example */
