# AI-Powered CRM

A lightweight, full-stack CRM built for a small business — designed to replace messy spreadsheets with a clean, centralised system for managing contacts, deals, and tasks.

Built with Claude Code as part of learning AI-assisted development.

---

## Features

- **Companies** — track all client and prospect companies with industry and size segmentation
- **Contacts** — manage decision makers with linked companies, notes, and lead source tracking
- **Pipeline** — kanban board with drag-and-drop deal management across 7 stages
- **Tasks** — priority-grouped task list with due dates, overdue indicators, and entity linking
- **Activity Log** — reverse-chronological feed of every action across the system
- **Global Search** — Cmd+K search across companies, contacts, and deals
- **CSV Import** — bulk import contacts and companies with column mapping and deduplication
- **Auth** — email/password login with protected routes

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth |
| Drag and drop | @dnd-kit/core |
| CSV parsing | papaparse |
| State management | Zustand |
| Icons | Lucide React |

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/crm.git
cd crm
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env.local` file in the root and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Set up the database
Run the schema file in your Supabase SQL editor:
```
supabase/schema.sql
```

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---


