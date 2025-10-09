import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';

export default [
  // ESM + CJS para npm
  {
    input: 'src/index.ts',
    output: [
      { file: 'dist/index.esm.js', format: 'esm' },
      { file: 'dist/index.cjs.js', format: 'cjs' }
    ],
    plugins: [
      resolve(),
      typescript({ tsconfig: './tsconfig.json' })
    ],
    external: ['rrweb'] // rrweb como dependencia externa
  },

  // UMD para HTML puro
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/chikavi-tracking.umd.js',
      format: 'umd',
      name: 'TrackingItSuite',
      globals: { rrweb: 'rrweb' }
    },
    plugins: [
      resolve(),
      typescript({ tsconfig: './tsconfig.json' })
    ]
  }
];
