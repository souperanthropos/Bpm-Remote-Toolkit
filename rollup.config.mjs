import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import url from '@rollup/plugin-url';

import css from 'rollup-plugin-css-only';

export default [

  // client
  {
    input: 'src/client/bpmn-viewer.js',
    output: {
      sourcemap: true,
      format: 'iife',
      file: './out/client/bpmn-viewer.js'
    },
    plugins: [
      url({
        fileName: '[dirname][filename][extname]',
        publicPath: '/media/'
      }),

      css({ output: 'bpmn-viewer.css' }),

      resolve(),
      commonjs()
    ],
    watch: {
      clearScreen: false
    }
  }
];
