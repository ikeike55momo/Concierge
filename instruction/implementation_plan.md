# Implementation plan

## Phase 1: Environment Setup

1. **Prevalidation:** Check if current directory contains `package.json` or `.git` to determine if it’s already a project root; if so, skip initialization (Environment Setup: Prevalidation).
2. Install Node.js v20.2.1 using nvm or the installer (Technical Stack).
3. **Validation:** Run `node -v` to confirm it returns `v20.2.1` (Technical Stack).
4. Install the Supabase CLI globally: `npm install -g supabase` (Technical Stack).
5. **Validation:** Run `supabase --version` to confirm successful installation (Technical Stack).
6. Initialize a Next.js 14 TypeScript app in `/frontend`:
   ```bash
   npx create-next-app@14 frontend --typescript --eslint
   ```
   (Technical Stack).
7. **Validation:** `cd frontend` and run `npm run dev`; confirm the Next.js welcome page loads on `http://localhost:3000` (Technical Stack).
8. At project root, create `cursor_metrics.md` and add a note: “See `cursor_project_rules.mdc` for usage.” (Environment Setup: Cursor).
9. Create the directory `.cursor/` in project root if it does not exist (Environment Setup: Cursor).
10. Create `.cursor/mcp.json` with the following placeholder configuration and open it for editing (Environment Setup: Cursor):
    ```json
    {
      "mcpServers": {
        "supabase": {
          "command": "npx",
          "args": ["-y", "@modelcontextprotocol/server-postgres", "<connection-string>"]
        }
      }
    }
    ```
11. Add `.cursor/mcp.json` to `.gitignore` (Environment Setup: Cursor).
12. Display link for obtaining Supabase connection string:
    ```
    https://supabase.com/docs/guides/getting-started/mcp#connect-to-supabase-using-mcp
    ```
    (Environment Setup: Cursor).
13. After obtaining `<connection-string>`, replace the placeholder in `.cursor/mcp.json`, save, then navigate in Cursor to **Settings → MCP** to confirm a green “active” status (Environment Setup: Cursor).
14. At project root, create `.env.local` with the following entries (Non-Functional Requirements):
    ```ini
    NEXT_PUBLIC_SUPABASE_URL=
    NEXT_PUBLIC_SUPABASE_ANON_KEY=
    SUPABASE_SERVICE_ROLE_KEY=
    CLAUDE_API_KEY=
    OPENAI_API_KEY=
    ```
15. **Validation:** Ensure `.env.local` is listed in `.gitignore` and does not get committed (Non-Functional Requirements).

## Phase 2: Frontend Development

16. In `/frontend`, install Tailwind CSS and init configuration:
    ```bash
    npm install -D tailwindcss postcss autoprefixer
    npx tailwindcss init -p
    ```
    (Technical Stack: Frontend).
17. Configure `tailwind.config.js` to include:
    ```js
    module.exports = {
      content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
      theme: { extend: {} },
      plugins: [],
    }
    ```
    (User Interface).
18. Create `/frontend/styles/globals.css` and add:
    ```css
    @tailwind base;
    @tailwind components;
    @tailwind utilities;
    ```
    then import it in `app/layout.tsx` (User Interface).
19. Create the App Router layout at `/frontend/app/layout.tsx` with a `<html>` and `<body>` wrapper and include `<head>` defaults (Project Overview).
20. Implement the home page at `/frontend/app/page.tsx` to fetch from `/api/ranking/tomorrow` and render a list of `StoreCard` components (API Design).
21. Create `/frontend/components/StoreCard.tsx` using Tailwind classes, color-code rankings with red/orange per rank (User Interface).
22. Install charting dependencies:
    ```bash
    npm install chart.js react-chartjs-2
    ```
    (Technical Stack: Frontend).
23. Create `/frontend/components/PerformanceChart.tsx` that accepts time-series props and renders a line chart showing past and forecasted performance (Functional Requirements).
24. Implement the store detail page at `/frontend/app/store/[storeId]/page.tsx` to fetch from `/api/analysis/{storeId}/tomorrow` and display win-rate forecast, top machines, and the PerformanceChart (Functional Requirements).
25. Create drag-and-drop CSV upload UI in `/frontend/components/CSVUploader.tsx`, calling `/api/admin/upload` on file drop (Functional Requirements).
26. **Validation:** Run `npm run lint` and `npm run dev`; verify no styling or type errors and that pages render sample data without console errors (Non-Functional Requirements).

