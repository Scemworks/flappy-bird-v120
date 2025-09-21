#!/usr/bin/env bash
# Simple local server to test the built Next.js public files and service worker
set -e
cd "$(dirname "${BASH_SOURCE[0]}")/.."
if command -v pnpm >/dev/null 2>&1 && pnpm -v >/dev/null 2>&1; then
  if pnpm -v >/dev/null 2>&1 && pnpm exec --help >/dev/null 2>&1; then
    if pnpm exec serve --version >/dev/null 2>&1 2>/dev/null; then
      pnpm exec serve ./ -l 3000
    else
      if command -v npx >/dev/null 2>&1; then
        npx serve ./ -l 3000
      else
        python3 -m http.server 3000
      fi
    fi
  else
    python3 -m http.server 3000
  fi
else
  if command -v npx >/dev/null 2>&1; then
    npx serve ./ -l 3000
  else
    python3 -m http.server 3000
  fi
fi
