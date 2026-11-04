import { defineConfig } from 'tsdown';
import { ember } from '@nullvoxpopuli/ember-rolldown';

export default defineConfig({
  entry: ['./src/index.ts', './src/-private/index.ts'],
  tsconfig: './tsconfig.publish.json',
  css: { inject: true },
  plugins: [ember()],
});
