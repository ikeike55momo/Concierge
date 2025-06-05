# Tech Stack Document

This document explains the technologies chosen for the パチスロ店舗情報管理システム MVP版 in simple terms. Each section clarifies why and how we use specific tools to deliver a reliable, responsive, and secure user experience.

## 1. Frontend Technologies

We build everything you see and interact with in your browser using these tools:

*   **Next.js 14 (App Router) + React + TypeScript**\
    A modern framework that combines server-side rendering and client-side navigation.\
    • Ensures fast page loads (under 3 seconds) and SEO-friendly pages\
    • TypeScript adds type safety, reducing bugs early
*   **Styling: Tailwind CSS (or CSS-in-JS)**\
    A utility-first approach to styling.\
    • Lets us quickly apply the red/orange brand colors and responsive layouts\
    • Minimizes custom CSS and speeds up development
*   **Responsive Design**\
    We target three key breakpoints:\
    • Mobile: 320–768px\
    • Tablet: 768–1024px\
    • Desktop: 1024px+\
    Layouts automatically adjust (grid → single column) for readability on any device.
*   **Data Fetching & State**\
    We use built-in `fetch` or libraries like **SWR** to manage server requests, ensuring: • Caching for quick back-and-forth navigation\
    • Automatic updates when data changes
*   **Charting Library: Chart.js or Recharts**\
    For visualizing past performance and event expectations as interactive charts.
*   **CSV Upload & Parsing**\
    • **React Dropzone** for drag-and-drop file zones\
    • **PapaParse** to validate and parse CSV files before sending to the server\
    Gives immediate feedback if your upload format is wrong.
*   **LLM Integration in UI**\
    Buttons and loading indicators around comment/strategy requests keep you informed while waiting (≤5 seconds) for Claude/OpenAI responses.
*   **Developer Tools**\
    • **VS Code** with **ESLint** and **Prettier** for consistent code style\
    • **Cursor** for AI-powered coding suggestions

## 2. Backend Technologies

The parts of the system that handle data processing, storage, and API logic rely on Supabase and serverless functions:

*   **Supabase (PostgreSQL)**\
    A hosted database that stores: • Raw CSV metadata (file uploads, timestamps)\
    • Daily performance (`daily_performance` table)\
    • Store scoring results (`store_scores` table)\
    • User profiles and authentication
*   **Supabase Storage**\
    Securely saves the original CSV files for audit and reprocessing.
*   **Supabase Auth (Email/Password)**\
    Manages user sign-in for admins and soon for general users.
*   **Supabase Functions**\
    Serverless TypeScript functions that: • Parse and integrate CSV data into the database\
    • Run the nightly batch scoring process\
    • Proxy LLM calls to Claude/OpenAI with fallback logic
*   **CSV-in-Cell JSON Storage**\
    We keep monthly JSON blobs inside database fields (and the main `store_production_info.csv`) for easy retrieval of day-by-day data.

## 3. Infrastructure and Deployment

Our hosting and deployment setup ensures reliability and quick updates:

*   **Vercel**\
    • Automatically deploys on each Git push\
    • Provides global CDN for fast page loads\
    • Manages HTTPS certificates out of the box
*   **Version Control: Git + GitHub**\
    • Branch-based workflow for feature development and reviews n
*   **CI/CD Pipeline**\
    Vercel’s GitHub integration runs builds and deploys every commit.\
    • Environment variables (API keys, database URLs) are managed securely in Vercel’s dashboard\
    • Easy rollback to previous deployments if needed
*   **Database Backups & Monitoring**\
    Supabase offers automated backups and health dashboards to maintain 99% uptime.

## 4. Third-Party Integrations

We connect to external services to power AI features, error tracking, and notifications:

*   **Claude API (Anthropic)** – Primary LLM for generating comments and strategies
*   **OpenAI API (GPT-4)** – Fallback if Claude API fails
*   **Sentry**\
    Captures frontend and function errors in real time
*   **Slack Webhooks**\
    Sends alerts to administrators when critical failures occur (e.g., CSV validation errors, LLM timeouts)

## 5. Security and Performance Considerations

We’ve baked security and speed into every layer:

*   **HTTPS Everywhere**\
    All web traffic is encrypted via Vercel’s certificates.
*   **Authentication & Role-Based Access**\
    • Supabase Auth protects admin and future general-user areas\
    • Admin vs. public routes are strictly separated
*   **Environment Variables**\
    API keys and database credentials live outside code, in Vercel’s secure settings.
*   **Data Protection**\
    • User-uploaded CSVs are scanned for schema validity before any processing\
    • JSON fields sanitized and validated to prevent injection
*   **Performance Optimizations**\
    • Next.js SSR/SSG for instantly usable pages\
    • Caching API responses on the client and edge\
    • Nightly batch scoring reduces peak-time load on the database\
    • Limits on data visualization (30 days) to keep charts snappy on mobile

## 6. Conclusion and Overall Tech Stack Summary

Our MVP tech stack balances rapid development, user experience, and future scalability:

• **Frontend:** Next.js 14 + React + TypeScript, Tailwind CSS, Chart.js/Recharts, PapaParse, React Dropzone\
• **Backend:** Supabase (Auth, Database, Storage, Functions) with TypeScript serverless functions\
• **Hosting & CI/CD:** Vercel with GitHub integration\
• **AI Services:** Claude API primary, OpenAI API as fallback\
• **Monitoring & Alerts:** Sentry + Slack notifications

This combination ensures we can:

1.  Ingest and validate messy CSV data manually now, automate later
2.  Compute robust store scores via nightly batches without impacting user experience
3.  Deliver sub-3-second page loads on desktop and mobile
4.  Provide catchy LLM-driven insights with automatic fallbacks
5.  Scale from three pilot stores to hundreds or thousands in future phases

With clear separation of concerns and proven serverless tools, this stack sets us up for a maintainable, secure, and responsive application that meets both business goals and user expectations.
