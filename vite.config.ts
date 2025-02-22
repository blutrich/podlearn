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
  ],
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || 'https://httiyebjgxxwtgggkpgw.supabase.co'),
    'import.meta.env.VITE_FUNCTIONS_URL': JSON.stringify(process.env.VITE_FUNCTIONS_URL || 'https://httiyebjgxxwtgggkpgw.supabase.co/functions/v1'),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0dGl5ZWJqZ3h4d3RnZ2drcGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzkwMjIyOTksImV4cCI6MjA1NDU5ODI5OX0.gS0k4orkiPl1OglKirBiLOqNC-f_flhJLB7iJ6KgxGg')
  }
}));
