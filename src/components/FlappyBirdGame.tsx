"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useAudio } from "@/hooks/useAudio";

type SpriteMap = {
  bgDay: HTMLImageElement;
  bgNight: HTMLImageElement;
  base: HTMLImageElement;
  pipeGreen: HTMLImageElement;
  pipeRed: HTMLImageElement;
  birdUp: HTMLImageElement;
  birdMid: HTMLImageElement;
  birdDown: HTMLImageElement;
  digits: HTMLImageElement[];
  message: HTMLImageElement;
  gameover: HTMLImageElement;
};

type GameState = "menu" | "playing" | "gameover";

const GRAVITY = 1200; // px/s^2
const FLAP_VELOCITY = -320; // px/s
const PIPE_GAP = 140;
const PIPE_INTERVAL = 1500; // ms
const PIPE_SPEED = 120; // px/s
const GROUND_HEIGHT = 112; // matches sprite base height
const WORLD_WIDTH = 288; // base width for scaling
const WORLD_HEIGHT = 512; // base height for scaling

function loadImage(src: string) {
  const img = new Image();
  img.src = src;
  return img;
}

function useSprites(): SpriteMap {
  // preload once
  const sprites = useMemo(() => {
    return {
      bgDay: loadImage("/sprites/background-day.png"),
      bgNight: loadImage("/sprites/background-night.png"),
      base: loadImage("/sprites/base.png"),
      pipeGreen: loadImage("/sprites/pipe-green.png"),
      pipeRed: loadImage("/sprites/pipe-red.png"),
      birdUp: loadImage("/sprites/yellowbird-upflap.png"),
      birdMid: loadImage("/sprites/yellowbird-midflap.png"),
      birdDown: loadImage("/sprites/yellowbird-downflap.png"),
      digits: Array.from({ length: 10 }, (_, i) => loadImage(`/sprites/${i}.png`)),
      message: loadImage("/sprites/message.png"),
      gameover: loadImage("/sprites/gameover.png"),
    } satisfies SpriteMap;
  }, []);
  return sprites;
}

type Pipe = { x: number; top: number; passed: boolean };

