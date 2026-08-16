---
name: Supabase Proxy & Timeweb Deployment
description: Complete guide for bypassing Supabase blocks in Russia via Nginx reverse proxy and deploying to Timeweb Cloud Apps.
type: reference
---

# Supabase Proxy & Timeweb Deployment Guide

This document summarizes the infrastructure setup for **unvrsm.ru** to bypass Supabase connectivity issues in Russia and ensure stable deployment on Timeweb Cloud.

## 1. Architecture
- **Domain Strategy**: Browser connects only to `unvrsm.ru` (SPA) and `api.unvrsm.ru` (Proxy).
- **Edge Layer**: `edge` container (Nginx) on port `8082` (exposed to Timeweb). It handles health checks and serves `maintenance.html` during `app` updates.
- **App Layer**: `app` container (Nginx + Vite SPA) listening on port `8080` (internal).
- **Reverse Proxy**: `app` container proxies `api.unvrsm.ru` requests to `<project-ref>.supabase.co`.

## 2. Key Components

### Environment (`.env`)
- `VITE_SUPABASE_URL=https://api.unvrsm.ru`
- `VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>`

### Nginx Configuration (`nginx.conf`)
- **Resolver**: Required for dynamic IP resolution of Supabase (`resolver 8.8.8.8 1.1.1.1 valid=300s`).
- **SNI**: Must be enabled (`proxy_ssl_server_name on; proxy_ssl_name <ref>.supabase.co`).
- **CORS**: Original Supabase CORS headers must be hidden (`proxy_hide_header Access-Control-Allow-Origin`) and replaced with custom ones allowing `unvrsm.ru` and `localhost`.
- **WebSockets**: Support for Supabase Realtime via `Upgrade` and `Connection` headers.

### Deployment (Timeweb Cloud Apps)
- **External Port**: Must be mapped to **8082** (the `edge` service).
- **Domains**: Map both `unvrsm.ru` and `api.unvrsm.ru` to the app's IP.
- **SSL**: Enable Let's Encrypt for **both** domains.
- **Health Check**: `GET /__edge_health`.

## 3. Maintenance Mode
- The `edge` service intercepts `502/503/504` errors from `app` and shows `maintenance.html`.
- Manual control via flag file: `docker exec <edge> touch /etc/nginx/flags/maintenance.enabled`.

## 4. Verification Checklist
1. `curl -s https://unvrsm.ru/__edge_health` -> `ok`.
2. `curl -sI https://api.unvrsm.ru/auth/v1/health` -> `200 OK`.
3. Check CORS preflight: `OPTIONS` to `api.unvrsm.ru` should return `204` with one `Access-Control-Allow-Origin`.

Detailed instruction file: `docs/SUPABASE_PROXY_DEPLOY_GUIDE.md`
