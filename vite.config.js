import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/memory-mob/',
  resolve: {
    alias: {
      '@yourusername/stt-module': '/home/user/20250428-test1/stt-module/src/index.ts',
    },
  },
})
