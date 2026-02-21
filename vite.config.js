import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/memory-mob/',
  resolve: {
    alias: {
      '@yourusername/stt-module': resolve(__dirname, 'src/vendor/stt-module/index.ts'),
    },
  },
})
