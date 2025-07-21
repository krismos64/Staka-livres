/// <reference types="vitest" />
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": path.resolve(__dirname, "../shared/types"),
    },
  },
  optimizeDeps: {
    include: ["@tanstack/react-query"],
  },
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    allowedHosts: ["host.docker.internal", "localhost", "127.0.0.1"],
    watch: {
      usePolling: true,
      interval: 1000,
    },
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        // Ne pas supprimer /api car le backend l'attend maintenant
      },
    },
  },
  preview: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: [
      "node_modules", 
      "dist", 
      ".idea", 
      ".git", 
      ".cache",
      // Exclure les tests d'intégration qui nécessitent un backend
      "**/tests/integration/**",
      "tests/integration/**"
    ],
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
