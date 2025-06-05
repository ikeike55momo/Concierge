# Backend Structure Document

## 1. Backend Architecture

Overall, the backend is built as a serverless, managed-services setup. We rely on Supabase for most data and auth needs, plus Vercel to host our API routes and batch jobs. Here’s how it all fits together:

- **Serverless Functions**
  - Vercel Serverless Functions (Next.js API routes) handle CSV uploads, public data requests, and LLM calls.
  - Supabase Functions (Edge Functions) run our nightly batch scoring job.
- **Layered Design**
  - **API Layer**: Receives requests, handles authentication, parses input, and returns JSON.
  - **Service Layer**: Implements core business logic (CSV parsing, scoring algorithm, LLM integration).
  - **Data Layer**: Reads/writes to Supabase PostgreSQL and Storage buckets.
- **Third-Party Integrations**
  - **LLM**: Primary calls to Anthropic Claude API, fallback to OpenAI GPT-4 via a shared service.
  - **Error Tracking**: Sentry for real-time error reporting.
  - **Alerts**: Slack webhook for critical failures during upload or batch jobs.

This architecture supports:
- **Scalability**: Serverless auto-scaling on Vercel and Supabase, zero ops for capacity planning.
- **Maintainability**: Clear separation of concerns, managed services minimize infrastructure overhead.
- **Performance**: Edge functions reduce latency for public endpoints; nightly jobs ensure real-time data isn’t overloaded.

---

## 2. Database Management

We use Supabase’s hosted PostgreSQL database and Storage buckets:

- **Database Type**: SQL (PostgreSQL) with JSONB support for flexible monthly summaries.
- **Storage**: Supabase Storage for raw CSVs.
- **Data Flow**:
  1. Admin uploads CSV → file lands in Storage.
  2. Vercel Function fetches CSV, uses PapaParse to extract rows.
  3. Data normalized/aggregated into daily records and monthly JSON summaries.
  4. Records upserted into `daily_performance` and `store_scores` tables.
  5. Raw CSV metadata stored in `csv_files` table.
- **Data Practices**:
  - Use transactions for multi-table writes to keep data consistent.
  - JSONB columns for machine-level details and event results to handle nested data.
  - Indexes on `store_id`, `date`, and full-text search indices on store names.

---

## 3. Database Schema

### Human-Readable Table Descriptions

- **csv_files**: Tracks metadata for each uploaded CSV.
  • id (UUID)
  • filename (text)
  • uploaded_at (timestamp)
  • uploader_id (UUID)
  • status (enum: pending, processing, completed, error)
  • path (text)

- **daily_performance**: Stores per-store, per-day metrics.
  • id (UUID)
  • store_id (UUID)
  • date (date)
  • total_slots (integer)
  • daily_summary (JSONB)
  • machine_details (JSONB)

- **store_scores**: Holds nightly scoring results and LLM outputs.
  • id (UUID)
  • store_id (UUID)
  • date (date)
  • total_score (numeric)
  • win_rate (numeric)
  • llm_comment (text)
  • llm_strategy (text)

### SQL Schema (PostgreSQL)

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE csv_files (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename text NOT NULL,
  uploaded_at timestamp with time zone DEFAULT now(),
  uploader_id uuid NOT NULL,
  status text CHECK (status IN ('pending','processing','completed','error')) DEFAULT 'pending',
  path text NOT NULL
);

CREATE TABLE daily_performance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid NOT NULL,
  date date NOT NULL,
  total_slots integer NOT NULL,
  daily_summary jsonb NOT NULL,
  machine_details jsonb NOT NULL,
  UNIQUE(store_id, date)
);

CREATE TABLE store_scores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id uuid NOT NULL,
  date date NOT NULL,
  total_score numeric(5,2) NOT NULL,
  win_rate numeric(5,2) NOT NULL,
  llm_comment text,
  llm_strategy text,
  UNIQUE(store_id, date)
);

