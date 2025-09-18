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
