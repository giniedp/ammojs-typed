import typescript from 'rollup-plugin-typescript2'
import resolve from 'rollup-plugin-node-resolve'
import sourcemaps from 'rollup-plugin-sourcemaps'
import autoExternal from 'rollup-plugin-auto-external';
import copy from 'rollup-plugin-copy'

export default {
  input: 'src/index.ts',
  output: {
    name: 'Example',
    file: 'dist/index.js',
    format: 'umd',
    sourcemap: true,
    globals: {
      'ammojs-typed': 'Ammo',
      '@gglib/utils': 'Gglib.Utils',
      '@gglib/math': 'Gglib.Math',
      '@gglib/graphics': 'Gglib.Graphics',
      '@gglib/terrain': 'Gglib.Terrain',
    }
  },
  watch: {
    include: 'src/**'
  },
  plugins: [
    resolve(),
    sourcemaps(),
    typescript(),
    autoExternal(),
    copy({
      targets: [
        { src: 'node_modules/ammojs-typed/ammo/ammo.js', dest: 'dist' },
        { src: 'node_modules/@gglib/gglib/bundles/gglib.umd.js', dest: 'dist' },
      ]
    })
  ]
}
