import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser'; 

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
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' })
    ],
  },

  // UMD para navegador
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/pulse-track.umd.js',
        format: 'umd',
        name: 'PulseTrack'
      },
      {
        file: 'dist/pulse-track.umd.min.js', // archivo minificado
        format: 'umd',
        name: 'PulseTrack',
        plugins: [terser({
        format: {
          comments: false 
        }
      })]  
      }
    ],
    plugins: [
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' })
    ]
  }

];
