import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

const __dirname = path.resolve()

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  css: {
    postcss: './postcss.config.js',
  }
})