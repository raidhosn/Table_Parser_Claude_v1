import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Table_Parser_Claude_v1/',  // <-- This is the fix
  build: {
    outDir: 'docs'
  }
})