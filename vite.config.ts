import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const ReactCompilerConfig = {
  target: '19' // '17' | '18' | '19'
};

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [
          ["babel-plugin-react-compiler", ReactCompilerConfig],
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          markdown: [
            'react-markdown',
            'remark-gfm',
            'remark-math',
            'remark-supersub',
            'rehype-highlight',
            'rehype-katex'
          ],
          highlighting: ['highlight.js'],
          motion: ['motion'],
          icons: ['react-icons']
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
