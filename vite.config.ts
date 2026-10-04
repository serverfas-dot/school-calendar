import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// Use './' for GitHub Pages project sites (username.github.io/repo-name/)
// and '/' for user/org sites (username.github.io) or local dev.
const base = process.env.GITHUB_PAGES === 'true' ? './' : '/';

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
