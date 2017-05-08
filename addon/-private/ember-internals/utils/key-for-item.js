/* global String */
import Ember from 'ember';
import identity from './identity';

const {
  get
} = Ember;

export default function keyForItem(item, keyPath, index) {
  let key;

  switch (keyPath) {
    case '@index':
      // allow 0 index
      if (!index && index !== 0) {
        throw new Error('No index was supplied to keyForItem');
      }
      key = index;
      break;
    case '@identity':
      key = identity(item);
      break;
    default:
      // TODO add explicit test
      if (keyPath) {
        key = get(item, keyPath);
      } else {
        key = identity(item);
      }
  }

  if (typeof key === 'number') {
    key = String(key);
  }

  return key;
}
