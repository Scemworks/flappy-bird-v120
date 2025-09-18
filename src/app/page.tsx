"use client";

import dynamic from "next/dynamic";

const FlappyBirdGame = dynamic(() => import("@/components/FlappyBirdGame"), {
  ssr: false,
});

export default function Home() {
  return <FlappyBirdGame />;
}
