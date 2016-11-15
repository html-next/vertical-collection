import scheduler from 'vertical-collection/-private/scheduler';
import Token from 'vertical-collection/-private/scheduler/token';
import Proxy from 'vertical-collection/-private/data-view/proxy';
import { debugOnError, assert } from 'vertical-collection/-debug/helpers';
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
    this.position = 0;
    this._upperBound = doc.createTextNode('');
    this._lowerBound = doc.createTextNode('');
    this.range = doc.createRange();
    this.content = null;
    this._ref = null;
    this.token = new Token(parentToken);
    this._nextMeasure = null;
    this._dirtied = true;
  }

  set ref(newRef) {
    assert(`VirtualComponent.ref cannot be empty`, newRef);
    assert(`VirtualComponent.ref must be an instance of a Proxy`, newRef instanceof Proxy);

    if (this._ref !== null) {
      if (this._ref.geography.element === this) {
        this._ref.geography.element = null;
      }
    }
    this._ref = newRef;
    this._ref.geography.element = this;
  }

  get upperBound() {
    return this._upperBound;
  }

  get lowerBound() {
    return this._lowerBound;
  }

  get ref() {
    return this._ref;
  }

  schedule(queueName, job) {
    return scheduler.schedule(queueName, job, this.token);
  }

  updateBounds() {
    const { range } = this;

    range.setStart(this.upperBound, 0);
    range.setEnd(this.lowerBound, 0);
  }

  didRender() {
    if (this._nextMeasure === null) {
      this._nextMeasure = this.schedule('measure', () => {
        this._ref.geography.setState();
        this._nextMeasure = null;
      });
    }
  }

  getBoundingClientRect() {
    assert(`VirtualComponent.getBoundingClientRect cannot fetch bounds when not inserted`, this.upperBound.parentNode);
    this.updateBounds();

    return this.range.getBoundingClientRect();
  }

  static create(parentToken) {
    return new VirtualComponent(parentToken);
  }

  destroy() {
    if (this._ref && this._ref.geography.element === this) {
      this._ref.geography.element = null;
    }
    this.token.cancel();
    this._nextMeasure = null;
    this.range.detach();
    this.range = null;
    this._ref = null;

    this._upperBound = null;
    this._lowerBound = null;

    set(this, 'content', null);
  }
}
