import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  //base: '/my-app/', // أضف هذا السطر باسم المجلد الخاص بك
})
