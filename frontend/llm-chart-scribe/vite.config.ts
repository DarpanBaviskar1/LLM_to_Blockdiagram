import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Dev proxy: forward API requests to backend when VITE_API_BASE_URL is set in .env
    proxy: ((): Record<string, any> => {
      const target = process.env.VITE_API_BASE_URL || process.env.API_BASE_URL || undefined;
      if (target) {
        return {
          // proxy /api/* to backend
          '/api': {
            target,
            changeOrigin: true,
            secure: false,
            rewrite: (p: string) => p.replace(/^\/api/, '/api')
          }
        };
      }
      return {};
    })(),
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
