import Route from '@ember/routing/route';
import { action } from '@ember/object';
import { later, next, cancel } from '@ember/runloop';
import getData from 'dummy/lib/get-data';
import { tracked } from '@glimmer/tracking';

class ModelData {
  @tracked data;
}

export default class extends Route {
  numRows=100;
  _nextLoad=null;

  model() {
    let model = new ModelData();
    model.data = getData(this.numRows);
    return model;
  }

  afterModel() {
    later(this, this.loadSamples, 100);
  }

  loadSamples() {
    this.currentModel.data = getData(this.numRows);
    this._nextLoad = next(this, this.loadSamples);
  }

  @action
  addRow() {
    this.numRows++;
  }

  @action
  removeRow() {
    this.numRows--;
  }

  @action
  willTransition() {
    cancel(this._nextLoad);
    this.currentModel.data = null;
  }
}
