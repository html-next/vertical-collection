export function containerHeight(itemContainer) {
  return itemContainer.outerHeight();
}

export function paddingBefore(itemContainer) {
  return itemContainer.find('occluded-content:first').outerHeight();
}

export function paddingAfter(itemContainer) {
  return itemContainer.find('occluded-content:last').outerHeight();
}
