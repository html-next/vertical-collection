'use strict';

module.exports = {
  root: true,
  parser: 'babel-eslint',
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      legacyDecorators: true,
    },
  },
  plugins: ['ember'],
  extends: [
    'eslint:recommended',
    'plugin:ember/recommended',
    'plugin:prettier/recommended',
  ],
  env: {
    browser: true,
  },
  globals: {
    ArrayBuffer: true,
    Float32Array: true,
  },
  rules: {
    'no-setter-return': 'off',
    quotes: [
      'error',
      'single',
      { allowTemplateLiterals: true, avoidEscape: true },
    ],

    'ember/no-jquery': 'error',

    // TODO: Fix all of these for Octane
    'ember/classic-decorator-hooks': 'off',
    'ember/closure-actions': 'off',
    'ember/no-actions-hash': 'off',
    'ember/no-classic-classes': 'off',
    'ember/no-classic-components': 'off',
    'ember/no-component-lifecycle-hooks': 'off',
    'ember/no-controller-access-in-routes': 'off',
    'ember/no-get': 'off',
    'ember/no-new-mixins': 'off',
    'ember/no-test-module-for': 'off',
    'ember/no-test-this-render': 'off',
    'ember/require-computed-property-dependencies': 'off',
    'ember/require-tagless-components': 'off',
  },
  overrides: [
    // node files
    {
      files: [
        './.eslintrc.js',
        './.prettierrc.js',
        './.template-lintrc.js',
        './ember-cli-build.js',
        './index.js',
        './testem.js',
        './blueprints/*/index.js',
        './config/**/*.js',
        './tests/dummy/config/**/*.js',
      ],
      parserOptions: {
        sourceType: 'script',
      },
      env: {
        browser: false,
        node: true,
      },
      plugins: ['node'],
      extends: ['plugin:node/recommended'],
    },
    {
      // Test files:
      files: ['tests/**/*-test.{js,ts}'],
      extends: ['plugin:qunit/recommended'],
    },
  ],
};
