import keyForItem from '../ember/utils/key-for-item';

export default class LazyKeyList {
  constructor(items, key) {
    this.items = items;
    this.key = key;
    this.keys = new Array(items.length);
  }

  get length() {
    return this.items.length;
  }

  get(index) {
    let key = this.keys[index];

    if (!key) {
      key = keyForItem(this.items[index]);
      this.keys[index] = key;
    }

    return key;
  }

  hasKeyFor(index) {
    return !!this.keys[index];
  }

  canPrepend(newItems) {
    const lenDiff = newItems.length - this.length;

    if (lenDiff <= 0) {
      return false;
    }

    const firstKey = this.get(0);
    const lastKey = this.get(this.length - 1);
    const newFirstKey = keyForItem(newItems[lenDiff]);
    const newLastKey = keyForItem(newItems[newItems.length - 1]);

    return firstKey === newFirstKey && lastKey === newLastKey;
  }

  canAppend(newItems) {
    const lenDiff = newItems.length - this.length;

    if (lenDiff <= 0) {
      return false;
    }

    const firstKey = this.get(0);
    const lastKey = this.get(this.length - 1);
    const newFirstKey = keyForItem(newItems[0]);
    const newLastKey = keyForItem(newItems[newItems.length - lenDiff - 1]);

    return firstKey === newFirstKey && lastKey === newLastKey;
  }

  prepend(newItems) {
    const { keys } = this;
    const lenDiff = newItems.length - this.length;

    for (let i = 0; i < lenDiff; i++) {
      keys.unshift(undefined);
    }

    this.items = newItems;
  }

  append(newItems) {
    const { keys } = this;
    const lenDiff = newItems.length - this.length;

    keys.length = this.items.length + lenDiff;

    this.items = newItems;
  }
}
