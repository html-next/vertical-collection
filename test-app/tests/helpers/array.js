import EmberArray, { A } from '@ember/array';
import { run } from '@ember/runloop';
import { settled } from '@ember/test-helpers';

export function prepend(context, itemsToPrepend) {
  const items = context.items;

  run(() => {
    if (items.unshiftObjects) {
      // Ember Array / ArrayProxy
      items.unshiftObjects(itemsToPrepend);
    } else {
      // Standard arrays
      context.set('items', itemsToPrepend.concat(items));
    }
  });

  return settled();
}

export function append(context, itemsToAppend) {
  const items = context.items;

  run(() => {
    if (items.pushObjects) {
      // Ember Array / ArrayProxy
      items.pushObjects(itemsToAppend);
    } else {
      // Standard arrays
      context.set('items', items.concat(itemsToAppend));
    }
  });

  return settled();
}

export function emptyArray(context) {
  const items = context.items;

  run(() => {
    if (items.clear) {
      items.clear();
    } else {
      context.set('items', []);
    }
  });

  return settled();
}

export function replaceArray(context, items) {
  const oldItems = context.items;

  run(() => {
    if (EmberArray.detect(oldItems)) {
      context.set('items', A(items));
    } else {
      context.set('items', items);
    }
  });

  return settled();
}

export function move(context, sourceItemIdx, destItemIdx) {
  const items = context.items;
  let destItem, sourceItem;

  run(() => {
    if (items.objectAt && items.removeObject && items.insertAt) {
      // Ember Array / ArrayProxy
      destItem = items.objectAt(destItemIdx);
      sourceItem = items.objectAt(sourceItemIdx);
      items.removeObject(sourceItem);
      destItemIdx = items.indexOf(destItem) + 1;
      items.insertAt(destItemIdx, sourceItem);
    } else {
      // Standard arrays
      const next = items.slice();
      destItem = next[destItemIdx];
      sourceItem = next[sourceItemIdx];
      next.splice(sourceItemIdx, 1);
      destItemIdx = next.indexOf(destItem) + 1;
      next.splice(destItemIdx, 0, sourceItem);
      context.set('items', next);
    }
  });

  return settled();
}
