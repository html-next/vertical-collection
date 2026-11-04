import { TrackedArray } from 'tracked-built-ins';
import { settled } from '@ember/test-helpers';

/*
 * The TrackedArray scenarios change the array in place; the others replace it.
 */

export function prepend(context, itemsToPrepend) {
  if (context.mutateInPlace) {
    context.items.unshift(...itemsToPrepend);
  } else {
    context.set('items', itemsToPrepend.concat(context.items));
  }

  return settled();
}

export function append(context, itemsToAppend) {
  if (context.mutateInPlace) {
    context.items.push(...itemsToAppend);
  } else {
    context.set('items', context.items.concat(itemsToAppend));
  }

  return settled();
}

export function emptyArray(context) {
  if (context.mutateInPlace) {
    context.items.splice(0);
  } else {
    context.set('items', []);
  }

  return settled();
}

export function replaceArray(context, items) {
  context.set('items', context.mutateInPlace ? new TrackedArray(items) : items);

  return settled();
}

export function move(context, sourceItemIdx, destItemIdx) {
  const next = context.mutateInPlace ? context.items : context.items.slice();
  const destItem = next[destItemIdx];
  const [sourceItem] = next.splice(sourceItemIdx, 1);
  next.splice(next.indexOf(destItem) + 1, 0, sourceItem);

  if (!context.mutateInPlace) {
    context.set('items', next);
  }

  return settled();
}
