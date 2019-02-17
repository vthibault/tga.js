/* eslint-env node */

import fs from 'fs';
import path from 'path';

import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';

const { version, license, name } = require('./package.json');
const licenseData = fs.readFileSync(path.join(process.cwd(), 'LICENSE.md'), {
  encoding: 'utf-8',
});

const bannerPlugin = {
  banner: `/**
 * @license ${name} ${version}
 * ${licenseData.split('\n', 1)}
 * License: ${license}
 */`,
};

const exportFormat = format => ({
  input: `src/tga.js`,
  output: {
    name: 'TgaLoader',
    file: `dist/${format}/tga.js`,
    format,
  },
  plugins: [
    bannerPlugin,
    format === 'esm' ? null : babel(),
    terser({
      toplevel: true,
      compress: {
        unsafe: true,
      },
      output: { comments: /@license/ },
    }),
  ].filter(v => v),
  external: ['src/compiler.js'],
});

export default ['umd', 'cjs', 'esm'].map(exportFormat);
