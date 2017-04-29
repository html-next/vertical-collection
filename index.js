/* eslint-env node */
'use strict';

var chalk = require('chalk');
var StripClassCallCheck = require('babel6-plugin-strip-class-callcheck');
var FilterImports = require('babel-plugin-filter-imports');
var RemoveImports = require('./lib/babel-plugin-remove-imports');
var Funnel = require('broccoli-funnel');
var Rollup = require('broccoli-rollup');
var merge   = require('broccoli-merge-trees');

function isProductionEnv() {
  var isProd = /production/.test(process.env.EMBER_ENV);
  var isTest = process.env.EMBER_CLI_TEST_COMMAND;

  return isProd && !isTest;
}

module.exports = {
  name: 'vertical-collection',

  init: function() {
    this._super.init && this._super.init.apply(this, arguments);

    this.options = this.options || {};
  },

  treeForAddon: function(tree) {
    let babel = this.addons.find(addon => addon.name === 'ember-cli-babel');
    let withPrivate    = new Funnel(tree, { include: ['-private/**'] });
    let withoutPrivate = new Funnel(tree, {
      exclude: [
        '**/**.hbs',
        '-private',
        isProductionEnv() ? '-debug' : false
      ].filter(Boolean),

      destDir: 'vertical-collection'
    });

    var privateTree = babel.transpileTree(withPrivate, {
      babel: this.buildBabelOptions(),
      'ember-cli-babel': {
        compileModules: false
      }
    });

    var templateTree = new Funnel(tree, {
      include: ['**/**.hbs']
    });

    // use the default options
    var addonTemplateTree = this._super(templateTree);
    var publicTree = babel.transpileTree(withoutPrivate);

    privateTree = new Rollup(privateTree, {
      rollup: {
        entry: '-private/index.js',
        targets: [
          { dest: 'vertical-collection/-private.js', format: 'amd', moduleId: 'vertical-collection/-private' }
        ],
        external: [
          'ember',
          'vertical-collection/-debug/helpers'
        ],
        // cache: true|false Defaults to true
      }
    });

    // the output of treeForAddon is required to be modules/<your files>
    publicTree  = new Funnel(publicTree,  { destDir: 'modules' });
    privateTree = new Funnel(privateTree, { destDir: 'modules' });

    return merge([
      addonTemplateTree,
      publicTree,
      privateTree
    ]);
  },

  _hasSetupBabelOptions: false,
  buildBabelOptions() {
    let opts = {
      loose: true,
      plugins: [],
      postTransformPlugins: [StripClassCallCheck],
      exclude: [
        'transform-es2015-block-scoping',
        'transform-es2015-typeof-symbol'
      ]
    };

    if (isProductionEnv()) {
      var strippedImports = {
        'vertical-collection/-debug/helpers': [
          'assert',
          'warn',
          'debug',
          'debugOnError',
          'deprecate',
          'stripInProduction'
        ]
      };

      opts.plugins.push(
        [FilterImports, strippedImports],
        [RemoveImports, 'vertical-collection/-debug/helpers']
      );
    }

    opts.plugins.push(
      ['transform-es2015-block-scoping', { 'throwIfClosureRequired': true }]
    );

    return opts;
  },
  _setupBabelOptions: function() {
    if (this._hasSetupBabelOptions) {
      return;
    }

    this.options.babel = this.buildBabelOptions();

    this._hasSetupBabelOptions = true;
  },

  included: function(app) {
    this._super.included.apply(this, arguments);

    while (typeof app.import !== 'function' && app.app) {
      app = app.app;
    }

    if (typeof app.import !== 'function') {
      throw new Error('vertical-collection is being used within another addon or engine ' +
        'and is having trouble registering itself to the parent application.');
    }

    this._env = app.env;
    this._setupBabelOptions(app.env);

    if (!/production/.test(app.env) && !/test/.test(app.env)) {
      this.ui.write(
        chalk.grey("\n===================================================================\n") +
        chalk.cyan("\tVertical Collection\n") +
        chalk.grey("\t:: Including CSS for Visual Debugger\n") +
        chalk.grey("\t:: (included in non production builds only)\n") +
        chalk.grey("\t:: To use, set ") + chalk.yellow("{{#vertical-collection debug=true}}\n") +
        chalk.grey("\t:: To debug your applied CSS rules, set ") + chalk.yellow("{{#vertical-collection debugCSS=true}}") +
        chalk.grey("\n===================================================================\n")
      );

      app.import('./vendor/debug.css');
    }
  },

  treeForApp: function() {
    var tree = this._super.treeForApp.apply(this, arguments);

    if (/production/.test(this._env) || /test/.test(this._env)) {
      tree = new Funnel(tree, { exclude: [ /initializers/ ] });
    }

    return tree;
  }
};
