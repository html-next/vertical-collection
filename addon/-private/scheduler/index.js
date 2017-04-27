import Ember from 'ember';
import Token from './token';

const {
  run
} = Ember;

function job(cb, token) {
  return function execJob() {
    if (token.cancelled === false) {
      cb();
    }
  };
}

export class Scheduler {
  constructor() {
    this.sync = [];
    this.layout = [];
    this.measure = [];
    this.affect = [];
    this.jobs = 0;
    this._nextFlush = null;
    this.ticks = 0;
  }

  schedule(queueName, cb, parent) {
    this.jobs++;
    let token = new Token(parent);

    this[queueName].push(job(cb, token));
    this._flush();

    return token;
  }

  forget(token) {
    if (token) {
      token.cancel();
    }
  }

  _flush() {
    if (this._nextFlush !== null) {
      return;
    }

    this._nextFlush = requestAnimationFrame(() => {
      this.flush();
    });
  }

  flush() {
    let i, q;
    let hasDomWork = this.sync.length > 0 || this.layout.length > 0;
    this.jobs = 0;

    if (hasDomWork) {
      run.begin();
      if (this.sync.length > 0) {
        q = this.sync;
        this.sync = [];

        for (i = 0; i < q.length; i++) {
          q[i]();
        }
      }

      if (this.layout.length > 0) {
        q = this.layout;
        this.layout = [];

        for (i = 0; i < q.length; i++) {
          q[i]();
        }
      }
      run.end();
    }

    if (this.measure.length > 0) {
      q = this.measure;
      this.measure = [];

      for (i = 0; i < q.length; i++) {
        q[i]();
      }
    }

    if (this.affect.length > 0) {
      run.begin();
      q = this.affect;
      this.affect = [];

      for (i = 0; i < q.length; i++) {
        q[i]();
      }
      run.end();
    }

    this._nextFlush = null;
    if (this.jobs > 0) {
      this._flush();
    }
  }
}

export default new Scheduler();
