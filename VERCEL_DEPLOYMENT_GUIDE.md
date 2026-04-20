# Vercel Deployment Guide (v9.3.1-STABLE)

This project is fully optimized and **Production-Hardened** for Vercel. With the **v9.3.1 Stable Hardening** phase, the application features ultra-fast Turbopack builds (18.6s) and optimized ISR for global performance.

## 🚀 Step 1: Initialize Vercel
1.  **Connect Repo**: Go to [vercel.com](https://vercel.com) and import the repository.
2.  **Build Settings**:
    - **Build Command**: `npm run build`
    - **Output Directory**: `.next` (Default)
    - **Install Command**: `npm install --legacy-peer-deps`
3.  **Environment Variables**:
    Copy all keys from specialized `.env` including:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SERVICE_ROLE_KEY`
    - `NEXT_PUBLIC_OPENAI_API_KEY`
    - `DOKU_CLIENT_ID` / `DOKU_SECRET_KEY`

## 📦 Step 2: Push to Vercel
Every push to your `main` branch automatically triggers the v9.3.1 Hardened Build sequence.

## ❓ FAQ

### Why Vercel for v9.3.1?
Our **Protocol BUFF** and **Neural Media** architectures require the high-performance edge execution provided by Vercel. The 18.6s build time verified in v9.3.1 ensures rapid deployment cycles for intelligence updates.

### Should I remove Cloudflare files?
**No**. Maintain the **Hybrid-Cloud** architecture as a fail-safe. Wrangler configurations are preserved for Enterprise-grade secondary routing.

---
*Hardened by Antigravity v9.3.1*
