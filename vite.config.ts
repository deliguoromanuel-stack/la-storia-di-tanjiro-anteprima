import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(({ mode }) => ({
  base: mode === 'github-pages' ? '/la-storia-di-tanjiro-anteprima/' : '/',
  plugins: [tailwindcss()],
}));
