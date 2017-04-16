import Ember from 'ember';
import { assert } from 'vertical-collection/-debug/helpers';

const { Array: EmberArray } = Ember;

export default function objectAt(arr, index) {
  assert('arr must be an instance of an Ember Array or Javascript Array', EmberArray.detect(arr) || Array.isArray(arr));

  return arr.objectAt ? arr.objectAt(index) : arr[index];
}
