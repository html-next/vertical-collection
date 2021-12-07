'use strict';

const StripClassCallCheckPlugin = require('babel6-plugin-strip-class-callcheck');
const Funnel = require('broccoli-funnel');
const Rollup = require('broccoli-rollup');
const merge = require('broccoli-merge-trees');
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

  getOutputDirForVersion() {
    let VersionChecker = require('ember-cli-version-checker');
    let checker = new VersionChecker(this);
    let emberCli = checker.for('ember-cli', 'npm');

    let requiresModulesDir = emberCli.satisfies('< 3.0.0');

    return requiresModulesDir ? 'modules' : '';
  },

  // Borrowed from ember-cli-babel
  _emberVersionRequiresModulesAPIPolyfill() {
    let checker = this.checker.for('ember-source', 'npm');

    if (!checker.exists()) {
      return true;
    }

    return checker.lt('3.27.0-alpha.1');
  },

  treeForAddon(tree) {
    let babel = this.addons.find((addon) => addon.name === 'ember-cli-babel');
    let withPrivate = new Funnel(tree, { include: ['-private/**'] });
    let withoutPrivate = new Funnel(tree, {
      exclude: [
        '**/**.hbs',
        '-private',
        isProductionEnv() ? '-debug' : false,
      ].filter(Boolean),

      destDir: '@html-next/vertical-collection',
    });

    // When compiling with `compileModules: false`, ember-cli-babel defaults to
    // using the modules polyfill, since it assumes we are concatenating the
    // output script using `app.import` without an AMD wrapper.
    //
    // This does not apply to us, since we are compiling the `-private` modules
    // into a single AMD module (via rollup below), which can in fact have
    // external dependencies.
    //
    // We can opt-out of this with `disableEmberModulesAPIPolyfill: true`. In
    // Ember versions with "real modules", that is what we want in order to
    // avoid the Ember global deprecation (or just completely not working in
    // 4.0+).
    //
    // It seems like the intent may have been that we should be able to set
    // this to `true` unconditionally, and `ember-cli-babel` will ignore this
    // setting if the Ember verion requires the modules API polyfill. However,
    // presumably due to a bug, ember-cli-babel actually checks for this value
    // first and return out of the function early if its value is truthy. This
    // means that if we set this to true unconditionally, then we would have
    // disabled the modules polyfill for Ember versions that needs it, which
    // would be incorrect. Therefore, we have to duplicate the detection logic
    // here in order to set this value appropriately.
    //
    // Ideally, we should just stop trying to rollup the -private modules and
    // let the modern build pipeline optimizes things for us, then none of this
    // would have been necessary.
    let privateTree = babel.transpileTree(withPrivate, {
      babel: this.options.babel,
      'ember-cli-babel': {
        compileModules: false,
        disableEmberModulesAPIPolyfill:
          !this._emberVersionRequiresModulesAPIPolyfill(),
      },
    });

    const templateTree = new Funnel(tree, {
      include: ['**/**.hbs'],
    });

    // use the default options
    const addonTemplateTree = this._super(templateTree);
    let publicTree = babel.transpileTree(withoutPrivate);

    privateTree = new Rollup(privateTree, {
      rollup: {
        input: '-private/index.js',
        output: [
          {
            file: '@html-next/vertical-collection/-private.js',
            format: 'amd',
            amd: {
              id: '@html-next/vertical-collection/-private',
            },
          },
        ],
        external(id) {
          return (
            id.startsWith('@ember/') ||
            ['ember', 'ember-raf-scheduler'].includes(id)
          );
        },
      },
    });

    let destDir = this.getOutputDirForVersion();
    publicTree = new Funnel(publicTree, { destDir });
    privateTree = new Funnel(privateTree, { destDir });

    return merge([addonTemplateTree, publicTree, privateTree]);
  },

  _hasSetupBabelOptions: false,
  buildBabelOptions(originalOptions) {
    const plugins = originalOptions.plugins || [];

    const opts = {
      loose: true,
      plugins,
      postTransformPlugins: [StripClassCallCheckPlugin],
    };

    return opts;
  },
  _setupBabelOptions() {
    if (this._hasSetupBabelOptions) {
      return;
    }

    this.options.babel = this.buildBabelOptions(this.options.babel);

    this._hasSetupBabelOptions = true;
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
          'and is having trouble registering itself to the parent application.'
      );
    }

    this._env = app.env;
    this._setupBabelOptions(app.env);

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

    return new Funnel(tree, { exclude });
  },
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
