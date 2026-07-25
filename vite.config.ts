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
  // GitHub Pages'de repo adı path prefix olarak gelir.
  // Eğer custom domain kullanıyorsan base: "/" olarak bırak.
  base: "/samething/",
});
