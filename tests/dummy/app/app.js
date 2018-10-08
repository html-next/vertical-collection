/* eslint-disable ember/avoid-leaking-state-in-ember-objects */
import Application from '@ember/application';
import Resolver from './resolver';
import loadInitializers from 'ember-load-initializers';
import config from './config/environment';

const App = Application.extend({
  modulePrefix: config.modulePrefix,
  podModulePrefix: config.podModulePrefix,
  Resolver,
  customEvents: {
    touchstart: null,
    touchmove: null,
    touchend: null,
    touchcancel: null,
    keydown: null,
    keyup: null,
    keypress: null,
    mousedown: null,
    mouseup: null,
    contextmenu: null,
    dblclick: null,
    mousemove: null,
    focusin: null,
    focusout: null,
    mouseenter: null,
    mouseleave: null,
    submit: null,
    change: null,
    dragstart: null,
    drag: null,
    dragenter: null,
    dragleave: null,
    dragover: null,
    drop: null,
    dragend: null
  }
});

loadInitializers(App, config.modulePrefix);

export default App;
