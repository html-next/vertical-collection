import Route from '@ember/routing/route';
import { later, next, cancel } from '@ember/runloop';
import getData from 'dummy/lib/get-data';

export default Route.extend({
  numRows: 100,
  _nextLoad: null,

  model() {
    return getData(this.numRows);
  },

  afterModel() {
    later(this, this.loadSamples, 100);
  },

  loadSamples() {
    this.controller.set('model', getData(this.numRows));
    this._nextLoad = next(this, this.loadSamples);
  },

  actions: {

    addRow() {
      this.numRows++;
    },

    removeRow() {
      this.numRows--;
    },

    willTransition() {
      cancel(this._nextLoad);
      this.controller.set('model', null);
    }

  }

});
