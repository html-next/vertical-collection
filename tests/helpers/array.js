import EmberArray, { A } from '@ember/array';
import { run } from '@ember/runloop';
import wait from 'ember-test-helpers/wait';

export function prepend(context, itemsToPrepend) {
  const items = context.get('items');

  if (items.unshiftObjects) {
    items.unshiftObjects(itemsToPrepend);
  } else {
    context.set('items', itemsToPrepend.concat(items));
  }

  return wait();
}

export function append(context, itemsToAppend) {
  const items = context.get('items');

  if (items.pushObjects) {
    items.pushObjects(itemsToAppend);
  } else {
    context.set('items', items.concat(itemsToAppend));
  }

  return wait();
}

export function emptyArray(context) {
  const items = context.get('items');

  run(() => {
    if (items.clear) {
      items.clear();
    } else {
      context.set('items', []);
    }
  });

  return wait();
}

export function replaceArray(context, items) {
  const oldItems = context.get('items');

  if (EmberArray.detect(oldItems)) {
    context.set('items', A(items));
  } else {
    context.set('items', items);
  }

  return wait();
}

export function move(context, sourceItemIdx, destItemIdx) {
  const items = context.get('items');
  let destItem, sourceItem;

  if (items.objectAt && items.removeObject && items.insertAt) {
    // Ember Array
    destItem = items.objectAt(destItemIdx);
    sourceItem = items.objectAt(sourceItemIdx);
    items.removeObject(sourceItem);
    destItemIdx = items.indexOf(destItem) + 1;
    items.insertAt(destItemIdx, sourceItem);
  } else {
    // native array
    destItem = items[destItemIdx];
    sourceItem = items[sourceItemIdx];
    items.splice(sourceItemIdx, 1);
    destItemIdx = items.indexOf(destItem) + 1;
    items.splice(destItemIdx, 0, sourceItem);
    // if we are not using Ember Arrays we need to set `items` to a new array
    // instance to trigger a recompute on `virtualComponents`
    context.set('items', [].concat(items));
  }

  return wait();
}
