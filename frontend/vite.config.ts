import { defineConfig } from "vite";
import { configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

// VITE_API_URL=/ bo'lganda /api va /media Django'ga yo'naltiriladi
// changeOrigin: false — Django absolyut URL'larni (rasm, pagination) shu serverning hostida yasaydi
const devProxy = {
  '/api': { target: process.env.VITE_PROXY_TARGET || 'http://localhost:8000', changeOrigin: false },
  '/media': { target: process.env.VITE_PROXY_TARGET || 'http://localhost:8000', changeOrigin: false },
};

export default defineConfig({
  plugins: [react()],
  // MG-11: "Oxirgi o'zgartirilgan sana" — build vaqti
  define: { __BUILD_DATE__: JSON.stringify(new Date().toISOString()) },
  // Playwright e2e testlari (e2e/*.spec.ts) vitest'ga kirmaydi — `npm run e2e`
  test: { exclude: [...configDefaults.exclude, "e2e/**"] },
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
  // `vite preview` (production build'ni lokal tekshirish, PWA/Lighthouse) ham Django'ga yo'naltiradi
  preview: { proxy: devProxy },
  server: {
    proxy: devProxy,
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
