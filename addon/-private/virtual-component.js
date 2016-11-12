import scheduler from 'vertical-collection/-private/scheduler';
import Token from 'vertical-collection/-private/scheduler/token';
import Proxy from 'vertical-collection/-private/data-view/proxy';
import { debugOnError, assert } from 'vertical-collection/-debug/helpers';

const doc = document;
let VC_IDENTITY = 0;

export default class VirtualComponent {
  constructor(parentToken) {
    this.id = VC_IDENTITY++;
    this.position = 0;
    this.upperBound = doc.createTextNode('');
    this.lowerBound = doc.createTextNode('');
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
      this.schedule('measure', () => {
        this.updateBounds();
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
}
