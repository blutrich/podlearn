import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  envPrefix: [
    'VITE_',
    'SUPABASE_',
    'FUNCTIONS_URL',
    'API_URL',
    'ASSEMBLYAI_API_KEY',
    'OPENAI_API_KEY',
  ],
  define: {
    'import.meta.env.FUNCTIONS_URL': JSON.stringify('https://httiyebjgxxwtgggkpgw.supabase.co/functions/v1')
  }
}));
