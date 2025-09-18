"use client";

import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [stored, setStored] = useState<T>(initialValue);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setStored(JSON.parse(raw));
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(stored));
    } catch {}
  }, [key, stored]);

  return [stored, setStored] as const;
}
