import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import fs from 'fs';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  fs.writeFileSync('env.json', JSON.stringify({
    url: env.VITE_SUPABASE_URL,
    key: env.VITE_SUPABASE_ANON_KEY
  }));
  return {
    plugins: [
      react(), 
      tailwindcss(),
      nodePolyfills({
        include: ['buffer'],
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),
    ],
    base: './',
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
