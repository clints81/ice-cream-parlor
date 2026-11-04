import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5174,
    // Always use this exact port. If it's taken, fail loudly instead of
    // silently drifting to another port — a drifting port splits saves across
    // origins (localStorage is per-port), which stranded parlors before.
    strictPort: true,
  },
});
