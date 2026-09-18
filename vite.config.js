import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({plugins:[react()],resolve:{dedupe:['react','react-dom']},build:{chunkSizeWarningLimit:1100,rollupOptions:{output:{manualChunks:{three:['three','@react-three/fiber','@react-three/drei']}}}}})
