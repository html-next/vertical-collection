'use strict';

const VersionChecker = require('ember-cli-version-checker');

module.exports = {
  name: require('./package').name,

  getOutputDirForVersion() {
    return '';
  },

  // Borrowed from ember-cli-babel
  _emberVersionRequiresModulesAPIPolyfill() {
    let checker = this.checker.for('ember-source', 'npm');

    if (!checker.exists()) {
      return true;
    }

    return checker.lt('3.27.0-alpha.1');
  },

  included(app) {
    this._super.included.apply(this, arguments);
    this.checker = new VersionChecker(app);

    while (typeof app.import !== 'function' && app.app) {
      app = app.app;
    }

    if (typeof app.import !== 'function') {
      throw new Error(
        'vertical-collection is being used within another addon or engine ' +
          'and is having trouble registering itself to the parent application.',
      );
    }

    if (!/production/.test(app.env) && !/test/.test(app.env)) {
      this.import('vendor/debug.css');
    }
  },
};
