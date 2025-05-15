module.exports = {
  root: true,
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    requireConfigFile: false,
    babelOptions: {
      plugins: [
        ['@babel/plugin-proposal-decorators', { decoratorsBeforeExport: true }],
      ],
    },
  },
  plugins: [
    'ember'
  ],
  extends: [
    'eslint:recommended',
    'plugin:ember/recommended'
  ],
  env: {
    browser: true
  },
  globals: {
    ArrayBuffer: true,
    Float32Array: true
  },
  rules: {
    'quotes': ['error', 'single', { 'allowTemplateLiterals': true, 'avoidEscape': true }],

    'ember/closure-actions': 'off',
    'ember/no-get': 'off',
    'ember/no-classic-components': 'off',
    'ember/require-tagless-components': 'off',
    'ember/no-classic-classes': 'off',
    'ember/no-actions-hash': 'off',
  },
  overrides: [
    // node files
    {
      files: [
        './.eslintrc.js',
        './.prettierrc.js',
        './.stylelintrc.js',
        './.template-lintrc.js',
        './ember-cli-build.js',
        './index.js',
        './testem.js',
        './blueprints/*/index.js',
        './config/**/*.js',
        './tests/dummy/config/**/*.js',
      ],
      parserOptions: {
        sourceType: 'script'
      },
      env: {
        browser: false,
        node: true
      },
      extends: ['plugin:n/recommended'],
    },
    {
      // test files
      files: ['tests/**/*-test.{js,ts}'],
      extends: ['plugin:qunit/recommended'],
    },
  ],
};
