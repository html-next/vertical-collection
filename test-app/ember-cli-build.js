'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

const { compatBuild } = require('@embroider/compat');

module.exports = async function (defaults) {
  const { buildOnce } = await import('@embroider/vite');

  const { setConfig } = await import('@warp-drive/core/build-config');

  // Provide empty project object if defaults is undefined to prevent
  // EmberApp from trying to access defaults.project properties
  let app = new EmberApp(defaults || { project: {} }, {});

  setConfig(app, __dirname, {
    // this should be the most recent <major>.<minor> version for
    // which all deprecations have been fully resolved
    // and should be updated when that changes
    deprecations: {
      DEPRECATE_STORE_EXTENDS_EMBER_OBJECT: true,
    },
  });

  return compatBuild(app, buildOnce);
};
