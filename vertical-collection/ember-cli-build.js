'use strict';

const EmberAddon = require('ember-cli/lib/broccoli/ember-addon');

module.exports = function (defaults) {
  const app = new EmberAddon(defaults, {
    // Add options here
    emberData: {
      deprecations: {
        // New projects can safely leave this deprecation disabled.
        // If upgrading, to opt-into the deprecated behavior, set this to true and then follow:
        // https://deprecations.emberjs.com/id/ember-data-deprecate-store-extends-ember-object
        // before upgrading to Ember Data 6.0
        DEPRECATE_STORE_EXTENDS_EMBER_OBJECT: false,
      },
    },
  });

  let bootstrapPath = 'node_modules/bootstrap/dist/';
  app.import(`${bootstrapPath}css/bootstrap.css`);
  app.import(`${bootstrapPath}fonts/glyphicons-halflings-regular.eot`, {
    destDir: '/fonts',
  });
  app.import(`${bootstrapPath}fonts/glyphicons-halflings-regular.svg`, {
    destDir: '/fonts',
  });
  app.import(`${bootstrapPath}fonts/glyphicons-halflings-regular.ttf`, {
    destDir: '/fonts',
  });
  app.import(`${bootstrapPath}fonts/glyphicons-halflings-regular.woff`, {
    destDir: '/fonts',
  });
  app.import(`${bootstrapPath}fonts/glyphicons-halflings-regular.woff2`, {
    destDir: '/fonts',
  });

  /*
    This build file specifes the options for the dummy test app of this
    addon, located in `/tests/dummy`
    This build file does *not* influence how the addon or the app using it
    behave. You most likely want to be modifying `./index.js` or app's build file
  */

  return app.toTree();
};
