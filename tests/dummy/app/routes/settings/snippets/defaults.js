export default
/* !- BEGIN-SNIPPET vertical-collection-defaults-example */
{
// basics
  tagName: 'vertical-collection',

// required

  // Positional parameter, e.g.
  //
  // `{{#vertical-collection items as |item|}}`
  //
  // Note: An alias for this property named `content`
  // exists solely for Ember 1.11 support. The alias
  // should not be used with any more recent version
  // of Ember and will be removed in future versions.
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
  bufferSize: 0,

// actions

  // Each action has the signature (item, index) => {}
  firstReached: null,
  lastReached: null,
  firstVisibleChanged: null,
  lastVisibleChanged: null,

// initial state

  // Id for the first item to be rendered. Will be the
  // top item by default, and the bottom item if
  // `renderFromLast` is set.
  idForFirstItem: null,

  // Tells the collection to render from the last item.
  renderFromLast: false,

// scroll setup

  // Selector for the scrollContainer. Defaults to "body"
  // to select the immediate parent element of the collection
  // use "*" or a mroe specific selector if available.
  containerSelector: "body"
}
/* !- END-SNIPPET vertical-collection-defaults-example */
;
