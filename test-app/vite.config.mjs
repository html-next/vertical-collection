import { join } from 'node:path';
import { defineConfig } from 'vite';
import { extensions, classicEmberSupport, ember } from '@embroider/vite';
import { babel } from '@rollup/plugin-babel';

export default defineConfig({
  resolve: {
    alias: {
      'ember-cached-decorator-polyfill': join(
        process.cwd(),
        'node_modules/ember-cached-decorator-polyfill/addon/index.js',
      ),
    },
  },
  plugins: [
    classicEmberSupport(),
    ember(),
    // extra plugins here
    babel({
      babelHelpers: 'runtime',
      extensions,
    }),
  ],
});
