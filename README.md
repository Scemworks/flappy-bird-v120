# Flappy Bird (Next.js)

A mobile-first Flappy Bird clone built with Next.js App Router and canvas. Uses sprites and audio from the `public/` folder.

## Features
- Mobile-friendly (tap to flap). Desktop: Space/ArrowUp/W to flap, click also works.
- Pixel-perfect scaling to fit phones, tablets, and desktops.
- Menu, HUD, and Game Over overlays.
- LocalStorage highscore persistence.
- Smooth SFX via small audio pools.

## Run locally

```sh
# install deps (choose one)
pnpm install  # if available
# or
npm install

# dev
npm run dev

# build
npm run build
npm start
```

## Controls
- Mobile: tap anywhere to start/flap.
- Desktop: click or press Space / ArrowUp / W.

## Assets
All sprites and sounds are in `public/`. Filenames must match the ones referenced in code.

## Notes
- The game uses a fixed internal world size (288x512) and scales to your screen.
- Highscore is saved under the key `fb_highscore` in localStorage.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
