import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://quiztown.techtown.fr',
  output: 'static',
  integrations: [
    react(),
    sitemap({
      i18n: {
        defaultLocale: 'fr',
        locales: {
          fr: 'fr-FR',
          en: 'en-US',
        },
      },
    }),
    mdx(),
    icon(),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/firebase/')) {
              if (id.includes('/auth/')) return 'firebase-auth';
              if (id.includes('/firestore/')) return 'firebase-firestore';
              if (id.includes('/database/')) return 'firebase-database';
              return 'firebase-core';
            }
            if (id.includes('node_modules/framer-motion')) return 'framer-motion';
          },
        },
      },
    },
  },
  i18n: {
    defaultLocale: 'fr',
    locales: ['fr', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