## Phase 3: Backend Development

27. In project root, initialize Supabase in `/backend`:
    ```bash
    mkdir backend && cd backend
    supabase init
    ```
    (Technical Stack: Backend).
28. In `/backend/migrations/01_create_csv_files.sql`, define the `csv_files` table per Database Design:
    ```sql
    CREATE TABLE csv_files (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      filename text NOT NULL,
      uploaded_at timestamptz NOT NULL DEFAULT now(),
      content jsonb NOT NULL
    );
    ```
    (Database Design).
29. In `/backend/migrations/02_create_daily_performance.sql`, define the `daily_performance` table per Database Design.
30. In `/backend/migrations/03_create_store_scores.sql`, define the `store_scores` table per Database Design.
31. Push migrations to Supabase MCP server:
    ```bash
    supabase db push
    ```
    (Database Design).
32. **Validation:** Use `supabase psql` to list tables and confirm `csv_files`, `daily_performance`, and `store_scores` exist (Database Design).
33. Create Edge Function at `/backend/functions/upload_csv.ts` for `POST /api/admin/upload`: parse CSV via PapaParse, validate schema, insert to `csv_files`, trigger nightly integration (API Design).
34. Create Edge Function at `/backend/functions/ranking_tomorrow.ts` for `GET /api/ranking/tomorrow`: query `store_scores` for tomorrow’s ranking (API Design).
35. Create Edge Function at `/backend/functions/analysis_store.ts` for `GET /api/analysis/:store_id/tomorrow`: aggregate data, call LLM if needed (API Design).
36. Create Edge Function at `/backend/functions/llm_generate.ts` for `POST /api/llm/generate-{comment,strategy}` using Claude API with OpenAI fallback (API Design).
37. Create Edge Function at `/backend/functions/score_nightly.ts` scheduled nightly to aggregate performance, calculate scores per store (Functional Requirements).
38. **Validation:** Run `supabase functions serve --env-file ../.env.local` and use `curl` to exercise each endpoint, verifying status codes and JSON shape (Non-Functional Requirements).

## Phase 4: Integration

39. In `/frontend/next.config.js`, add rewrites to proxy API routes to Supabase Edge Functions:
    ```js
    module.exports = {
      async rewrites() {
        return [{ source: '/api/:path*', destination: 'https://<YOUR_SUPABASE_PROJECT>.functions.supabase.co/:path*' }]
      }
    }
    ```
    (Integration).
40. Create `/frontend/src/services/api.ts` with typed functions for each backend endpoint using `fetch` and environment variables (Integration).
41. Wire CSVUploader to call `/api/admin/upload`, show error toasts on validation failures, success toast on completion (Functional Requirements).
42. **Validation:** Perform end-to-end scenario:
    - Upload sample CSV via UI
    - Trigger nightly scoring function manually
    - Visit `/` and `/store/{id}` pages
    - Confirm data displays correctly and performance meets <3s load time (Non-Functional Requirements).

## Phase 5: Deployment

43. On Vercel, create a new project linked to the GitHub repo, set root directory to `/frontend` (Deployment).
44. In Vercel Dashboard, add environment variables matching `.env.local` keys (Non-Functional Requirements).
45. In the repo root, add `vercel.json` with build settings:
    ```json
    {
      "version": 2,
      "builds": [
        { "src": "frontend/package.json", "use": "@vercel/next" }
      ]
    }
    ```
    (Deployment).
46. Add a GitHub Action in `.github/workflows/deploy.yml` to run `supabase db push` and `supabase functions deploy --project-ref <ref>` on push to `main` (Deployment).
47. Configure Supabase CRON trigger for the `score_nightly` function in Supabase Studio under **Functions → Triggers** to run daily at 02:00 JST (Functional Requirements).
48. **Validation:** Merge to `main`, confirm Vercel deploy succeeds, run Lighthouse audit on production URL — ensure page load <3s and LLM calls return <5s (Non-Functional Requirements).

---

*Total steps: 48*