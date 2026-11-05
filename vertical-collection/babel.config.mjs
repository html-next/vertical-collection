export default {
  plugins: [
    'module:ember-tracked-as-function-polyfill/babel-plugin',
    'module:ember-reactive-collections-polyfill/babel-plugin',
    [
      '@babel/plugin-transform-typescript',
      {
        allExtensions: true,
        allowDeclareFields: true,
        onlyRemoveTypeImports: true,
      },
    ],
    [
      'module:babel-plugin-ember-template-compilation',
      {
        targetFormat: 'hbs',
        transforms: [],
      },
    ],
  ],
};
