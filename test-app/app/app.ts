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
}

loadInitializers(App, config.modulePrefix, compatModules);
