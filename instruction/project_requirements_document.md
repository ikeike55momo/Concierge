# Project Requirements Document

## 1. Project Overview

This project is an MVP web application to manage, score, search, and display pachislot (パチスロ) performance data for three Tokyo-based stores over the past three months. Administrators can upload raw CSV files containing daily slot-machine metrics. The system will integrate and store that data in a unified format, compute a 0–100 score for each store overnight, and expose public ranking and analysis pages to general users. It also leverages a Claude-based LLM (with OpenAI as fallback) to generate short catchphrases and personalized play strategies.

The primary goal is to validate feasibility: can we ingest messy CSVs, persist JSON-encoded time series, calculate meaningful scores, and serve responsive UI pages with LLM-driven insights—all within sub-3-second page loads? Success is measured by stable nightly data imports, accurate scoring for three pilot stores, LLM comment/strategy generation within 5 seconds, and at least 50 daily active users (DAU) with a 4.0+ satisfaction rating.

## 2. In-Scope vs. Out-of-Scope

### In-Scope (MVP v1)

*   **Data Ingestion**: Manual CSV upload (drag & drop) by admin for three stores, three file types.

*   **Data Integration**:

    *   Parse three source CSVs (daily summaries, machine details, event results).
    *   Aggregate daily data into monthly JSON fields.
    *   Store in a single `store_production_info.csv` and in Supabase tables.

*   **Nightly Batch Scoring**:

    *   Compute base score (30-day avg, volatility inversion, event weight, machine popularity, access).
    *   Apply personal adjustments (favorites, win rate, travel time).

*   **Public UI**:

    *   Top page with filters (prefecture, station).
    *   Store ranking list (color-coded, score, LLM comment).
    *   Store detail page (win-rate forecast, top-3 machines, entry time, strategy, charts).

*   **Admin UI**:

    *   Secure login (email/password).
    *   CSV upload interface with JSON validity checks and duplicate detection.

*   **LLM Integration**:

    *   Generate 15-character “one-liner” comments.
    *   Generate play strategies (arrival time, target/avoid machines).

*   **Responsive Design**:

    *   Desktop + mobile breakpoints.

*   **Basic Profile Settings**:

    *   Favorite machines, past win rate, max travel time.

### Out-of-Scope (Phase 2+)

*   Automated nightly CSV import (batch scheduler).
*   Full membership/subscription system with tiers.
*   Native mobile apps (iOS/Android).
*   Scaling beyond three stores or three months of data.
*   Payment or monetization integration.
*   Real-time on-demand scoring.
*   Multi-timezone support (JST only).

## 3. User Flow

**General User Journey:**\
A new visitor lands on the login screen or Top Page (public). If not logged in, they can immediately browse recommendations or search by prefecture/station. After optional sign-up/login, they arrive at the dashboard showing a slider of featured halls and input fields to filter stores. Submitting filters navigates to the Ranking List: each card displays store name, score (color-coded green/yellow/red), a short LLM-generated comment, and predicted win rate. Tapping a card opens the Store Detail page, showing tomorrow’s win-rate forecast, top-3 machines by unit number, recommended entry time, avoidance tips, and supporting charts. From the user avatar menu, they can update profile settings (favorites, win-rate, travel time), which immediately affect personalization.

**Admin Journey:**\
An administrator accesses the same login screen via a hidden “Admin” link. After authentication, they see an Admin Dashboard with drag-and-drop zones for three CSV types. Upon file drop, the system runs schema and JSON validity checks, then ingests or updates monthly data in the database. Success or error messages appear in a status pane. Admins can view a history of uploads with timestamps and row counts. Future toggle switches for enabling automated nightly batches are visible but disabled in MVP v1.

## 4. Core Features

*   **Authentication & Authorization**

    *   Supabase Auth (Email/Password)
    *   Public vs. admin role segregation

*   **CSV Upload & Validation**

    *   Drag & drop interface
    *   Schema check + JSON validity + duplicate detection

