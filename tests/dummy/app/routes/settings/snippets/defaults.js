export default
/* !- BEGIN-SNIPPET vertical-collection-defaults-example */
{
// basics
  tagName: 'vertical-collection',

// required
  items: null,
  minHeight: 75, // Integer: attempts to work with em, rem, px

// performance
  key: '@identity',
  alwaysRemeasure: false,
  bufferSize: 1,

// actions
  firstReached: null,
  lastReached: null,
  firstVisibleChanged: null,
  lastVisibleChanged: null,

// initial state
  scrollPosition: 0,
  idForFirstItem: null,
  renderFromLast: false,
  // renderAllInitially: false,

// scroll setup
  containerSelector: null
  // containerHeight: null
}
/* !- END-SNIPPET vertical-collection-defaults-example */
;
