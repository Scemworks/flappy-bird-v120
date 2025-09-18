"use client";

type Props = { onStart: () => void; highscore: number };

export default function MainMenu({ onStart, highscore }: Props) {
  return (
    <div className="absolute inset-0 grid place-items-center pointer-events-none">
      <div className="flex flex-col items-center gap-3 pointer-events-auto">
        <h1 className="text-3xl font-bold drop-shadow">Flappy Bird</h1>
        <button
          className="px-6 py-3 rounded-lg bg-emerald-500 text-white font-semibold active:scale-95 transition"
          onClick={onStart}
        >
          Tap to Start
        </button>
        <p className="text-sm text-white/80">Highscore: {highscore}</p>
      </div>
    </div>
  );
}
