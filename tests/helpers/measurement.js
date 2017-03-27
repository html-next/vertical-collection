export function containerHeight(itemContainer) {
  return itemContainer.outerHeight()
    + parseInt(itemContainer.css('margin-top') || 0)
    + parseInt(itemContainer.css('margin-bottom') || 0);
}

export function paddingBefore(itemContainer) {
  return itemContainer.css('margin-top');
}

export function paddingAfter(itemContainer) {
  return itemContainer.css('margin-bottom');
}
