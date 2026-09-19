import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'html-transform-build-meta',
        transformIndexHtml(html: string) {
          return html.replace('content="source"', 'content="production"');
        },
      },
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon.png',
          'icon.svg',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
          'manifest.webmanifest',
          '404.html',
          '.nojekyll',
        ],
        manifest: {
          id: './',
          name: 'ENSv1 - Explore Network Simulator',
          short_name: 'ENSv1',
          description: 'Professional browser-based network laboratory for designing and configuring topologies offline.',
          start_url: './',
          scope: './',
          display: 'standalone',
          orientation: 'any',
          background_color: '#080d17',
          theme_color: '#0ea5e9',
          categories: ['education', 'utilities', 'developer tools'],
          icons: [
            {
              src: './pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: './pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: './pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: './apple-touch-icon.png',
              sizes: '180x180',
              type: 'image/png',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,json}'],
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
