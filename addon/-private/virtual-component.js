import Token from 'vertical-collection/-private/scheduler/token';
import { assert } from 'vertical-collection/-debug/helpers';
import Ember from 'ember';

const { set } = Ember;

const doc = document;
let VC_IDENTITY = 0;

export default class VirtualComponent {
  constructor(parentToken) {
    this._tenureId = VC_IDENTITY++;
    this.init(parentToken);
  }

  init(parentToken) {
    this.id = VC_IDENTITY++;
    this._upperBound = doc.createTextNode('');
    this._lowerBound = doc.createTextNode('');
    this.height = 0;
    this.range = doc.createRange();
    this.content = null;
    this.token = new Token(parentToken);
  }

  get upperBound() {
    return this._upperBound;
  }

  get lowerBound() {
    return this._lowerBound;
  }

  get hasClone() {
    return this.cloneUpperBound && this.cloneUpperBound.parentNode !== null;
  }

  updateDimensions() {
    this.range.setStart(this.upperBound, 0);
    this.range.setEnd(this.lowerBound, 0);

    const { height, width } = this.range.getBoundingClientRect();

    this.range.detach();

    this.height = height;
    this.width = width;
  }

  extractContents() {
    this.range.setStart(this.upperBound, 0);
    this.range.setEnd(this.lowerBound, 0);

    const domFragment = this.range.extractContents();

    this.range.detach();

    this._upperBound = domFragment.firstChild;
    this._lowerBound = domFragment.lastChild;

    return domFragment;
  }

  static create(parentToken) {
    return new VirtualComponent(parentToken);
  }

  destroy() {
    this.token.cancel();
    this.range.detach();
    this.range = null;

    this._upperBound = null;
    this._lowerBound = null;

    set(this, 'content', null);
  }
}
