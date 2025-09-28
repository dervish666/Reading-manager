/**
 * RSBbuild Configuration
 * Build configuration for the React frontend
 */

import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'build',
  },
  html: {
    title: 'Reading Assistant',
    template: './public/index.html',
    inject: 'body',
  },
  source: {
    entry: {
      index: './src/frontend/index.js',
    },
  },
  output: {
    distPath: {
      root: 'build',
    },
  },
  dev: {
    hmr: true,
  },
  tools: {
    bundlerChain: (chain) => {
      // Add any additional webpack chain modifications here
    },
  },
});