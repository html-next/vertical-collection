export function containerHeight(itemContainer) {
  return itemContainer.getBoundingClientRect().height;
}

export function paddingBefore(itemContainer) {
  return itemContainer.firstElementChild.getBoundingClientRect().height;
}

export function paddingAfter(itemContainer) {
  return itemContainer.lastElementChild.getBoundingClientRect().height;
}
