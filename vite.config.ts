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
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'react', 
            'react-dom', 
            'react-router-dom', 
            '@tanstack/react-query',
            'sonner',
            'lucide-react',
          ],
          'ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-accordion',
            '@radix-ui/react-avatar',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            'class-variance-authority',
            'tailwindcss',
          ],
        },
        chunkFileNames: 'assets/[name]-[hash].js',
      },
    },
    chunkSizeWarningLimit: 600,
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
