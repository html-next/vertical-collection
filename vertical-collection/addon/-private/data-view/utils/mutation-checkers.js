import { get } from '@ember/object';
import objectAt from './object-at';
import keyForItem from '../../ember-internals/key-for-item';

export function isPrepend(lenDiff, newItems, key, oldFirstKey, oldLastKey) {
  const newItemsLength = get(newItems, 'length');

  if (lenDiff <= 0 || lenDiff >= newItemsLength || newItemsLength === 0) {
    return false;
  }

  const newFirstKey = keyForItem(objectAt(newItems, lenDiff), key, lenDiff);
  const newLastKey = keyForItem(objectAt(newItems, newItemsLength - 1), key, newItemsLength - 1);

  return oldFirstKey === newFirstKey && oldLastKey === newLastKey;
}

export function isAppend(lenDiff, newItems, key, oldFirstKey, oldLastKey) {
  const newItemsLength = get(newItems, 'length');

  if (lenDiff <= 0 || lenDiff >= newItemsLength || newItemsLength === 0) {
    return false;
  }

  const newFirstKey = keyForItem(objectAt(newItems, 0), key, 0);
  const newLastKey = keyForItem(objectAt(newItems, newItemsLength - lenDiff - 1), key, newItemsLength - lenDiff - 1);

  return oldFirstKey === newFirstKey && oldLastKey === newLastKey;
}