CREATE INDEX idx_daily_performance_store_date ON daily_performance(store_id, date);
CREATE INDEX idx_store_scores_store_date ON store_scores(store_id, date);
```  

---

## 4. API Design and Endpoints

We follow a RESTful approach with JSON payloads. Authentication via Supabase JWT for protected routes.

- **Admin Routes**
  - POST `/api/admin/upload`  
    • Upload a CSV file (multipart/form-data).  
    • Validates format, stores file, kicks off parsing.

- **Public Data Routes**
  - GET `/api/ranking/tomorrow`  
    • Returns an array of stores with tomorrow’s predicted score, color code, and basic info.
  - GET `/api/analysis/:store_id/tomorrow`  
    • Returns detailed breakdown: forecasted win rate, top machines, and strategy text.

- **LLM Routes**
  - POST `/api/llm/generate-comment`  
    • Inputs: store metrics, returns a ≤15-character comment.
  - POST `/api/llm/generate-strategy`  
    • Inputs: store data, returns a play strategy paragraph.

Each endpoint enforces:
- Input validation (JSON schema or TypeScript interfaces).
- Error handling with Sentry logging.
- CORS policy limited to our domain.

---

## 5. Hosting Solutions

- **Vercel**
  - Hosts Next.js app & API routes globally on their CDN.
  - Autoscaling serverless functions—no warm-up needed.
  - Built-in HTTPS and custom domains.
- **Supabase**
  - Fully managed PostgreSQL and Storage.
  - Edge Functions for scheduled tasks.
  - Free tier aligns with MVP cost constraints.

**Benefits**:
- Zero-server maintenance, high uptime guarantees.
- Pay-as-you-grow pricing—ideal for MVP scale.
- Global edge network minimizes latency for Japan and beyond.

---

## 6. Infrastructure Components

- **Load Balancer & CDN**
  - Vercel’s edge network distributes traffic automatically.
- **Caching**
  - ISR (Incremental Static Regeneration) or On-Demand Revalidation for ranking page—updates nightly.
  - HTTP caching headers for public endpoints.
- **Batch Scheduler**
  - Supabase Scheduled Functions (cron) to run nightly scoring at 2 AM JST.
- **Logging & Alerts**
  - Sentry captures runtime errors and performance issues.
  - Slack webhook for build failures or batch job errors.

All components collaborate to deliver quick responses, smooth scaling, and proactive alerting.

---

## 7. Security Measures

- **Transport Security**: HTTPS everywhere (Vercel and Supabase enforce TLS).
- **Authentication & Authorization**
  - Supabase Auth (email/password) for admin users.
  - JWT-based auth guarding admin endpoints.
  - Public endpoints read-only—no auth needed.
- **Data Protection**
  - Encryption at rest (Supabase) and in transit.
  - Environment variables for API keys (CLAUDE_API_KEY, OPENAI_API_KEY) stored securely.
- **Input Validation**
  - Strict CSV schema checks before parsing.
  - JSON schema validation on all API payloads.
- **Rate Limiting & CORS**
  - Basic rate limiting on LLM endpoints to prevent abuse.
  - CORS restricted to our frontend domain.

These layers ensure user data is safe and the system complies with common security best practices.

---

## 8. Monitoring and Maintenance

- **Performance Monitoring**: Vercel Analytics for function timings; Supabase Dashboard for query performance.
- **Error Tracking**: Sentry alerts on exceptions, with stack traces and environment context.
- **Notifications**: Slack messages for critical failures (upload errors, scoring job crashes).
- **Backups & Recovery**
  - Supabase automated daily backups of the database.
  - Manual restore tested quarterly.
- **Maintenance Routine**
  - Nightly scoring via scheduled function.
  - Monthly dependency updates and security patching.
  - Quarterly DR drills for backup restores.

---

## 9. Conclusion and Overall Backend Summary

Our backend combines serverless functions, a managed SQL database, and edge hosting to deliver an ultra-efficient MVP for pachislot store scoring. CSV ingestion, nightly batch processing, and LLM-driven commentary all happen on reliable, cost-effective platforms. The architecture’s clear layers and managed services guarantee we can scale beyond 3 stores, maintain code easily, and keep performance snappy for end users—all while keeping admin operations simple and secure.