export default {
  plugins: [
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
    [
      'module:decorator-transforms',
      { runtime: { import: 'decorator-transforms/runtime-esm' } },
    ],
  ],
};
