export default {
  extends: 'recommended',
  overrides: [
      /**
   * Tech debt to solve later (acquired during v2 addonification)
   * (mostly due to upgrades bringing new lints)
   */
    {
      files: ['**/*.{gjs,gts,hbs,js,ts}'],
      rules: {
        'no-inline-styles': false,
        'no-unbound': false,
        'no-unused-block-params': false,
        'require-button-type': false,
        'require-valid-alt-text': false,
      }
    }
  ]
};
