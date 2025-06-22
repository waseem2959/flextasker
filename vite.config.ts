import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react({
      // Use SWC for faster builds
      jsxRuntime: 'automatic',
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
       '@': path.resolve(__dirname, './src'),
       '@/shared': path.resolve(__dirname, './shared'),
    },
  },
  build: {
    // Enable tree-shaking and minification
    minify: 'terser',
    target: 'es2020',
    cssMinify: true,
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        passes: 2,
        pure_funcs: ['console.log', 'console.warn'],
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React chunks
          'react-core': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          
          // UI library chunks (split by usage frequency)
          'ui-primitives': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-avatar'],
          'ui-advanced': ['@radix-ui/react-navigation-menu', '@radix-ui/react-popover'],
          'ui-forms': ['@radix-ui/react-select', '@radix-ui/react-checkbox', '@radix-ui/react-switch'],
          
          // Feature-specific chunks
          'charts': ['recharts'],
          'animations': ['framer-motion'],
          'forms': ['react-hook-form', '@hookform/resolvers'],
          'query': ['@tanstack/react-query'],
          'icons': ['lucide-react', 'react-icons'],
          'state': ['zustand'],
          'sockets': ['socket.io-client'],
          
          // Utility chunks
          'date-utils': ['date-fns'],
          'ui-utils': ['clsx', 'tailwind-merge', 'class-variance-authority'],
          'validation': ['zod'],
        },
      },
    },
    // Set chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Report compressed size
    reportCompressedSize: false,
    // Improve build performance
    cssCodeSplit: true,
  },
  optimizeDeps: {
    // Pre-bundle heavy dependencies
    include: ['react', 'react-dom', 'react-router-dom'],
    // Exclude dependencies that should be bundled separately
    exclude: ['@radix-ui/*'],
  },
  server: {
    port: 5174,
    host: true,
    hmr: {
      port: 5174,
    },
    // Proxy API requests to your backend during development
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});