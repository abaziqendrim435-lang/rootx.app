<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Single service: a Next.js 16 (App Router, Turbopack) app — "RootX" AI Agent Marketplace. Standard scripts live in `package.json` (`dev`, `build`, `lint`, `start`); see `README.md` for feature/route docs.

- Run (dev): `npm run dev` serves on port 3000. Dependencies are refreshed by the startup update script (`npm install`), so no manual install is needed.
- The app runs fully in **demo/mock mode with no secrets**. Supabase, Stripe, OpenAI/Anthropic/Gemini, and Apify keys are all optional; without them, features fall back to localStorage/mock data (e.g. `/admin` shows sample requests, pricing is a fake upgrade). Only add `.env.local` (from `.env.local.example`) if you need to test a real integration.
- Admin dashboard: `/admin` (redirects to `/admin/login`). Default password is `rootx_admin_2024` unless `ADMIN_PASSWORD` is set.
- Lint (`npm run lint`) reports ~81 pre-existing errors, almost all in `scripts/` and `scratch/` (standalone `.ts` diagnostic/test scripts, not part of the app build). `next build` succeeds regardless. Treat these as baseline noise; the committed `lint_errors.txt` is a snapshot of them.
- `scripts/` and `scratch/` are ad-hoc `tsx`-style trace/test scripts, not an automated test suite — there is no `npm test`.
- Running `next build` while `next dev` is active shares the `.next` dir; the dev server recovers, but restart it if it behaves oddly after a build.
