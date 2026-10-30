import { Addon } from '@embroider/addon-dev/rollup';
import { babel } from '@rollup/plugin-babel';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const addon = new Addon({
  srcDir: 'src',
  destDir: 'dist',
});

const rootDirectory = dirname(fileURLToPath(import.meta.url));
const tsConfig = resolve(rootDirectory, './tsconfig.publish.json');

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
    addon.declarations(
      'declarations',
      `pnpm ember-tsc --declaration --project ${tsConfig}`,
    ),
    addon.keepAssets(['**/*.css']),
    addon.clean(),
  ],
};
