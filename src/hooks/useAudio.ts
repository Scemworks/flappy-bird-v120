"use client";

type SoundKey = "die" | "hit" | "point" | "swoosh" | "wing";

const exts = [".ogg", ".wav"]; // try ogg first, then wav
const BASE = "/audio/";

let ctx: AudioContext | null = null;
let unlocked = false;
const buffers = new Map<string, AudioBuffer | "loading" | "error">();

function ensureCtx() {
  if (typeof window === "undefined") return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!ctx && AC) ctx = new AC();
  return ctx;
}

async function loadBuffer(key: SoundKey): Promise<AudioBuffer | null> {
  if (!ensureCtx()) return null;
  const existing = buffers.get(key);
  if (existing && existing !== "loading" && existing !== "error") return existing;
  if (existing === "loading") {
    // wait briefly for ongoing load
    await new Promise((r) => setTimeout(r, 10));
    const again = buffers.get(key);
    return again && again !== "loading" && again !== "error" ? again : null;
  }
  buffers.set(key, "loading");
  for (const ext of exts) {
    try {
      const res = await fetch(BASE + key + ext);
      if (!res.ok) continue;
      const arr = await res.arrayBuffer();
      const decoded = await ctx!.decodeAudioData(arr);
      buffers.set(key, decoded);
      return decoded;
    } catch {
      // try next ext
    }
  }
  buffers.set(key, "error");
  return null;
}

function htmlAudioFallback() {
  const pools: Record<SoundKey, HTMLAudioElement[]> = {
    die: [],
    hit: [],
    point: [],
    swoosh: [],
    wing: [],
  };
  const size = 4;
  (Object.keys(pools) as SoundKey[]).forEach((k) => {
    pools[k] = Array.from({ length: size }, () => {
      const a = new Audio(BASE + k + exts[0]);
      a.preload = "auto";
      return a;
    });
  });
  const idx: Record<SoundKey, number> = { die: 0, hit: 0, point: 0, swoosh: 0, wing: 0 };
  return {
    play(key: SoundKey, volume = 1) {
      const list = pools[key];
      const a = list[idx[key]];
      idx[key] = (idx[key] + 1) % list.length;
      a.volume = volume;
      try {
        a.currentTime = 0;
      } catch {}
      a.play().catch(() => {});
    },
  } as const;
}

const fallback = htmlAudioFallback();

export function useAudio() {
  async function unlock() {
    const c = ensureCtx();
    if (!c) return; // will use fallback
    if (c.state === "suspended") {
      try {
        await c.resume();
      } catch {
        // ignore
      }
    }
    unlocked = true;
  }

  async function prefetch(keys: SoundKey[]) {
    if (!ensureCtx()) return; // no-op if no WebAudio
    await Promise.all(keys.map((k) => loadBuffer(k)));
  }

  async function play(key: SoundKey, volume = 1) {
    const c = ensureCtx();
    if (!c) return fallback.play(key, volume);
    if (!unlocked) await unlock();
    const buf = await loadBuffer(key);
    if (!buf) return fallback.play(key, volume);
    const src = c.createBufferSource();
    src.buffer = buf;
    const gain = c.createGain();
    gain.gain.value = volume;
    src.connect(gain).connect(c.destination);
    try {
      src.start();
    } catch {
      // swallow
    }
  }

  return { play, unlock, prefetch } as const;
}
