// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://starsnatwalker.com',
  // Cloudflare Pages serves directory-style URLs and 308s the slashless form.
  // Emitting slashed URLs everywhere keeps internal links off that redirect —
  // a redirect hop on every internal link leaks authority to the homepage.
  trailingSlash: 'always',
  vite: {
    plugins: [tailwindcss()],
  },
});
