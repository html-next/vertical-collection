'use strict';

const Funnel = require('broccoli-funnel');
const VersionChecker = require('ember-cli-version-checker');

function isProductionEnv() {
  const isProd = /production/.test(process.env.EMBER_ENV);
  const isTest = process.env.EMBER_CLI_TEST_COMMAND;

  return isProd && !isTest;
}

module.exports = {
  name: require('./package').name,

  init() {
    this._super.init && this._super.init.apply(this, arguments);

    this.options = this.options || {};
  },

  included(app) {
    this._super.included.apply(this, arguments);
    this.checker = new VersionChecker(app);

    while (typeof app.import !== 'function' && app.app) {
      app = app.app;
    }

    if (typeof app.import !== 'function') {
      throw new Error('vertical-collection is being used within another addon or engine '
        + 'and is having trouble registering itself to the parent application.');
    }

    this._env = app.env;

    if (!/production/.test(app.env) && !/test/.test(app.env)) {
      findImporter(this).import('vendor/debug.css');
    }
  },

  treeForApp() {
    const tree = this._super.treeForApp.apply(this, arguments);

    const exclude = [];

    if (isProductionEnv()) {
      exclude.push('initializers/debug.js');
    }

    if (this.checker.forEmber().isAbove('1.13.0')) {
      exclude.push('initializers/vertical-collection-legacy-compat.js');
    }

    return new Funnel(tree, { exclude });
  }
};

function findImporter(addon) {
  if (typeof addon.import === 'function') {
    // If addon.import() is present (CLI 2.7+) use that
    return addon;
  } else {
    // Otherwise, reuse the _findHost implementation that would power addon.import()
    let current = addon;
    let app;
    do {
      app = current.app || app;
    } while (current.parent.parent && (current = current.parent));
    return app;
  }
}
