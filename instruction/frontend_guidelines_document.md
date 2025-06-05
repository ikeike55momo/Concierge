# Frontend Guideline Document

This document explains how we build and organize the frontend for our パチスロ店舗情報管理システム MVP. We use everyday language so anyone can understand our setup, even without deep technical knowledge.

## 1. Frontend Architecture

### Frameworks and Libraries
- **Next.js 14 (App Router)**: Our main framework. It gives us file-based routing, server-side rendering, and static generation out of the box.
- **TypeScript**: Adds type safety to our JavaScript code, helping catch errors early.
- **Supabase JS**: Handles data fetching, authentication, and storage from our Supabase backend.
- **Claude & OpenAI APIs**: Invoked via our own API routes to generate comments and strategies.
- **Vercel Hosting**: We deploy directly from our repository for fast, zero-configuration builds.

### Folder Structure (Example)
```
/app
  /layout.tsx         # Global layouts and wrappers
  /page.tsx           # Home / Top page
  /ranking            # Store ranking pages
    /page.tsx
  /analysis
    /[storeId]
      /page.tsx       # Detail for each store
  /admin              # Admin panel pages
/components           # Reusable UI pieces (atoms, molecules...)
/hooks                # Custom React hooks (data fetching, auth)
/contexts             # React Context providers (auth)
/styles               # Global styles, Tailwind config
/utils                # Helpers and constants

```

### Scalability, Maintainability, Performance
- **Scalable**: Next.js lets us add new pages or API routes simply by creating files. Components live in a central folder for easy reuse.
- **Maintainable**: TypeScript and clear folder structure reduce confusion. We group related code (components, styles, hooks) together.
- **Performant**: Server components and static generation serve pre-built pages. We lazy-load heavy components and optimize images automatically.

## 2. Design Principles

### Usability
- Simple, clear layout. Key actions (search, view ranking) are obvious.
- Mobile-first: We design for smartphones first, then adapt to desktop.

### Accessibility
- Proper `alt` text on all images.
- Semantic HTML (buttons, headings).
- Keyboard navigation and visible focus states.

### Responsiveness
- Breakpoints at 640px, 768px, 1024px for smooth scaling.
- Components adjust (cards stack vertically on small screens).

## 3. Styling and Theming

### Styling Approach
- **Tailwind CSS** (utility-first): Fast to write, easy to customize. Purging unused classes keeps CSS small.
- **Glassmorphism & Flat Hybrid**: Cards have slight blur and semi-transparent backgrounds for depth, but overall design stays clean and flat.

### Theming & Consistency
- We define colors, spacing, and typography in `tailwind.config.js` so everyone uses the same tokens.

### Color Palette
- **Primary Red**: #E53935  (highlights, buttons)
- **Secondary Orange**: #FB8C00 (alerts, accents)
- **Accent Yellow**: #FFEB3B (badges, highlights)
- **Background Light**: #F5F5F5
- **Card Background**: rgba(255, 255, 255, 0.75) with `backdrop-filter: blur(10px)`
- **Text Primary**: #212121
- **Text Secondary**: #757575

### Typography
- **Font Family**: "Noto Sans JP", sans-serif. Legible for Japanese text.
- **Base Size**: 16px, with scalable headings (1.25rem, 1.5rem, 2rem).

## 4. Component Structure

### Organization
- **Atoms**: Basic elements (Button, Input, Icon).
- **Molecules**: Combinations (SearchBar, CardHeader).
- **Organisms**: Complex sections (StoreCard, RankingTable).
- **Templates/Pages**: Layouts and full screens.

### Reuse and Consistency
- Every UI piece is a component. Changing a button style updates everywhere.
- Props control variants (size, color) so we don’t repeat code.

## 5. State Management

### Server State
- **TanStack Query** (React Query): Handles data fetching, caching, and updating for API calls (`/api/ranking/tomorrow`, `/api/analysis/:storeId`, etc.). Automatic retry and background refresh keep data fresh.

### Client State
- **React Context**: Stores authentication status and user preferences (favorites, filters).
- **Local Component State**: For temporary UI state (modal open/close, form inputs).

## 6. Routing and Navigation

### Next.js App Router
- File-based routes under `/app` automatically map to URLs.
- Dynamic routes for store details (`/analysis/[storeId]/page.tsx`).
- Layout files (`layout.tsx`) wrap child pages with headers and footers.

### Navigation Structure
- **Home (/)**: Intro and quick links.
- **Ranking (/ranking)**: Color-coded store list.
- **Analysis (/analysis/[storeId])**: Detailed view with charts and LLM comments.
- **Admin (/admin)**: CSV upload, data management (protected behind login).
- **Login (/login)**: Admin sign-in page.

Links use `next/link` for fast client-side transitions.

## 7. Performance Optimization

- **Static & Server Rendering**: Use Next.js to prerender ranking and analysis pages when possible.
- **Code Splitting**: Heavy charting libraries or maps loaded with `dynamic()` and `ssr: false`.
- **Lazy Loading**: Images and offscreen components with `loading="lazy"`.
- **Asset Optimization**: Built-in Vercel image optimizer for store photos.
- **Tailwind PurgeCSS**: Strips unused CSS classes in production.

## 8. Testing and Quality Assurance

### Unit Tests
- **Jest** + **React Testing Library**: Test individual components (buttons, API hooks).

### Integration Tests
- Check how multiple components work together (e.g., SearchBar + RankingTable).

### End-to-End Tests
- **Cypress**: Simulate user flows (admin login, CSV upload, ranking display).

### Linting & Formatting
- **ESLint** with TypeScript rules.
- **Prettier** for consistent code style.
- **Husky** + **lint-staged** to enforce checks before commits.

## 9. Conclusion and Overall Frontend Summary

We’ve chosen Next.js with TypeScript and Tailwind CSS to build a fast, scalable, and maintainable frontend. Our design principles—usability, accessibility, and responsiveness—ensure a good experience on any device. Component-based structure, clear theming, and strong testing give us confidence in code quality. Finally, performance optimizations and easy deployment on Vercel mean users see pages quickly, and developers can ship features with ease.

By following these guidelines, anyone joining the project can quickly understand how our frontend is built, how to extend it, and how to keep it consistent and reliable.