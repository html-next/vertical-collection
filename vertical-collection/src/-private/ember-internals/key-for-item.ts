import { assert } from '@ember/debug';

import identity from './identity.ts';

/**
 * `@index`, `@identity`, or a path into the item such as `id` or `owner.id`.
 */
export type KeyPath = string;

export default function keyForItem(
  item: unknown,
  keyPath: KeyPath,
  index?: number,
): unknown {
  let key: unknown;

  assert(
    `keyPath must be a string, received: ${keyPath}`,
    typeof keyPath === 'string',
  );

  switch (keyPath) {
    case '@index':
      assert(
        `A numerical index must be supplied for keyForItem when keyPath is @index, received: ${index}`,
        typeof index === 'number',
      );
      key = index;
      break;
    case '@identity':
      key = identity(item);
      break;
    default:
      key = keyPath
        .split('.')
        .reduce<unknown>(
          (value, part) =>
            value === null || value === undefined
              ? undefined
              : Reflect.get(Object(value), part),
          item,
        );
  }

  if (typeof key === 'number') {
    key = String(key);
  }

  return key;
}
