export function prepend(context, itemsToPrepend) {
  const items = context.get('items');

  if (items.unshiftObjects) {
    items.unshiftObjects(itemsToPrepend);
  } else {
    context.set('items', itemsToPrepend.concat(items));
  }
}

export function append(context, itemsToAppend) {
  const items = context.get('items');

  if (items.pushObjects) {
    items.pushObjects(itemsToAppend);
  } else {
    context.set('items', items.concat(itemsToAppend));
  }
}

export function emptyArray(context) {
  const items = context.get('items');

  if (items.clear) {
    items.clear();
  } else {
    context.set('items', []);
  }
}
