export default {
  plugins: [
    [
      'module:babel-plugin-ember-template-compilation',
      {
        targetFormat: 'hbs',
        transforms: [],
      },
    ],
  ],
};
