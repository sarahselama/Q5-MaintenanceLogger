# Deluxe Holiday Homes™ — Maintenance Issue Logger

A production-grade internal portal for submitting and managing property maintenance requests, built precisely to the **Deluxe Holiday Homes** brand design system.

## 🚀 Live Demo

**[q5-maintenance-logger.vercel.app](https://q5-maintenance-logger.vercel.app/)**

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS (Custom DLH Design System) |
| Icons | Lucide React |
| Backend | Supabase (PostgreSQL + JSONB + Storage) |
| Deployment | Vercel |

## ✨ Features

### Submission Form (`/`)
- **Real-time `onBlur` field validation** — errors appear as you leave each field, not just on submit
- **Regex phone number validation** — optional field, but format-enforced when filled
- **Multi-image upload** — up to 3 photos per ticket, stored in Supabase Storage
- **Auto-incrementing ticket IDs** — sequential `MNT-0001`, `MNT-0002`, etc.
- **Mandatory unit number** — prevents ambiguous submissions across large properties
- **Dark mode** — preference persisted across sessions via `localStorage`

### Admin Dashboard (`/dashboard`)
- **Sortable columns** — click any header to sort ascending/descending
- **Global search** — queries ticket ID, property, category, description, reporter, and unit
- **Filter by property or urgency** — combinable dropdowns
- **Inline editable internal notes** — click any row's notes cell to edit; auto-saves to DB on confirm
- **Interactive photo lightbox** — prev/next navigation, dot indicators, keyboard arrow + Esc support
- **Live status updates** — status dropdown persists changes to Supabase instantly
- **CSV Export** — all visible (filtered/sorted) rows exported as `MaintenanceReport_DDMMYYYY.csv`
  - Cross-browser safe (works on Chrome localhost and HTTPS)
  - UTF-8 BOM encoded for native Excel/Numbers/Google Sheets compatibility
  - Clean `Image 1 / Image 2` photo labels with attached URLs

## 🗄️ Supabase Schema

Run this in your Supabase SQL Editor:

```sql
create table maintenance_issues (
  id            uuid        primary key default gen_random_uuid(),
  ticket_number text        unique not null,
  property_name text        not null,
  unit_number   text        not null,
  issue_category text       not null,
  urgency       text        not null,
  description   text        not null,
  reporter_name text        not null,
  reporter_phone text,
  access_time   text,
  photos        jsonb       default '[]'::jsonb,
  notes         text,
  status        text        default 'Open',
  submitted_at  timestamptz default now()
);

alter table maintenance_issues enable row level security;
create policy "Allow public insert" on maintenance_issues for insert with check (true);
create policy "Allow public select" on maintenance_issues for select using (true);
create policy "Allow public update" on maintenance_issues for update  using (true);
```

> **Storage:** Create a public bucket named `uploads` in Supabase Storage.

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# Add your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

# 3. Start dev server
npm run dev
```

## 🌐 Deploy to Vercel

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. In **Settings → Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

> **Tip:** The Vercel × Supabase native integration auto-injects `SUPABASE_URL` and `SUPABASE_ANON_KEY`. The `vite.config.js` bridges these to the required `VITE_` prefix automatically — no manual copy-pasting of secrets needed.
