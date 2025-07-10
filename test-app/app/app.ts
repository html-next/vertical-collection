import Application from '@ember/application';
import compatModules from '@embroider/virtual/compat-modules';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import config from 'test-app/config/environment';
import { importSync, isDevelopingApp, macroCondition } from '@embroider/macros';

if (macroCondition(isDevelopingApp())) {
  importSync('./deprecation-workflow');
}

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver.withModules(compatModules);
  customEvents = {
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
    dragend: null,
  };
}

loadInitializers(App, config.modulePrefix, compatModules);
