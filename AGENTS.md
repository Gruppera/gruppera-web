# AI agent instructions

This file is intended to be read automatically by AI agents.

## Build
```bash
npm ci
npm run build
```

## Optional checks
```bash
npm run lint
```

## Run production server (after build)
```bash
npm run start
```

# AGENTS.md — Instructions for the Codex Agent (Next.js + React + Mantine)

This document is the contract for the agent. Follow it strictly.
If any instruction conflicts with the codebase config (eslint/tsconfig), the codebase config wins.
If you must deviate, explain why in the PR/commit message and update this doc.

---

## 0) Quick Config
**Project name:** Gruppera.se  
**Target users:** Potential clients to our concultancy company  
**Core flows:** Quick to find some core info about our company Gruppera. PAges that presents the people working at Gruppera and some contact details. Maybe in the future it should hold some sort of blog functionality

### UI Theme (Gruppera)
- **Design style:** clean, modern, premium dark UI
- **UI framework:** Mantine (required)
- **Font family:** Poppins (required)
- **Radius:** 12px (default)
- **Dark mode:** primary mode

### Brand Colors (tokens)
**Core**
- **GRAFITE** `#0D0D0C` (primary background)
- **CHAMONIX** `#EEEDEB` (typography + UI on dark background)
- **SPROUT** `#95B354` (primary signal/CTA, use with restraint)

**Accents**
- **MOSS** `#757263`
- **CLOUD** `#C3CED9`
- **COGNAC** `#824529`
- **PATCH** `#E0CCBE`

---

## 1) Goals & Non-goals
### Goals
- Build a production-grade web app with consistent UI, strong typing, and clean architecture.
- Use Mantine as the single source of truth for UI components, layout primitives, and theme tokens.
- Keep features incremental and shippable.

### Non-goals
- Do not introduce additional UI libraries (e.g. shadcn/ui, MUI, Chakra).
- Do not implement authentication unless the task explicitly requires it.
- Do not add styling frameworks that compete with Mantine (e.g. Tailwind) unless explicitly approved.

---

## 2) Agent Workflow (how to work)
1. **Plan first:** Before coding, write a short plan (5–15 bullets) of what you will change.
2. **Small steps:** Work in small commits. Each commit should leave the repo in a passing state.
3. **Run checks frequently:** After meaningful changes, run:
   - `pnpm lint`
   - `pnpm test`
   - `pnpm build`
4. **Document as you go:** Update README for new env vars, scripts, or key architectural decisions.
5. **If unsure:** Make the smallest reasonable assumption, implement it cleanly, and document it under **0) Quick Config**.

---

## 3) Coding Standards (non-negotiable)
### TypeScript
- `strict: true`
- No `any`. If unavoidable, use `unknown` + narrow, or justify with comment.
- Prefer explicit return types for exported functions.
- Zod schemas for external data validation (API responses, form input).

### React/Next.js
- Use **App Router** conventions (`app/`).
- Prefer **Server Components** by default; use `"use client"` only where needed.
- Keep components small and composable.
- Avoid prop drilling for global concerns; use context sparingly.

### Style & formatting
- Use Prettier formatting.
- Use ESLint rules as source of truth.
- File naming:
  - components: `PascalCase.tsx`
  - utilities/hooks: `camelCase.ts`
  - folders: `kebab-case/`
- Imports: use `@/` alias for absolute imports (configure in tsconfig).

---

## 4) Libraries (allowed list)
**UI**
- Mantine (`@mantine/core`, `@mantine/hooks`, `@mantine/notifications`)
- Tabler Icons (`@tabler/icons-react`) *(recommended with Mantine)*

**Forms & Validation**
- react-hook-form
- zod
- @hookform/resolvers

**Data**
- @tanstack/react-query

**Testing**
- Vitest
- Playwright

**Utilities**
- clsx (optional)

❌ Do not add alternative UI component libraries.

---

## 5) Architecture & Folder Structure
Use this structure:

- `app/`
  - routes, layouts, pages, route handlers
- `components/`
  - shared, reusable UI components (wrappers around Mantine patterns)
