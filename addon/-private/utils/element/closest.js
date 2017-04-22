const VENDOR_MATCH_FNS = ['matches', 'webkitMatchesSelector', 'mozMatchesSelector', 'msMatchesSelector', 'oMatchesSelector'];
let ELEMENT_MATCH_FN;

let notFastBoot = () => {
  return typeof FastBoot === 'undefined' ? true : false;
};
let closest = () => {
  return null;
};

if (notFastBoot()) {
  VENDOR_MATCH_FNS.some((fn) => {
    if (typeof document.body[fn] === 'function') {
      ELEMENT_MATCH_FN = fn;
      return true;
    }
    return false;
  });

  closest = (el, selector) => {
    while (el) {
      if (el[ELEMENT_MATCH_FN](selector)) {
        return el;
      }
      el = el.parentElement;
    }

    return null;
  }
}

export default closest;
