import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "localhost", // ✅ FIX
    port: 5174,
    strictPort: true,
    hmr: {
      host: "localhost", // ✅ FIX
      port: 5174,
    },
  },
});
