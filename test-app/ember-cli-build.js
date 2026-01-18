'use strict';

const EmberApp = require('ember-cli/lib/broccoli/ember-app');

const { compatBuild } = require('@embroider/compat');

module.exports = async function (defaults) {
  const { buildOnce } = await import('@embroider/vite');

  const { setConfig } = await import('@warp-drive/core/build-config');

  let app = new EmberApp(defaults, {});

  // The v1 dummy app imported Bootstrap (and glyphicons fonts) to support
  // the demo templates' grid/table styling.
  let bootstrapPath = 'node_modules/bootstrap/dist/';
  app.import(`${bootstrapPath}css/bootstrap.css`);
  app.import(`${bootstrapPath}fonts/glyphicons-halflings-regular.eot`, {
    destDir: 'fonts',
  });
  app.import(`${bootstrapPath}fonts/glyphicons-halflings-regular.svg`, {
    destDir: 'fonts',
  });
  app.import(`${bootstrapPath}fonts/glyphicons-halflings-regular.ttf`, {
    destDir: 'fonts',
  });
  app.import(`${bootstrapPath}fonts/glyphicons-halflings-regular.woff`, {
    destDir: 'fonts',
  });
  app.import(`${bootstrapPath}fonts/glyphicons-halflings-regular.woff2`, {
    destDir: 'fonts',
  });

  setConfig(app, __dirname, {
    // this should be the most recent <major>.<minor> version for
    // which all deprecations have been fully resolved
    // and should be updated when that changes
    deprecations: {
      DEPRECATE_STORE_EXTENDS_EMBER_OBJECT: false,
    },
  });

  return compatBuild(app, buildOnce);
};
