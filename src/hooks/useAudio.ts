"use client";

type SoundKey =
  | "die"
  | "hit"
  | "point"
  | "swoosh"
  | "wing";

const exts = [".ogg", ".wav"]; // try ogg first then wav

function makePool(srcs: string[], size = 4) {
  const pool = Array.from({ length: size }, () => new Audio());
  let i = 0;
  const next = () => {
    const a = pool[i];
    i = (i + 1) % pool.length;
    return a;
  };
  const setSrc = (el: HTMLAudioElement, base: string) => {
    // pick the first source that can play
    for (const s of srcs) {
      el.src = base + s;
      break; // browser can pick format automatically in most cases from file extension
    }
  };
  return { next, setSrc };
}

export function useAudio() {
  const base = "/audio/";
  const play = (key: SoundKey, volume = 1) => {
    const { next, setSrc } = makePool(exts);
    const a = next();
    setSrc(a, base + key);
    a.volume = volume;
    a.currentTime = 0;
    a.play().catch(() => {});
  };
  return { play } as const;
}
