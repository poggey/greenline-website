// @ts-check
import { defineConfig } from 'astro/config';

// Static, SEO-friendly build (§14). Set `site` to the production domain
// so canonical URLs, Open Graph and sitemap output are correct.
export default defineConfig({
  site: 'https://greenlinehse.com.au',
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto',
  },
});