*   **Data Aggregation Engine**

    *   Parse daily, machine, event CSVs
    *   Generate JSON per month (e.g., `daily_summary_202401`)
    *   Insert/update `store_production_info.csv` and Supabase tables

*   **Nightly Batch Scoring**

    *   Base score calculation with weighted factors
    *   Personalization adjustments

*   **Public Pages**

    *   Top page with filters & slider
    *   Ranking list (color-coded, LLM comment)
    *   Store detail (charts, strategy)
    *   Profile settings form

*   **LLM-Powered Insights**

    *   Short catchphrase generation (≤ 15 chars)
    *   Play strategy generation (arrival time, machine picks/avoids)

*   **Responsive UI**

    *   Mobile breakpoints (e.g., 320–768px, 768–1024px, 1024px+)
    *   Red/orange branding

*   **Error Handling & Notifications**

    *   Front-end modals for upload/API errors
    *   Optional Sentry → Slack/Email alerts

## 5. Tech Stack & Tools

*   **Frontend**

    *   Next.js 14 (App Router) + React + TypeScript
    *   CSS-in-JS or Tailwind (for red/orange theme)

*   **Backend / BaaS**

    *   Supabase (PostgreSQL, Storage, Functions, Auth)
    *   Vercel hosting

*   **AI / LLM**

    *   Primary: Claude API
    *   Fallback: OpenAI API (GPT-4)

*   **IDE & Plugins**

    *   Cursor (AI-powered coding suggestions)
    *   VS Code + ESLint + Prettier

*   **Utilities**

    *   CSV parsing (e.g., PapaParse)
    *   Charting library (e.g., Chart.js or Recharts)
    *   Sentry for error tracking
    *   Slack integration for alerts

## 6. Non-Functional Requirements

*   **Performance**

    *   Page load ≤ 3 sec (cold & warm)
    *   Search/filter response ≤ 2 sec
    *   LLM calls ≤ 5 sec

*   **Security**

    *   All traffic over HTTPS
    *   Environment variables for secrets
    *   Role-based access (admin vs. public)

*   **Usability**

    *   Mobile-first, thumb-friendly targets
    *   Clear validation messages on upload

*   **Reliability**

    *   99% uptime on Vercel/Supabase free tier
    *   Error rates < 1% in key flows

*   **Compliance**

    *   GDPR-style data privacy for user profiles
    *   Data retention limited to three months of performance data

## 7. Constraints & Assumptions

*   **Data Volume** is limited to three stores × three months; CSV files will not exceed a few MB.
*   **Time Zone** is fixed to JST; no timezone switching.
*   **User Load** is low initially (≤ 100 concurrent users).
*   **Admin Imports** are manual in v1, nightly batch toggle planned for future.
*   **Claude API** must be available; OpenAI fallback only on failure.
*   **General Users** will not require login for browsing in MVP; only admin login exists. (Profile settings require account.)

## 8. Known Issues & Potential Pitfalls

*   **CSV Format Drift**: Source files may change schema, break ingestion.\
    *Mitigation:* Strict schema checks + versioned CSV templates.
*   **JSON-in-Cell Parsing**: Nested JSON in CSV cells can misparse if quoting is incorrect.\
    *Mitigation:* Use robust CSV parser, enforce RFC-4180 compliance.
*   **LLM Rate Limits**: Claude/OpenAI quotas might throttle comments/strategies.\
    *Mitigation:* Cache recent outputs, queue requests, implement fallback.
*   **Cold Function Start**: Supabase Functions may incur latency on first call.\
    *Mitigation:* Warmup ping or plan for slight delay in LLM endpoints.
*   **Chart Performance**: Rendering many data points can slow mobile.\
    *Mitigation:* Limit to 30 days, aggregate as needed.
*   **Responsive Edge Cases**: Complex layouts on small screens might overflow.\
    *Mitigation:* Thorough QA on common devices, adjust breakpoints.

This document serves as the definitive guide for AI-driven technical specification generation (Tech Stack, Frontend Guidelines, Backend Structure, etc.) and leaves no ambiguity about features, flows, or constraints.