- `features/`
  - feature-based modules:
    - `features/<feature>/components/`
    - `features/<feature>/api/`
    - `features/<feature>/hooks/`
    - `features/<feature>/types.ts`
    - `features/<feature>/schemas.ts`
- `lib/`
  - shared utilities (fetchers, formatters, env helpers)
- `styles/`
  - global styles, font loading, theme helpers (if needed)

Rules:
- Feature-specific components must live under that feature.
- Shared UI building blocks go in `components/`.
- API/data logic belongs in `features/<feature>/api/` or `lib/` if truly cross-cutting.

---

## 6) Typography (Poppins) — REQUIRED
The UI must use **Poppins** for both headings and paragraphs.

### Headings (Poppins)
- **H1: 52px**
  - Used sparingly for section titles and chapter openings.
- **H2: 36px**
  - Primary subheadings.
- **H3: 28px**
  - Sections within chapters.
- **H4: 22px**
  - Subsections and component titles.
- **H5: 18px**
  - Small headings and labels with emphasis.
- **H6: 16px**
  - Overlines for body text and UI headings.

### Paragraphs (Poppins)
- **Paragraph 1 (Primary body): 16px**
  - Standard body text. Optimized for long-form readability.
- **Paragraph 2 (Secondary body): 15px**
  - Used for extended explanations, captions, and system text.
- **Paragraph 3 (Small body): 14px**
  - Used for metadata, labels, footnotes, and UI-related text.
- **Paragraph 4 (Fine print): 12px**
  - Used for legal text, disclaimers, and low-priority information.

Rules:
- Implement these sizes via Mantine theme configuration (typography scale).
- Do not invent additional font sizes unless explicitly required by a feature.

---

## 7) Color System — REQUIRED
Use these colors as the design tokens for the Mantine theme.

### Core
- **GRAFITE — `#0D0D0C`**
  - Primary background color.
  - Used for large surfaces, navigation, and immersive dark mode layouts.
- **CHAMONIX — `#EEEDEB`**
  - Used for typography and UI on dark backgrounds.
  - Provides soft contrast without harsh pure white.
- **SPROUT — `#95B354`**
  - Primary signal color.
  - Used for calls to action and key states.
  - Apply with restraint to preserve impact.
  - Also Gruppera brand color.

### Accents (use for hierarchy & emphasis)
- **MOSS — `#757263`**
  - Backgrounds, dividers, subtle highlights.
- **CLOUD — `#C3CED9`**
  - Secondary text, icons, UI states.
- **COGNAC — `#824529`**
  - Mood/photography tone; grounding warmth.
  - Can be used as background color.
- **PATCH — `#E0CCBE`**
  - Text, soft contrasts, low-priority surfaces.

Rules:
- Default UI is dark (GRAFITE surfaces).
- Text should default to CHAMONIX.
- Primary buttons/CTAs should use SPROUT, but not everywhere.
- Use accent colors to build hierarchy without visual noise.

---

## 8) Data Fetching Strategy
Default strategy:
- Server Components fetch data on the server for pages where possible.
- Client Components use TanStack Query for:
  - paginated lists
  - refetching
  - live-ish data
- Mutations:
  - prefer Server Actions for simple forms
  - otherwise TanStack mutations hitting route handlers

Always validate external data with zod when it crosses boundaries.

---

## 9) Testing Requirements
- For critical user flows: add Playwright tests.
- For pure utilities: add Vitest unit tests.

Minimum Definition of Done per feature:
- No TypeScript errors
- `pnpm lint` passes
- `pnpm build` passes
- At least 1 e2e test for a new primary flow (if applicable)

---

## 10) Definition of Done (global)
A task is “done” when:
- Code compiles and passes lint/test/build
- UI follows Mantine theme tokens (colors + typography)
- No console errors in browser
- README updated if relevant
- Architecture rules are followed

---

## 11) Commit Message Convention
Use Conventional Commits:
- `feat: ...`
- `fix: ...`
- `chore: ...`
- `refactor: ...`
- `test: ...`
- `docs: ...`

---