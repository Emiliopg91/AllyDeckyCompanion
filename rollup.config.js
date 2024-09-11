import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';
import importAssets from 'rollup-plugin-import-assets';

import plugin from "./plugin.json";
import pckJson from "./package.json";

const replaceConfig = {
  preventAssignment: true,
  'process.env.NODE_ENV': JSON.stringify('production'),
  'plugin.name': JSON.stringify(plugin.name),
  'plugin.version': JSON.stringify(pckJson.version)
}

const importConfig = {
  publicPath: `http://127.0.0.1:1337/plugins/${plugin.name}/`
}

const outputConfig = {
  file: "dist/index.js",
  globals: {
    react: "SP_REACT",
    "react-dom": "SP_REACTDOM",
    "decky-frontend-lib": "DFL"
  },
  format: 'iife',
  exports: 'default',
}

const jsonConfig = {
  compact: true
}

export default defineConfig({
  input: './src/index.tsx',
  plugins: [
    commonjs(),
    nodeResolve(),
    typescript(),
    json(jsonConfig),
    replace(replaceConfig),
    importAssets(importConfig)
  ],
  context: 'window',
  external: ["react", "react-dom", "decky-frontend-lib"],
  output: outputConfig
});
