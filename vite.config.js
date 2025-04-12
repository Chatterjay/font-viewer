import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  define: {
    __dirname: "undefined",
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    target: "es2015",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          "vue-vendor": ["vue", "vue-router"],
          "tauri-api": ["@tauri-apps/api"],
          components: [
            "./src/components/FontList.vue",
            "./src/components/FontPreview.vue",
            "./src/components/SettingsSidebar.vue",
          ],
          utils: ["./src/utils/storage.js", "./src/utils/cssVariables.js"],
          composables: [
            "./src/composables/useFontManagement.js",
            "./src/composables/useLayoutManagement.js",
          ],
        },
        chunkFileNames: "assets/js/[name]-[hash].js",
        entryFileNames: "assets/js/[name]-[hash].js",
        assetFileNames: "assets/[ext]/[name]-[hash].[ext]",
      },
    },
    cssCodeSplit: true,
    sourcemap: false,
    assetsInlineLimit: 4096,
    cssTarget: "chrome80",
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ["vue", "vue-router", "@tauri-apps/api"],
    exclude: [],
  },
  esbuild: {
    legalComments: "none",
    drop: ["console", "debugger"],
  },
});
