import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: [
      "lucide-react",
      "react",
      "react-dom",
      "react-router-dom"
    ],
    force: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'icons': ['lucide-react'],
        },
      },
    },
  },
  server: {
    // VITE_API_URL=/ bo'lganda dev-serverda /api va /media Django'ga yo'naltiriladi
    // changeOrigin: false — Django absolyut URL'larni (rasm, pagination) shu dev-server hostida yasaydi
    proxy: {
      '/api': { target: process.env.VITE_PROXY_TARGET || 'http://localhost:8000', changeOrigin: false },
      '/media': { target: process.env.VITE_PROXY_TARGET || 'http://localhost:8000', changeOrigin: false },
    },
    fs: {
      allow: ['..']
    },
    hmr: {
      overlay: true, // Error overlay ni ko'rsatish
    }
  },
  // HMR va file watching ni optimize qilish
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  }
});
