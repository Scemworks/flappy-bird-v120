import type { NextConfig } from "next";
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA({
  ...nextConfig,
  dest: 'public',
  register: true,
  skipWaiting: true,
  additionalManifestEntries: [
    { url: '/', revision: '1' },
    { url: '/offline.html', revision: '1' },
    { url: '/manifest.json', revision: '1' },
    { url: '/icon-192.png', revision: '1' },
    { url: '/icon-512.png', revision: '1' },
  ],
  navigateFallback: '/',
  runtimeCaching: [
    {
      urlPattern: /\/sprites\/.*\.(?:png|jpg|jpeg|webp|gif)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'sprites-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
    {
      urlPattern: /\/audio\/.*\.(?:ogg|wav|mp3)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'audio-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
});
