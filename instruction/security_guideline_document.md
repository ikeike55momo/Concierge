# Step-by-Step Implementation Plan for Pachislot Store Management MVP

This plan covers Phase 1 (3 stores → 10 stores) over ~1 month. It embeds security, performance, and scalability best practices.

---

## 1. Project Kickoff & Environment Setup (Days 1–2)

### Objectives
• Align team on goals, tech stack, timelines
• Provision core infrastructure

### Tasks
- Create project repo (Git + develop/prod branches) and enforce commit hooks (ESLint, Prettier)
- Define environment variables in Vercel and Supabase (no secrets in code)
- Configure Supabase project:
  - Enable Auth with email/password
  - Set up RLS policies for `stores`, `data`, `scores`, and `users`
- Provision Sentry & Slack integration for error alerts
- Establish secure CI/CD pipeline in GitHub Actions or Vercel

### Deliverables
- Repository scaffold
- Vercel & Supabase projects linked
- CI/CD configured with secret management

---

## 2. Data Model & Database Schema (Days 2–4)

### Objectives
Design relational schema in PostgreSQL (Supabase) to store raw CSV data, aggregated JSON, scores, and metadata.

### Tasks
- Define tables:
  - `stores` (id, name, location, access_score)
  - `raw_uploads` (id, store_id, file_key, uploaded_at, status)
  - `monthly_data` (id, store_id, year, month, data_json)
  - `scores` (id, store_id, year, month, score_value, breakdown_json)
  - `users` (id, email, role)
- Apply RLS:
  - Admin role can read/write all
  - General users can only read `monthly_data` & `scores`
- Index on (`store_id`, `year`, `month`) for performance

### Deliverables
- Database migration scripts
- RLS policy definitions

---

## 3. CSV Ingestion & Admin Pipeline (Days 4–8)

### Objectives
Enable secure upload, parsing, validation, and storage of CSV data.

### Tasks
- Frontend:
  - Implement React Dropzone + PapaParse for CSV selection
  - Enforce file type / size limits
- Backend (Supabase Functions):
  - `uploadCsv` endpoint:
    - Authenticate user (JWT via Supabase Auth)
    - Store raw file in Supabase Storage (secure bucket, private)
    - Record entry in `raw_uploads`
  - `processCsv` function (nightly via cron or Vercel scheduled function):
    - Download file, parse JSON cells
    - Validate schema (AJV for JSON validation)
    - Detect duplicates & out-of-range values
    - Upsert into `monthly_data`
    - Mark `raw_uploads` status and log errors securely

### Security Controls
- Input validation (schema, whitelist columns)
- Fail securely (errors logged to Sentry, generic error to client)

### Deliverables
- Frontend upload form
- Supabase Functions for ingestion & validation

---

## 4. Scoring Engine & Batch Jobs (Days 8–12)

### Objectives
Compute store scores nightly using defined metrics.

### Tasks
- Define scoring algorithm in TypeScript:
  - Recent performance (weight X)
  - Stability (σ of daily results)
  - Event expectations
  - Popularity & access convenience (from `stores.access_score`)
- Implement batch job:
  - Trigger nightly via Vercel Cron
  - Load latest `monthly_data`
  - Compute `scores` and breakdown JSON
  - Insert/update `scores` table

### Security & Performance
- Limit job concurrency (queue jobs)
- Parameterized DB queries
- Log metrics and failures to Sentry

### Deliverables
- Scoring module + cron job
- Updated `scores` table entries nightly

---

## 5. REST API Development (Days 12–16)

### Objectives
Expose secure endpoints for data retrieval, search, and LLM triggers.

### Tasks
- Implement endpoints in Supabase Functions or Next.js API routes:
  - GET `/api/stores` (list + ranking)
  - GET `/api/stores/:id/monthly?year=&month=` (detailed data & score)
  - GET `/api/search?query=` (store search)
  - POST `/api/llm/comment` (LLM insight for a store/month)
- Enforce middleware:
  - JWT verification
  - Role check (RBAC)
  - Rate limiting (per-IP or per-user)
- Input validation via Zod or AJV
- CORS policy restricting to deployed frontend domain

### Security Headers
- HSTS, CSP, X-Frame-Options, X-Content-Type-Options

### Deliverables
- Fully documented OpenAPI spec
- API tests (Jest + supertest)

---

## 6. Frontend Implementation (Days 16–22)

### Objectives
Build responsive UI with Next.js, Tailwind CSS, and integrate APIs.

### Tasks
- Layout & Theming:
  - Red/Orange theme, dark/light support
  - Responsive design breakpoints
- Pages:
  - Home / Rankings (color-coded cards)
  - Store Detail (charts, win-rate predictions, LLM comments)
  - Search with autocomplete
  - Admin upload page (protected route)
- Components:
  - Chart.js or Recharts for data visualization
  - Accessible elements (ARIA labels)
- Auth:
  - Integrate Supabase Auth (magic links or email/pw)
  - Protect admin routes (client + server check)
- Performance:
  - Image & asset optimization
  - Code-splitting and SSR where needed

### Deliverables
- Deployed frontend on Vercel staging
- Lighthouse score ≥90 for performance & accessibility

---

## 7. LLM Integration & Insights (Days 22–26)

### Objectives
Generate catchy comments and play strategies using Claude API with OpenAI fallback.

### Tasks
- Create backend wrapper:
  - Select API (Claude primary, fallback GPT-4)
  - Manage secrets via Vercel Envs
  - Implement prompt templates with guardrails (max tokens, temperature)
- Endpoint `/api/llm/comment`:
  - Validate request (store_id, year, month)
  - Throttle calls (e.g., 5/day/user)
  - Cache responses in Supabase to avoid duplicate calls
- Frontend integration:
  - Button to fetch comment/strategy
  - Show loading state and handle errors gracefully

### Security
- Sanitize all LLM inputs
- Do not expose API keys

### Deliverables
- Stable LLM endpoints
- Demo of generated insights in UI

---

## 8. Testing & QA (Days 26–28)

### Objectives
Ensure quality, security, and performance targets are met.

### Tasks
- Unit tests for scoring, parsing, API logic
- Integration tests for ingestion → DB → frontend
- Security scan:
  - SAST (ESLint security plugins)
  - SCA (Dependabot or Snyk)
- Performance/load test search & ranking endpoints (Artillery, k6)
- Accessibility audit (axe-core)

### Deliverables
- Test coverage ≥80%
- Security & performance report

---

## 9. Production Deployment & Monitoring (Days 28–30)

### Objectives
Launch MVP to production with observability.

### Tasks
- Promote environment variables to production in Vercel
- Enable SSL/TLS (automatic via Vercel)
- Configure Sentry release tracking
- Set up Prometheus/Grafana or use Vercel metrics for:
  - Uptime, Latency, Error rates
  - Cron job success/failure alerts
- Onboard Slack alerts for critical issues

### Deliverables
- Live MVP URL
- Monitoring dashboards & alerting rules

---

## 10. Future Phases Roadmap

### Phase 2 (3 months)
- Scale to 100 stores
- Real-time CSV sync
- AI-driven win-rate predictions (time-series ML)
- Member subscription & advanced filters

### Phase 3 (6 months)
- Support 6000+ stores
- Mobile app (React Native or Next.js Mobile)
- Data warehouse & BI integration
- ML pipeline (AWS SageMaker or similar)

---

By following this structured plan, we ensure secure design, performant delivery, and a scalable foundation for future growth. Feel free to adjust timelines based on team size and feedback loops.