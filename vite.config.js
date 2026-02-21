import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/memory-mob/',
  resolve: {
    alias: {
      '@yourusername/stt-module': '/home/user/memory-mob/src/vendor/stt-module/index.ts',
    },
  },
})
