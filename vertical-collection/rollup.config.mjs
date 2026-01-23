import { Addon } from '@embroider/addon-dev/rollup';
import { babel } from '@rollup/plugin-babel';

const addon = new Addon({
  srcDir: 'src',
  destDir: 'dist',
});

export default {
  output: addon.output(),

  plugins: [
    addon.publicEntrypoints(['index.js', '-private/index.js']),
    addon.dependencies(),
    babel({
      extensions: ['.js', '.gjs', '.ts', '.gts'],
      babelHelpers: 'bundled',
    }),
    addon.gjs(),
    addon.keepAssets(['**/*.css']),
    addon.clean(),
  ],
};
