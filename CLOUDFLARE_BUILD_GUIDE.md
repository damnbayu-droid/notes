# Cloudflare Pages Build Guide (v9.3.1-STABLE)

This guide contains the requirements for deploying the **Hardened Smart Notes Intelligence Suite** to Cloudflare Pages.

## 🛠️ Build Configuration

| Setting | Value |
|:---|:---|
| **Build Command** | `npm run pages:build` |
| **Build Output Directory** | `.vercel/output/static` |
| **Compatibility Date** | `2024-04-01` (or newer) |
| **Compatibility Flags** | `nodejs_compat` |

## 🏗️ Architecture: Protocol BUFF & Neural-Media
The **v9.3.1** migration ensures that even on distributed edge nodes, data integrity is preserved via the **Black-Box Recovery** Fail-Safe.

> [!CAUTION]
> **3 MiB SIZE LIMIT (Free Tier)**: Cloudflare Free Plan restricts edge functions to 3 MiB.
> Current project size: **~19.9 MiB**.
> **Status**: Deployment to Cloudflare Free remains **Blocked**. Use **Vercel** or **Cloudflare Paid Plan** ($5/mo) for successful distribution of this high-fidelity intelligence hub.

## 🔑 Environment Variables & Secrets
Secure synchronization requires the following secrets in the Cloudflare Dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
*   `NEXT_PUBLIC_SUPABASE_ANON_KEY`
*   `SERVICE_ROLE_KEY` (Required for Administrative Matrix)
*   `NEXT_PUBLIC_OPENAI_API_KEY`

## 🏗️ Version History & Hardening
- **v9.3.1**: Production Stability, Build Optimization (18.6s), Privacy-First Indexing.
- **v9.3.0**: **Protocol BUFF** (Black-Box Recovery fail-safe).
- **v7.7.0**: Neural Media Processor (WebP + Storage).
- **v7.6.2**: Neural Perfect & Data Integrity Buff.

---
*Created by Antigravity v9.3.1 Autonomous Hardening System*