export default function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<GameState>("menu");
  const [score, setScore] = useState(0);
  const [high, setHigh] = useLocalStorage<number>("fb_highscore", 0);
  const { play } = useAudio();
  const sprites = useSprites();

  // world state (not triggering re-renders every frame)
  const bird = useRef({ x: 64, y: WORLD_HEIGHT / 2, vy: 0, frame: 0 });
  const pipes = useRef<Pipe[]>([]);
  const baseOffset = useRef(0);
  const lastSpawn = useRef(0);
  const lastTime = useRef<number | null>(null);

  // input handling
  useEffect(() => {
    const onPress = (e: Event) => {
      e.preventDefault();
      if (state === "menu") {
        startGame();
      } else if (state === "playing") {
        flap();
      } else if (state === "gameover") {
        setState("menu");
      }
    };

    window.addEventListener("touchstart", onPress, { passive: false });
    window.addEventListener("mousedown", onPress);
    window.addEventListener("keydown", (e) => {
      if ([" ", "Spacebar", "ArrowUp", "KeyW"].includes((e as any).code) || e.key === " ") {
        onPress(e);
      }
    });
    return () => {
      window.removeEventListener("touchstart", onPress as any);
      window.removeEventListener("mousedown", onPress as any);
    };
  }, [state]);

  function startGame() {
    setScore(0);
    bird.current = { x: 64, y: WORLD_HEIGHT / 2, vy: 0, frame: 0 };
    pipes.current = [];
    baseOffset.current = 0;
    lastSpawn.current = 0;
    lastTime.current = null;
    setState("playing");
    play("swoosh", 0.5);
  }

  function flap() {
    bird.current.vy = FLAP_VELOCITY;
    play("wing", 0.5);
  }

  function spawnPipe() {
    const margin = 40;
    const top = margin + Math.random() * (WORLD_HEIGHT - GROUND_HEIGHT - PIPE_GAP - margin * 2);
    pipes.current.push({ x: WORLD_WIDTH + 10, top, passed: false });
  }

  function resetToGameOver() {
    setState("gameover");
    play("die", 0.6);
    setHigh((h) => (score > h ? score : h));
  }

  // main loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const onResize = () => {
      // Fit to screen while preserving aspect
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const scale = Math.min(vw / WORLD_WIDTH, vh / WORLD_HEIGHT);
      const w = Math.floor(WORLD_WIDTH * scale);
      const h = Math.floor(WORLD_HEIGHT * scale);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      canvas.width = Math.floor(WORLD_WIDTH * dpr);
      canvas.height = Math.floor(WORLD_HEIGHT * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    onResize();
    window.addEventListener("resize", onResize);

    const loop = (t: number) => {
      if (lastTime.current == null) lastTime.current = t;
      const dt = Math.min(33, t - lastTime.current) / 1000; // cap delta
      lastTime.current = t;

      update(dt);
      draw(ctx);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [state]);

  function update(dt: number) {
    // ground scroll
    baseOffset.current = (baseOffset.current + PIPE_SPEED * dt) % 48; // base tile width

    if (state !== "playing") return;

    // bird physics
    bird.current.vy += GRAVITY * dt;
    bird.current.y += bird.current.vy * dt;
    bird.current.frame = (bird.current.frame + dt * 10) % 3;

    // spawn pipes
    lastSpawn.current += dt * 1000;
    if (lastSpawn.current >= PIPE_INTERVAL) {
      lastSpawn.current = 0;
      spawnPipe();
    }

    // move pipes
    for (const p of pipes.current) {
      p.x -= PIPE_SPEED * dt;
    }
    // cleanup off-screen
    while (pipes.current.length && pipes.current[0].x < -52) {
      pipes.current.shift();
    }

    // scoring and collision
    const birdRect = { x: bird.current.x - 17, y: bird.current.y - 12, w: 34, h: 24 };
    for (const p of pipes.current) {
      const gapTop = p.top;
      const gapBottom = p.top + PIPE_GAP;
      // top pipe rect
      const topRect = { x: p.x, y: -1000, w: 52, h: gapTop + 1000 };
      // bottom pipe rect
      const botRect = { x: p.x, y: gapBottom, w: 52, h: 1000 };
      if (rectsIntersect(birdRect, topRect) || rectsIntersect(birdRect, botRect)) {
        play("hit", 0.6);
        return resetToGameOver();
      }
      if (!p.passed && p.x + 52 < bird.current.x) {
        p.passed = true;
        setScore((s) => s + 1);
        play("point", 0.6);
      }
    }

    // ground collision
    if (bird.current.y + 12 >= WORLD_HEIGHT - GROUND_HEIGHT) {
      return resetToGameOver();
    }
    // ceiling clamp
    if (bird.current.y - 12 < 0) {
      bird.current.y = 12;
      bird.current.vy = 0;
    }
  }

  function rectsIntersect(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function draw(ctx: CanvasRenderingContext2D) {
    // background (day)
    ctx.drawImage(sprites.bgDay, 0, 0);

    // pipes
    for (const p of pipes.current) {
      // top pipe flipped
      ctx.save();
      ctx.translate(p.x + 26, 0);
      ctx.scale(1, -1);
      ctx.drawImage(sprites.pipeGreen, -26, -(p.top));
      ctx.restore();

      // bottom pipe
      ctx.drawImage(sprites.pipeGreen, p.x, p.top + PIPE_GAP);
    }

    // ground/base repeats at bottom
    const baseY = WORLD_HEIGHT - GROUND_HEIGHT;
    for (let x = -baseOffset.current; x < WORLD_WIDTH + 48; x += 48) {
      ctx.drawImage(sprites.base, x, baseY);
    }

    // bird animation
    const frame = Math.floor(bird.current.frame);
    const birdSprite = frame === 0 ? sprites.birdUp : frame === 1 ? sprites.birdMid : sprites.birdDown;
    ctx.save();
    const rot = Math.max(-0.35, Math.min(0.7, bird.current.vy / 400));
    ctx.translate(bird.current.x, bird.current.y);
    ctx.rotate(rot);
    ctx.drawImage(birdSprite, -17, -12);
    ctx.restore();

    // overlays
    if (state === "menu") {
      ctx.drawImage(sprites.message, WORLD_WIDTH / 2 - sprites.message.width / 2, 80);
    }
    if (state === "gameover") {
      ctx.drawImage(sprites.gameover, WORLD_WIDTH / 2 - sprites.gameover.width / 2, 120);
    }

    // score
    drawScore(ctx, score, WORLD_WIDTH / 2, 30, sprites.digits);
    // highscore small at top-right
    drawSmallScore(ctx, high, WORLD_WIDTH - 10, 10, sprites.digits);
  }

  function drawScore(
    ctx: CanvasRenderingContext2D,
    value: number,
    centerX: number,
    y: number,
    digits: HTMLImageElement[]
  ) {
    const s = String(value);
    let width = 0;
    for (const ch of s) width += digits[+ch].width + 2;
    let x = centerX - width / 2;
    for (const ch of s) {
      const d = digits[+ch];
      ctx.drawImage(d, x, y);
      x += d.width + 2;
    }
  }

  function drawSmallScore(
    ctx: CanvasRenderingContext2D,
    value: number,
    right: number,
    top: number,
    digits: HTMLImageElement[]
  ) {
    const s = String(value);
    let x = right;
    for (let i = s.length - 1; i >= 0; i--) {
      const d = digits[+s[i]];
      x -= d.width * 0.6;
      ctx.drawImage(d, x, top, d.width * 0.6, d.height * 0.6);
      x -= 2;
    }
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center touch-none select-none">
      <canvas ref={canvasRef} className="block rounded-xl shadow-lg bg-black" />
      {/* Tap/Click hint overlay for accessibility */}
      <button
        className="sr-only"
        aria-label={state === "menu" ? "Start game" : state === "playing" ? "Flap" : "Back to menu"}
        onClick={() => {
          if (state === "menu") startGame();
          else if (state === "playing") flap();
          else setState("menu");
        }}
      />
    </div>
  );
}
