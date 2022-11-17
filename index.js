'use strict';

const StripClassCallCheckPlugin = require.resolve('babel6-plugin-strip-class-callcheck');
const Funnel = require('broccoli-funnel');
const Rollup = require('broccoli-rollup');
const merge = require('broccoli-merge-trees');
const VersionChecker = require('ember-cli-version-checker');

module.exports = {
  name: require('./package').name,

  init() {
    this._super.init && this._super.init.apply(this, arguments);

    this.options = this.options || {};
  },

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

  treeForAddon(tree) {
    let babel = this.addons.find((addon) => addon.name === 'ember-cli-babel');
    let withPrivate = new Funnel(tree, { include: ['-private/**'] });
    let withoutPrivate = new Funnel(tree, {
      exclude: [
        '**/**.hbs',
        '-private'
      ],
      destDir: '@html-next/vertical-collection'
    });

    let privateTree = babel.transpileTree(withPrivate, {
      babel: this.options.babel,
      'ember-cli-babel': {
        // we leave our output as valid ES
        // for the consuming app's config to transpile as desired
        // so we don't want to compileModules to amd here
        compileModules: false,

        disableEmberModulesAPIPolyfill: !this._emberVersionRequiresModulesAPIPolyfill(),

        // TODO for the embroider world we want to leave our -private module
        // as an es module and only transpile the few things we genuinely care about.
        // ideally this would occur as a pre-publish step so that consuming apps would
        // just see a `-private.js` file and not pay any additional costs.
        // CURRENTLY we transpile the -private module fully acccording to the
        // consuming app's config, so we must leave these enabled.
        disablePresetEnv: false,
        disableDebugTooling: false,
        disableDecoratorTransforms: false,
        enableTypeScriptTransform: true,

        throwUnlessParallelizable: true,

        // consuming app will take care of this if needed,
        // we don't need to also include
        includePolyfill: false,

        extensions: ['js', 'ts'],
      },
    });

    const templateTree = new Funnel(tree, {
      include: ['**/**.hbs']
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
              id: '@html-next/vertical-collection/-private'
            }
          }
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
      postTransformPlugins: [[StripClassCallCheckPlugin, {}]]
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
      throw new Error('vertical-collection is being used within another addon or engine '
        + 'and is having trouble registering itself to the parent application.');
    }

    this._env = app.env;
    this._setupBabelOptions(app.env);

    if (!/production/.test(app.env) && !/test/.test(app.env)) {
      this.import('vendor/debug.css');
    }
  }
};
