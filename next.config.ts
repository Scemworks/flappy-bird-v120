import type { NextConfig } from "next";
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  /* config options here */
};

export default withPWA({
  ...nextConfig,
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
    additionalManifestEntries: [
      // Sprites
      { url: '/sprites/0.png', revision: '1' },
      { url: '/sprites/1.png', revision: '1' },
      { url: '/sprites/2.png', revision: '1' },
      { url: '/sprites/3.png', revision: '1' },
      { url: '/sprites/4.png', revision: '1' },
      { url: '/sprites/5.png', revision: '1' },
      { url: '/sprites/6.png', revision: '1' },
      { url: '/sprites/7.png', revision: '1' },
      { url: '/sprites/8.png', revision: '1' },
      { url: '/sprites/9.png', revision: '1' },
      { url: '/sprites/background-day.png', revision: '1' },
      { url: '/sprites/background-night.png', revision: '1' },
      { url: '/sprites/base.png', revision: '1' },
      { url: '/sprites/bluebird-downflap.png', revision: '1' },
      { url: '/sprites/bluebird-midflap.png', revision: '1' },
      { url: '/sprites/bluebird-upflap.png', revision: '1' },
      { url: '/sprites/gameover.png', revision: '1' },
      { url: '/sprites/message.png', revision: '1' },
      { url: '/sprites/pipe-green.png', revision: '1' },
      { url: '/sprites/pipe-red.png', revision: '1' },
      { url: '/sprites/redbird-downflap.png', revision: '1' },
      { url: '/sprites/redbird-midflap.png', revision: '1' },
      { url: '/sprites/redbird-upflap.png', revision: '1' },
      { url: '/sprites/Retry.png', revision: '1' },
      { url: '/sprites/yellowbird-downflap.png', revision: '1' },
      { url: '/sprites/yellowbird-midflap.png', revision: '1' },
      { url: '/sprites/yellowbird-upflap.png', revision: '1' },
      // Audio
      { url: '/audio/die.ogg', revision: '1' },
      { url: '/audio/die.wav', revision: '1' },
      { url: '/audio/hit.ogg', revision: '1' },
      { url: '/audio/hit.wav', revision: '1' },
      { url: '/audio/point.ogg', revision: '1' },
      { url: '/audio/point.wav', revision: '1' },
      { url: '/audio/swoosh.ogg', revision: '1' },
      { url: '/audio/swoosh.wav', revision: '1' },
      { url: '/audio/wing.ogg', revision: '1' },
      { url: '/audio/wing.wav', revision: '1' },
    ],
    runtimeCaching: [
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
  },
});
