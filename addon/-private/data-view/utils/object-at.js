import { assert } from '@ember/debug';

export default function objectAt(arr, index) {
  assert('arr must be an instance of a Javascript Array or implement `objectAt`', Array.isArray(arr) || typeof arr.objectAt === 'function');

  return arr.objectAt ? arr.objectAt(index) : arr[index];
}
