import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/TFG-Workly-Front/',
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/styles/tailwind.css";`,
      },
    },
  },
})


