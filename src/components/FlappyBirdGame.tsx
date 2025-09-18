"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  retry: HTMLImageElement;
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
      retry: loadImage("/sprites/Retry.png"),
    } satisfies SpriteMap;
  }, []);
  return sprites;
}

type Pipe = { x: number; top: number; passed: boolean };

export default function FlappyBirdGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<GameState>("menu");
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [high, setHigh] = useLocalStorage<number>("fb_highscore", 0);
  const highRef = useRef(0);
  const { play, unlock, prefetch } = useAudio();
  const sprites = useSprites();
  // keep refs in sync with state values for render-loop reads
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);
  useEffect(() => {
    highRef.current = high;
  }, [high]);

  // world state (not triggering re-renders every frame)
  const bird = useRef({ x: 64, y: WORLD_HEIGHT / 2, vy: 0, frame: 0 });
  const pipes = useRef<Pipe[]>([]);
  const baseOffset = useRef(0);
  const lastSpawn = useRef(0);
  const lastTime = useRef<number | null>(null);

  // input handling (added below after startGame/flap declarations)

  const startGame = useCallback(async () => {
    setScore(0);
    scoreRef.current = 0;
    bird.current = { x: 64, y: WORLD_HEIGHT / 2, vy: 0, frame: 0 };
    pipes.current = [];
    baseOffset.current = 0;
    lastSpawn.current = 0;
    lastTime.current = null;
    setState("playing");
    // prefetch frequently used sounds for the session
    prefetch(["wing", "point", "hit", "die", "swoosh"]).catch(() => {});
    play("swoosh", 0.5);
  }, [play, prefetch]);

  const flap = useCallback(() => {
    bird.current.vy = FLAP_VELOCITY;
    play("wing", 0.5);
  }, [play]);

  // input handling
  useEffect(() => {
    const handlePress = async () => {
      // ensure audio ready on first interaction
      await unlock();
      if (state === "menu") {
        await startGame();
      } else if (state === "playing") {
        flap();
      } else if (state === "gameover") {
        setState("menu");
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      void handlePress();
    };
    const onMouseDown = (_e: MouseEvent) => {
      void handlePress();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (["Space", "ArrowUp", "KeyW", " "].includes(e.code) || e.key === " ") {
        e.preventDefault();
        void handlePress();
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: false });
    window.addEventListener("mousedown", onMouseDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [state, unlock, startGame, flap]);

  function spawnPipe() {
    const margin = 40;
    const top = margin + Math.random() * (WORLD_HEIGHT - GROUND_HEIGHT - PIPE_GAP - margin * 2);
    pipes.current.push({ x: WORLD_WIDTH + 10, top, passed: false });
  }

  function resetToGameOver() {
    setState("gameover");
    play("die", 0.6);
    setHigh((h) => {
      const nh = Math.max(scoreRef.current, h);
      highRef.current = nh;
      return nh;
    });
  }

  // main loop
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Crisp pixel art
  ctx.imageSmoothingEnabled = false;

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
    const baseW = sprites.base.width || 336;
    baseOffset.current = (baseOffset.current + PIPE_SPEED * dt) % baseW;

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
    for (const p of pipes.current) {
      const gapTop = p.top;
      const gapBottom = p.top + PIPE_GAP;
      // top pipe rect
      const topRect = { x: p.x, y: -1000, w: 52, h: gapTop + 1000 };
      // bottom pipe rect
      const botRect = { x: p.x, y: gapBottom, w: 52, h: 1000 };
  const birdRect = { x: bird.current.x - 17, y: bird.current.y - 12, w: 34, h: 24 };
  if (rectsIntersect(birdRect, topRect) || rectsIntersect(birdRect, botRect)) {
        play("hit", 0.6);
        return resetToGameOver();
      }
  // trigger score as the bird crosses the pipe center for better audio sync
  if (!p.passed && p.x + 26 < bird.current.x) {
        p.passed = true;
        setScore((s) => {
          const ns = s + 1;
          scoreRef.current = ns;
          // update highscore immediately when surpassed
          if (ns > highRef.current) {
            highRef.current = ns;
            setHigh(ns);
          }
          return ns;
        });
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
    const baseW2 = sprites.base.width || 336;
    for (let x = -baseOffset.current; x < WORLD_WIDTH + baseW2; x += baseW2) {
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
      // Game over banner
      ctx.drawImage(sprites.gameover, WORLD_WIDTH / 2 - sprites.gameover.width / 2, 120);
      // Retry cue using dedicated Retry sprite, drawn smaller
      const retryY = 260;
      const retryScale = 0.2;
      const rw = (sprites.retry.width || 200) * retryScale;
      const rh = (sprites.retry.height || 60) * retryScale;
      const rx = WORLD_WIDTH / 2 - rw / 2;
      ctx.drawImage(sprites.retry, rx, retryY, rw, rh);
  // Current score appears centered above the retry sprite
  const digitScale = 1.2;
  const digitH = (sprites.digits[0]?.height || 24) * digitScale;
  const scoreY = retryY - digitH - 8;
  drawDigitsCentered(ctx, scoreRef.current, WORLD_WIDTH / 2, scoreY, sprites.digits, digitScale);
    }

    // score
    // current score (center top) using sprite digits (hide during gameover)
    if (state !== "gameover") {
      drawScore(ctx, scoreRef.current, WORLD_WIDTH / 2, 30, sprites.digits);
    }
  // Highscore is always shown at top-right
  drawSmallScore(ctx, highRef.current, WORLD_WIDTH - 10, 10, sprites.digits);
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

  function drawDigitsCentered(
    ctx: CanvasRenderingContext2D,
    value: number,
    centerX: number,
    y: number,
    digits: HTMLImageElement[],
    scale = 1
  ) {
    const s = String(Math.max(0, value | 0));
    let total = 0;
    for (let i = 0; i < s.length; i++) total += digits[+s[i]].width * scale + 2;
    total -= 2; // no trailing space
    let x = centerX - total / 2;
    for (let i = 0; i < s.length; i++) {
      const d = digits[+s[i]];
      ctx.drawImage(d, x, y, d.width * scale, d.height * scale);
      x += d.width * scale + 2;
    }
  }

  return (
    <div className="w-screen h-screen flex items-center justify-center touch-none select-none relative">
      <canvas ref={canvasRef} className="block rounded-xl shadow-lg bg-black" />
  {/* Menu UI removed: rely on sprite message.png with tap to start */}
  {/* Score is drawn on-canvas using digit sprites */}
  {/* GameOver UI removed; tap to return to menu */}
      <button className="sr-only" aria-label="hidden" />
    </div>
  );
}
