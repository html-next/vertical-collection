import keyForItem, {
  type KeyPath,
} from '../../ember-internals/key-for-item.ts';

export function isPrepend(
  lenDiff: number,
  newItems: readonly unknown[],
  key: KeyPath,
  oldFirstKey: unknown,
  oldLastKey: unknown,
): boolean {
  const newItemsLength = newItems.length;

  if (lenDiff <= 0 || lenDiff >= newItemsLength || newItemsLength === 0) {
    return false;
  }

  const newFirstKey = keyForItem(newItems[lenDiff], key, lenDiff);
  const newLastKey = keyForItem(
    newItems[newItemsLength - 1],
    key,
    newItemsLength - 1,
  );

  return oldFirstKey === newFirstKey && oldLastKey === newLastKey;
}

export function isAppend(
  lenDiff: number,
  newItems: readonly unknown[],
  key: KeyPath,
  oldFirstKey: unknown,
  oldLastKey: unknown,
): boolean {
  const newItemsLength = newItems.length;

  if (lenDiff <= 0 || lenDiff >= newItemsLength || newItemsLength === 0) {
    return false;
  }

  const newFirstKey = keyForItem(newItems[0], key, 0);
  const newLastKey = keyForItem(
    newItems[newItemsLength - lenDiff - 1],
    key,
    newItemsLength - lenDiff - 1,
  );

  return oldFirstKey === newFirstKey && oldLastKey === newLastKey;
}
