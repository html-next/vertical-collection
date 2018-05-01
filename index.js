'use strict';

const StripClassCallCheckPlugin = require('babel6-plugin-strip-class-callcheck');
const Funnel = require('broccoli-funnel');
const Rollup = require('broccoli-rollup');
const merge = require('broccoli-merge-trees');
const VersionChecker = require('ember-cli-version-checker');

const path = require('path');

const BlockScopingTransform = (function() {
  let plugin = require('babel-plugin-transform-es2015-block-scoping');

  // adding `baseDir` ensures that broccoli-babel-transpiler does not
  // issue a warning and opt out of caching
  let pluginPath = require.resolve('babel-plugin-transform-es2015-block-scoping/package');
  let pluginBaseDir = path.dirname(pluginPath);
  plugin.baseDir = () => pluginBaseDir;

  return plugin;
})();

function isProductionEnv() {
  const isProd = /production/.test(process.env.EMBER_ENV);
  const isTest = process.env.EMBER_CLI_TEST_COMMAND;

  return isProd && !isTest;
}

module.exports = {
  name: '@html-next/vertical-collection',

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

  treeForAddon(tree) {
    let babel = this.addons.find((addon) => addon.name === 'ember-cli-babel');
    let withPrivate = new Funnel(tree, { include: ['-private/**'] });
    let withoutPrivate = new Funnel(tree, {
      exclude: [
        '**/**.hbs',
        '-private',
        isProductionEnv() ? '-debug' : false
      ].filter(Boolean),

      destDir: '@html-next/vertical-collection'
    });

    let privateTree = babel.transpileTree(withPrivate, {
      babel: this.options.babel,
      'ember-cli-babel': {
        compileModules: false
      }
    });

    const templateTree = new Funnel(tree, {
      include: ['**/**.hbs']
    });

    // use the default options
    const addonTemplateTree = this._super.treeForAddon.call(this, templateTree);
    let publicTree = babel.transpileTree(withoutPrivate);

    privateTree = new Rollup(privateTree, {
      rollup: {
        input: '-private/index.js',
        output: [
          {
            file: '@html-next/vertical-collection/-private.js',
            format: 'amd',
            amd: {
              id: '@html-next/vertical-collection/-private'
            }
          }
        ],
        external: ['ember', 'ember-raf-scheduler']
      }
    });

    let destDir = this.getOutputDirForVersion();
    publicTree = new Funnel(publicTree, { destDir });
    privateTree = new Funnel(privateTree, { destDir });

    return merge([
      addonTemplateTree,
      publicTree,
      privateTree
    ]);
  },

  _hasSetupBabelOptions: false,
  buildBabelOptions(originalOptions) {
    const plugins = originalOptions.plugins || [];

    const opts = {
      loose: true,
      plugins,
      postTransformPlugins: [StripClassCallCheckPlugin],
      exclude: [
        'transform-es2015-block-scoping',
        'transform-es2015-typeof-symbol'
      ]
    };

    opts.plugins.push(
      [BlockScopingTransform, { 'throwIfClosureRequired': true }]
    );

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
