import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths, so the built game works from any folder or web
  // address (GitHub Pages project sites, Netlify, a USB stick…).
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5174,
    // Always use this exact address. Saves live in the browser per web
    // address (localStorage is per origin), so a drifting port would split
    // saves. If it's taken, fail loudly instead of moving.
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
  },
});
