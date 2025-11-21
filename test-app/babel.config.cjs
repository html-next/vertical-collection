'use strict';

const {
  babelCompatSupport,
  templateCompatSupport,
} = require('@embroider/compat/babel');

const needsOwnerPolyfill = process.env.NEEDS_OWNER_POLYFILL === 'true';
const needsServicePolyfill = process.env.NEEDS_SERVICE_POLYFILL === 'true';

console.log('babel', { needsOwnerPolyfill, needsServicePolyfill });

module.exports = {
  plugins: [
    [
      '@babel/plugin-transform-typescript',
      {
        allExtensions: true,
        onlyRemoveTypeImports: true,
        allowDeclareFields: true,
      },
    ],
    needsOwnerPolyfill
      ? 'babel-plugin-ember-polyfill-get-and-set-owner-from-ember-owner'
      : null,
    needsServicePolyfill
      ? 'babel-plugin-undeprecate-inject-from-at-ember-service'
      : null,
    [
      'babel-plugin-ember-template-compilation',
      {
        compilerPath: 'ember-source/dist/ember-template-compiler.js',
        enableLegacyModules: [
          'ember-cli-htmlbars',
          'ember-cli-htmlbars-inline-precompile',
          'htmlbars-inline-precompile',
        ],
        transforms: [...templateCompatSupport()],
      },
    ],
    [
      'module:decorator-transforms',
      {
        runtime: {
          import: require.resolve('decorator-transforms/runtime-esm'),
        },
      },
    ],
    [
      '@babel/plugin-transform-runtime',
      {
        absoluteRuntime: __dirname,
        useESModules: true,
        regenerator: false,
      },
    ],
    ...babelCompatSupport(),
  ].filter(Boolean),

  generatorOpts: {
    compact: false,
  },
};
