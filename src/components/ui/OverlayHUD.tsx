"use client";

type Props = { score: number };

export default function OverlayHUD({ score }: Props) {
  return (
    <div className="absolute top-0 inset-x-0 p-3 flex items-center justify-center pointer-events-none">
      <div className="px-3 py-1 rounded bg-black/30 text-white text-lg font-bold">
        Score: {score}
      </div>
    </div>
  );
}
