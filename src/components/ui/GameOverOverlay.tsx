"use client";

type Props = { score: number; highscore: number; onRestart: () => void };

export default function GameOverOverlay({ score, highscore, onRestart }: Props) {
  return (
    <div className="absolute inset-0 grid place-items-center pointer-events-none">
      <div className="flex flex-col items-center gap-3 pointer-events-auto">
        <div className="text-3xl font-bold">Game Over</div>
        <div className="text-white/90">Score: {score}</div>
        <div className="text-white/90">High: {highscore}</div>
        <button
          className="px-6 py-3 rounded-lg bg-rose-500 text-white font-semibold active:scale-95 transition"
          onClick={onRestart}
        >
          Retry
        </button>
      </div>
    </div>
  );
}
