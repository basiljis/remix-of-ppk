# Project Memory

## Core
- Educational platform "universum." (unvrsm.ru) on Node 20 & Supabase.
- Vite build requires `NODE_OPTIONS='--max-old-space-size=4096'` or 2GB swap.
- Mobile UI: iOS-style bottom bar; respect safe zones (`pb-safe`).
- Use `lazyWithRetry` & error boundaries (max 1 reload per 10s).
- Active tabs must persist in URL query parameters (e.g., `?tab=name`).
- PDFs must use `jsPDF` with Base64 Roboto fonts for Cyrillic support.
- Safari SEO: inject JSON-LD via individual `<script>` tags, not arrays.
- On-premise installations support Ubuntu/Astra Linux, Docker, PostgreSQL.

## Memories
- [Supabase Proxy & Timeweb Deployment](mem://infrastructure/supabase-proxy-timeweb) — Bypassing Supabase blocks in Russia and Timeweb Cloud setup.
