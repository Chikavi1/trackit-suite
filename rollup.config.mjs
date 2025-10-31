import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs'; // <-- 1. Importa commonjs

export default [
  // ESM + CJS para npm
  {
    input: {
      index: 'src/index.ts',
      nps: 'src/nps/index.ts',
      session: 'src/session/index.ts',
      trackerManager: 'src/session/TrackerManager.ts',
      errors: 'src/errors/index.ts',
      chat: 'src/chat/index.ts',
      surveys: 'src/surveys/index.ts',
      announcement: 'src/announcement/index.ts'

    },
    output: [
      { dir: 'dist', format: 'esm', entryFileNames: '[name].js' },
      { dir: 'dist', format: 'cjs', entryFileNames: '[name].cjs.js' }
    ],
    plugins: [
      resolve(),
      commonjs(), // <-- 2. Añade commonjs (antes de typescript)
      typescript({ tsconfig: './tsconfig.json' })
    ],
    // external: ['rrweb'] // <-- 3. ¡ELIMINA O COMENTA ESTA LÍNEA!
  },

  // UMD para navegador (solo entry principal)
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/chikavi-tracking.umd.js',
      format: 'umd',
      name: 'TrackItSuite',
      // globals: { rrweb: 'rrweb' } // <-- 4. ¡ELIMINA ESTA LÍNEA!
    },
    plugins: [
      resolve(),
      commonjs(), // <-- 5. Añade commonjs aquí también
      typescript({ tsconfig: './tsconfig.json' })
    ]
  }
];