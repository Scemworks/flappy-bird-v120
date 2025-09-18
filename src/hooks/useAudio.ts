"use client";

type SoundKey =
  | "die"
  | "hit"
  | "point"
  | "swoosh"
  | "wing";

const exts = [".ogg", ".wav"]; // prefer ogg then wav

function createAudioPool(srcBase: string, size = 4) {
  const pool = Array.from({ length: size }, () => {
    const a = new Audio();
    // choose first extension; most browsers will handle
    a.src = srcBase + exts[0];
    a.preload = "auto";
    return a;
  });
  let idx = 0;
  return {
    next() {
      const a = pool[idx];
      idx = (idx + 1) % pool.length;
      return a;
    },
  } as const;
}

export function useAudio() {
  const base = "/audio/";
  const pools: Record<SoundKey, ReturnType<typeof createAudioPool>> = {
    die: createAudioPool(base + "die"),
    hit: createAudioPool(base + "hit"),
    point: createAudioPool(base + "point"),
    swoosh: createAudioPool(base + "swoosh"),
    wing: createAudioPool(base + "wing"),
  };

  const play = (key: SoundKey, volume = 1) => {
    const a = pools[key].next();
    a.volume = volume;
    try {
      a.currentTime = 0;
    } catch {}
    a.play().catch(() => {});
  };

  return { play } as const;
}
