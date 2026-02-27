# SMART_NOTES_COMPREHENSIVE_REPORT

*This is a continuous, living document detailing the architecture, state, and features of the Smart Notes application. Each entry is timestamped to track changes and audits over time.*

---

## [Audit Log] - 2026-02-28 00:37:18

### 1. Application Overview
**Smart Notes** is a modern, offline-first notes, scheduling, and document management application. It is tailored for high performance, accessibility, and robust cloud synchronization, featuring a sleek user interface and AI integration.

### 2. Technology Stack
* **Frontend Framework**: React 19.2.0, TypeScript, built with Vite.
* **Styling**: Tailwind CSS v3.4 (with customized CSS variables for theming), `tailwindcss-animate`, `tw-animate-css`.
* **UI Components**: Radix UI (Headless accessible primitives like Accordion, Dialog, Dropdown Menu, etc.), `lucide-react` for icons.
* **Routing**: `react-router-dom` v7.13.
* **State Management**: Complex custom React Hooks targeting local component state augmented with `localStorage` and `idb` for persistence.
* **Backend & Authentication**: Supabase (PostgreSQL database, Edge Functions, Auth, Storage).
* **AI & Machine Learning**: `openai` v6.22 integration (Likely for document processing/summarization and a dedicated AI Assistant).
* **Extended Capabilities**: `pdf-lib` (PDF manipulation), `react-webcam` (scanner), `react-signature-canvas` (signing notes/documents), `browser-image-compression`.

### 3. Architecture & Project Structure
The application adopts a feature-based folder structure within `src`:
* **`/src/components/layout`**: Core shells - `Dashboard`, `Sidebar`, `Header`, and `SettingsPage`.
* **`/src/components/notes`**: Main functional views - `NotesGrid`, `NoteEditor`, `SearchBar`, etc.
* **`/src/components/auth`**: `AuthPage` and `GuestNagModal`.
* **`/src/hooks`**: Custom data fetching and sync logic. Notably, `useNotes.ts` handles the optimistic UI updates and a robust offline-first synchronization queue.
* **`/src/lib`**: API clients and utilities (`supabase.ts`, `openai.ts`, `googleDrive.ts`, `idb.ts`, `trash.ts`).
* **Root Configuration**: `vite.config.ts` incorporates automated chunk splitting for performance (separating UI, logic, Supabase, AI into distinct chunks). `tailwind.config.js` sets up extensive dark mode and fluid animation parameters.

### 4. Core Workflows & Logic
#### Offline-First Synchronization (`useNotes.ts`)
* Implements an action queue (`syncQueue`) stored in `localStorage`.
* When the user's connection status is `offline`, CRUD operations (Create, Update, Delete) are pushed to the queue and instantly reflected on the UI (Optimistic Updates).
* Once the device regains connection, the queue sequentially processes operations against the Supabase database.
* The state manages note pinning, archiving, tags filtering, folder management, and trash.

#### Authentication & User State
* `App.tsx` guards the application load and handles rendering either `AuthPage` or `Dashboard`.
* Non-authenticated users enter Guest mode, supported by local storage. They can save notes locally but are occasionally prompted by `GuestNagModal` to sign up for cloud sync.
* Supports Email/Password and Google OAuth via Supabase Auth.

#### Database Lifecycle & Edge rules (`supabase_lifecycle.sql`)
* Contains trigger definitions and PostgreSQL schemas for automated housekeeping.
* **Avatar Cleanup**: Auto-deletes old profile picture objects in storage when a user updates their avatar.
* **Trash Cleanup**: Cron job (`pg_cron`) setup to automatically permanently delete notes sitting in the 'Trash' folder for more than 30 days.
* **Account Pruning**: Defined logic for notifying inactive users after 1 month and wiping accounts mathematically dormant for 3 months to save space and comply with data retention.

### 5. Advanced Features
* **AI Assistant**: Accessible from the main UI, backed by OpenAI prompts.
* **PDF / Scanner Page**: Integrations indicating the ability to scan documents (via webcam/device camera) and manipulate PDFs natively in the browser.
* **Books & Scheduling**: Specialized layouts indicating expansion beyond bare text notes, likely featuring calendar or kanban modules (`@radix-ui/react-tabs`, `schedule` components).
* **Reminders**: Built-in polling mechanism (runs every 10 seconds via `App.tsx`) testing note reminder dates and emitting desktop/browser notifications.

### 6. Security & Environment
* Critical API tokens stored in `.env` (excluded from git): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_OPENAI_API_KEY`, etc.
* Row Level Security (RLS) is expected to be configured on the Supabase side restricting users to interact solely with explicit matching `user_id` notes.

---
