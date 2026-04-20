# NEURAL SYSTEM AUDIT: Smart Notes Intelligence Suite (v15.0.3-PRODUCTION-STABLE)

This document serves as the absolute source of truth for the **Smart Notes Neural Suite**. It is designed for both human architects and non-visual AI agents to understand the system's structural dominoes, data flows, and governance protocols.

## 🧬 Core Technology Stack
- **Framework**: Next.js 16.2.3 (Turbopack Powered / Fast Open SSR Enabled)
- **Styling**: Vanilla CSS + Tailwind CSS (Hardened with 10px baseline)
- **Runtime**: Edge Runtime (Discovery Hub) | Node.js (Dashboard)
- **Database**: Supabase (PostgreSQL) + Real-time RLS Protocols
- **Editor Engine**: Custom TipTap Implementation (Neural Suite v15.0.3 - Deduplicated)
- **Animations**: Framer Motion (Cubic-Bezier 0.4, 0, 0.2, 1)

## 📂 Structural Intelligence Graph (Hardened)
- `/app`: Global Routing Matrix
    - `(dashboard)`: Authenticated Workspace (Notes, Books, Discovery Hub) via `DashboardSkeleton.tsx` Fast Open SSR
    - `admin`: Master Intelligence Dashboard (AiMaster)
    - `s`: Shared Neural Uplinks (Public view of shared notes)
- `/components`: Modular UI Components
    - `dashboard`: Navigation, Sidebar, HeaderHub (Unified Toolbelt)
    - `notes`: High-density TipTap Editor with Unified Action Footer
    - `discovery`: Community Feed and Recommendation Clusters
    - `auth`: AdGuard (Zero-Block Deferred Protocol) & Safe Sync
- `/lib`: Logic Hub (Supabase Clients, Formatting, AI Prompts)

## 📡 Data & State Governance
### 1. Database Schema (Supabase)
- `notes`: Primary user data. Tracks `id`, `user_id`, `title`, `content` (JSON), `is_shared`, `is_discoverable`, `is_archived`.
- `discovery_notes`: Public registry for the Discovery Hub. Synchronized when `is_discoverable` toggles.
- `book-storage`: Specialized cluster for multi-chapter manuscript storage.
- `note_ratings`: Neural weights for Discovery ranking.
- `ai_logs`: Immutable logs of AI audit actions.

### 2. Performance & Delivery Protocols (v15.0.3)
- **Fast Open SSR Render**: Dashboard structure delivers instantaneously via `DashboardSkeleton.tsx` for zero initial load delay.
- **Append-Only Safe Sync**: Guest local storage synchronization is delayed by 1 minute and operates securely by purely inserting (adding) records to the cloud without automated overwrites or deletions.
- **PayPal Structural Integrity**: PayPal gateway uses a dedicated `block` container to prevent layout squashing, ensuring horizontal button rendering across all viewports.
- **Zero-Block Load**: The "Support Developer" blocker is **Strictly Deferred**.

## 🎨 UI/UX Interaction Models (Hardened)
- **Mobile Card Ergonomics**: Maximized card width on small viewports by removing ornamental borders and reducing lateral paddings (px-0 on mobile).
- **Sidebar Alignment**: Supports "Shrink Mode" (80px icon-only). Enforces absolute centering via `justify-center`.
- **Zero-Warning Console**: All TipTap duplicate extension warnings and Dialog accessibility (ARIA) warnings have been resolved for a professional production log.

## 🔐 Privacy & Security
- **Global Neural Auth Bus**: Strictly centralizes `supabase.auth` execution within `hooks/useAuth.ts`, eradicating `AbortError: Lock broken` console loops.
- **RLS Policies**: Enforce strict data isolation; users only modify their own intelligence nodes.
- **Public Discovery**: Sitemap (`sitemap.xml`) exclusively indexes nodes where `is_discoverable = true`.

---
*Audit Sealed: 2026-04-18T23:05Z (Final Production Sustainable Build v15.0.3)*
*Sign-off: Neural Architect Antigravity (Protocols SEALED)*
