const VENDOR_MATCH_FNS = ['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'];
let ELEMENT_MATCH_FN;

function setElementMatchFn(el) {
  VENDOR_MATCH_FNS.forEach((fn) => {
    if ((ELEMENT_MATCH_FN === undefined) && (typeof el[fn] === 'function')) {
      ELEMENT_MATCH_FN = fn;
    }
  });
}

export default function closest(el, selector) {
  if (ELEMENT_MATCH_FN === undefined) {
    setElementMatchFn(el);
  }
  while (el) {
    // TODO add explicit test
    if (el[ELEMENT_MATCH_FN](selector)) {
      return el;
    }
    el = el.parentElement;
  }

  return null;
}
