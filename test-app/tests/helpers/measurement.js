export function containerHeight(itemContainer) {
  return itemContainer.offsetHeight;
}

export function paddingBefore(itemContainer) {
  return itemContainer.firstElementChild.offsetHeight;
}

export function paddingAfter(itemContainer) {
  return itemContainer.lastElementChild.offsetHeight;
}
