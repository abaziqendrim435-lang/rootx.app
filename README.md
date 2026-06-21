# RootX — AI Agent Marketplace

> Modern AI Agent Marketplace built with Next.js 16, TypeScript, Tailwind CSS v4, and Supabase.

## 🚀 Quick Start (Run Locally)

### Step 1 — Move the project (if needed)

The project was scaffolded at `/home/abazi/rootx-app`. You can rename or move it:
```bash
mv /home/abazi/rootx-app /home/abazi/Rootx
cd /home/abazi/Rootx
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your keys (see details below).

### Step 4 — Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, features, agents preview |
| `/agents` | Agent marketplace with search & category filter |
| `/agents/[id]` | Individual agent detail page |
| `/request` | Customer request form (connects to Supabase) |
| `/admin` | Admin dashboard (password protected) |
| `/admin/login` | Admin login page |

---

## 🔐 Admin Dashboard

Visit `http://localhost:3000/admin` — you'll be redirected to the login page.

**Default password:** `rootx_admin_2024`

To change the password, set `ADMIN_PASSWORD=your_password` in `.env.local`.

In demo mode (no Supabase), the dashboard shows sample mock data.

---

## 🗄️ Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy your Project URL and anon key
3. Add them to `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```
4. Go to **SQL Editor** in Supabase, paste and run the contents of `db/schema.sql`
5. Restart your dev server

---

## 💳 Stripe (Future Payments)

Stripe is currently a placeholder. To enable payments later:
1. Create a [Stripe account](https://stripe.com)
2. Add your keys to `.env.local`
3. Implement checkout using `@stripe/stripe-js`

---

## 📁 Project Structure

```
rootx-app/
├── app/
│   ├── layout.tsx          # Root layout + fonts + metadata
│   ├── page.tsx            # / — Landing page
│   ├── not-found.tsx       # Custom 404 page
│   ├── agents/
│   │   ├── page.tsx        # /agents — Marketplace
│   │   └── [id]/
│   │       └── page.tsx    # /agents/[id] — Detail page
│   ├── request/
│   │   └── page.tsx        # /request — Customer form
│   ├── admin/
│   │   ├── page.tsx        # /admin — Dashboard (server)
│   │   ├── AdminDashboard.tsx  # Dashboard UI (client)
│   │   └── login/
│   │       └── page.tsx    # /admin/login
│   └── api/
│       └── admin/
│           ├── login/route.ts   # POST — Set auth cookie
│           └── logout/route.ts  # POST — Clear cookie
├── components/
│   ├── Navbar.tsx          # Sticky glass navbar
│   ├── Footer.tsx          # Footer with links
│   └── AgentCard.tsx       # Reusable agent card
├── lib/
│   ├── agents.ts           # 10 agent mock data
│   ├── supabase.ts         # Supabase client + helpers
│   └── types.ts            # TypeScript types
├── db/
│   └── schema.sql          # Supabase table schema
└── .env.local.example      # Environment template
```

---

## 🎨 Design System

- **Primary color:** Red `#dc2626` / `#ef4444`
- **Background:** `#070709` (near-black)
- **Typography:** Inter (Google Fonts)
- **Effects:** Glassmorphism, gradient text, red glow, micro-animations
- **CSS:** Tailwind v4 + custom utility classes in `globals.css`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Icons | Lucide React |
| Payments | Stripe (placeholder) |

---

## 📊 Database Schema

```sql
CREATE TABLE requests (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT        NOT NULL,
  email        TEXT        NOT NULL,
  business_type TEXT,
  selected_agent TEXT      NOT NULL,
  message      TEXT,
  status       TEXT        DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ✅ Build for Production

```bash
npm run build
npm start
```
