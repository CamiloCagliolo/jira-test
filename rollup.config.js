import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/main.ts',
  output: {
    file: 'dist/index.cjs',
    format: 'cjs',
    exports: 'auto'
  },
  plugins: [
    nodeResolve({
      preferBuiltins: true
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.json'
    })
  ],
  external: []
};