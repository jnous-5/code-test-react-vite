import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, "src"),
    },
  },
});
