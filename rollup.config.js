import typescript from '@rollup/plugin-typescript'
import pkg from './package.json'

export default {
  //入口
  input: './src/index.ts',
  //出口
  output: [
    {
      format: 'cjs', //commonJS
      file: pkg.main,
    },
    {
      format: 'esm',
      file: pkg.madule,
    },
  ],
  plugins: [typescript()],
}
