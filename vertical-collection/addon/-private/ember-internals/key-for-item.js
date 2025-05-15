import { get } from '@ember/object';
import { assert } from '@ember/debug';

import identity from './identity';

export default function keyForItem(item, keyPath, index) {
  let key;

  assert(`keyPath must be a string, received: ${keyPath}`, typeof keyPath === 'string');

  switch (keyPath) {
    case '@index':
      assert(`A numerical index must be supplied for keyForItem when keyPath is @index, received: ${index}`, typeof index === 'number');
      key = index;
      break;
    case '@identity':
      key = identity(item);
      break;
    default:
      key = get(item, keyPath);
  }

  if (typeof key === 'number') {
    key = String(key);
  }

  return key;
}
