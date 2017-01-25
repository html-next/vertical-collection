import Ember from 'ember';

const { get } = Ember;

export default function getArray(arr) {
  if (!arr) {
    return arr;
  }

  let content = get(arr, 'content');

  return content || arr;
}
