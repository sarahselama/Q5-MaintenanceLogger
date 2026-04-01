# Deluxe Holiday Homes™ — Maintenance Issue Logger

A production-grade, highly elevated internal portal for submitting and managing property maintenance requests, built precisely to the Deluxe Holiday Homes brand aesthetic.

## 🚀 Live Demo
[Insert Vercel Link Here]

## 🛠️ Tech Stack
- **Frontend:** React 18 + Vite
- **Styling:** Tailwind CSS (Custom Deluxe Holiday Homes Design System)
- **Icons:** Lucide React
- **Backend & Database:** Supabase (PostgreSQL + native JSONB arrays + Storage)

## ✨ Key Features
- **Luxurious UI/UX:** Perfectly adheres to the brand's design system, utilizing the `Navy (#2d3666)` and `Cyan (#4ab9e6)` primary palette with elevated floating cards, plush form inputs, and smooth micro-animations.
- **Robust Issue Submission:** 
  - Mandatory field handling with real-time `onBlur` visual validation.
  - Regex-enforced phone number formatting.
  - Multi-file image uploads (up to 3 images per ticket) processed natively through Supabase Storage.
  - Auto-generated, human-readable unique ticket sequences (e.g., `MNT-0042`).
- **Comprehensive Dashboard:**
  - Real-time tabular data fetching with ascending/descending column sorting and global query search.
  - Filter by precise Property Name or Urgency Level.
  - **Click-to-edit** inline internal notes functionality (auto-saves instantly to the database).
  - Built-in interactive photo lightbox gallery for viewing attached issue visuals with keyboard navigation.
  - One-click multi-column **CSV Exports**, engineered to be perfectly cross-browser compatible (including Chrome localhost restrictions) and natively decodable in Excel/Numbers/Google Sheets via UTF-8 BOM encoding.

## 🗄️ Supabase Setup & Schema

Run this SQL in your Supabase SQL Editor to generate the schema exactly as it expects it:

```sql
-- Create the maintenance issues table
create table maintenance_issues (
  id uuid primary key default gen_random_uuid(),
  ticket_number text unique not null,
  property_name text not null,
  unit_number text not null,
  issue_category text not null,
  urgency text not null,
  description text not null,
  reporter_name text not null,
  reporter_phone text,
  access_time text,
  photos jsonb default '[]'::jsonb,
  notes text,
  status text default 'Open',
  submitted_at timestamptz default now()
);

-- Note: Ensure you have a public storage bucket named 'uploads' configured in Supabase.

-- Enable basic RLS
alter table maintenance_issues enable row level security;
create policy "Allow public insert" on maintenance_issues for insert with check (true);
create policy "Allow public select" on maintenance_issues for select using (true);
create policy "Allow public update" on maintenance_issues for update using (true);
```

## 💻 Local Development

1. **Install dependencies:**
```bash
npm install
```

2. **Configure Environment:**
Create a `.env.local` file in the root directory and add your Supabase credentials:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Run the development server:**
```bash
npm run dev
```

## 🌐 Deploying to Vercel
1. Push your repository to GitHub.
2. Import the project within your Vercel dashboard.
3. Crucial: Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your Vercel Environment Variables before building.
4. Deploy!
