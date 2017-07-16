import Ember from 'ember';
import waitForRender from './wait-for-render';

const {
  A,
  run
} = Ember;

export function prepend(context, itemsToPrepend) {
  const items = context.get('items');

  if (items.unshiftObjects) {
    items.unshiftObjects(itemsToPrepend);
  } else {
    context.set('items', itemsToPrepend.concat(items));
  }

  return waitForRender();
}

export function append(context, itemsToAppend) {
  const items = context.get('items');

  if (items.pushObjects) {
    items.pushObjects(itemsToAppend);
  } else {
    context.set('items', items.concat(itemsToAppend));
  }

  return waitForRender();
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

  return waitForRender();
}

export function replaceArray(context, items) {
  const oldItems = context.get('items');

  if (Ember.Array.detect(oldItems)) {
    context.set('items', A(items));
  } else {
    context.set('items', items);
  }

  return waitForRender();
}
