import '@warp-drive/ember/install';

import Application from '@ember/application';
import compatModules from '@embroider/virtual/compat-modules';
import Resolver from 'ember-resolver';
import loadInitializers from 'ember-load-initializers';
import config from 'test-app/config/environment';
import {
  importSync,
  dependencySatisfies,
  isDevelopingApp,
  macroCondition,
} from '@embroider/macros';

let setupInspector: (x: unknown) => unknown;

if (macroCondition(dependencySatisfies('ember-source', '^3.28'))) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const module = importSync(
    '@embroider/legacy-inspector-support/ember-source-3.28'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  setupInspector = module.default;
} else {
  // There is also one for 4.8
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const module = importSync(
    '@embroider/legacy-inspector-support/ember-source-4.12'
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  setupInspector = module.default;
}

if (macroCondition(isDevelopingApp())) {
  importSync('./deprecation-workflow');
}

export default class App extends Application {
  modulePrefix = config.modulePrefix;
  podModulePrefix = config.podModulePrefix;
  Resolver = Resolver.withModules(compatModules);
  inspector = setupInspector(this);
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
