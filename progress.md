# BAUST Smart Learning Gateway — Progress Tracker (Agent Handoff Document)

> **Last Updated**: 2026-07-16T04:32:00+06:00
> **Build Status**: ✅ PASSING (Next.js 16.2.10 Turbopack)
> **Next.js Version**: 16.2.10 (uses `proxy.ts` instead of `middleware.ts`)

---

## ✅ COMPLETED

### Phase 1: Project Scaffolding
- [x] Next.js App Router + TypeScript scaffolded via `create-next-app`
- [x] All dependencies installed: MUI, Emotion, Supabase SSR, Framer Motion, jose, dayjs
- [x] `.env.local` created with placeholders for Supabase URL/key, class access code, session secret

### Phase 2: Styling Foundation
- [x] `globals.css` — CSS layers (`@layer theme, base, mui, components, utilities`), Tailwind v4 import, BAUST theme variables, scrollbar styling, badge colors, animations
- [x] `muiTheme.ts` — — MUI createTheme with BAUST palette, Inter typography, component overrides
- [x] `ThemeRegistry.tsx` — Client component wrapping `AppRouterCacheProvider` (enableCssLayer) + `ThemeProvider` + `CssBaseline`

### Phase 3: Supabase Client Setup
- [x] `lib/supabase/client.ts` — Browser client (`createBrowserClient`)
- [x] `lib/supabase/server.ts` — Server client (`createServerClient` with async cookies)
- [x] `lib/supabase/middleware.ts` — Middleware helper for session refresh (`updateSession`)

### Phase 4: Access Control & Security
- [x] `lib/auth.ts` — JWT sign/verify using `jose` (Edge-compatible)
- [x] `api/verify-code/route.ts` — POST endpoint comparing code to env var, sets httpOnly JWT cookie
- [x] `proxy.ts` — Route protection (renamed from `middleware.ts` per Next.js 16 convention)
  - ⚠️ **IMPORTANT**: Next.js 16 renames `middleware.ts` → `proxy.ts` and `middleware()` → `proxy()`. Do NOT create a `middleware.ts`.
- [x] `page.tsx` (root) — Access code entry with glassmorphism, Framer Motion animations, BAUST branding

### Phase 5: Layout & Shell
- [x] `(protected)/layout.tsx` — App shell with Navbar + Sidebar spacer
- [x] `Navbar.tsx` — Sticky top bar, logo, section details, admin toggle, mobile hamburger
- [x] `Sidebar.tsx` — Desktop permanent + mobile temporary drawer, active state highlighting
  - ⚠️ Uses `slotProps.primary.sx` instead of deprecated `primaryTypographyProps` for `ListItemText`
  - 🔄 **Sidebar Navigation**: Swapped positions of **"Documents"** and **"Notice Board"**. "Documents" is now listed second (directly below Dashboard).
- [x] `dashboard/page.tsx` — Welcome page with greeting, info banner, quick navigation cards
  - 🔄 **Dashboard Layout**: Highlighted Document Vault card to stretch full-width. Swapped notice board and document vault positioning in quick links list.

### Phase 6: Feature Pages (Viewer-facing)
- [x] **Notice Board** (`notices/page.tsx` + `NoticeCard.tsx`)
  - Category filtering, pinned/unpinned separation, Supabase fetch, loading/empty states
- [x] **Class Routine** (`routine/page.tsx` + `TimetableGrid.tsx`)
  - Weekly grid (Sun-Thu), auto-highlighted current day, time formatting, Supabase fetch
- [x] **Deadline Tracker** (`deadlines/page.tsx` + `DeadlineCard.tsx`)
  - Urgency sorting (red/yellow/green), live countdown timer, category filtering
- [x] **Document Vault** (`documents/page.tsx` + `FileCard.tsx` + `CourseSection.tsx`)
  - Course-grouped collapsible sections, file metadata display, download links
  - **Running Courses**: Displays a virtual folder named **"Running Courses"** containing sessional folders, resolving sessional teacher's profile/photo automatically from `teachers` sessional table dynamically.
  - **Search & Filtering**: Integrated document type filtering chips (PDF, Images, PPT, Word) and sort by name/size/created date descending/ascending.
  - **Pill-shaped Search bar**: Customized search bar to look extremely cool, bigger (`320px`), and styled matching the BAUST emerald green theme.
  - **Direct Downloads**: Implemented client-side force direct download function (`triggerDirectDownload`) for assets instead of default inline tab opening.
  - **File Thumbnail Previews**: Replaced generic icons with actual small thumbnail image previews for images in file tables.

### Phase 7: Admin Authentication & CRUD
- [x] `admin/login/page.tsx` — Supabase Auth email/password sign-in with navy branding
- [x] `admin/(authenticated)/layout.tsx` — Server-side auth guard with user email display, tab navigation
- [x] `admin/(authenticated)/dashboard/page.tsx` — Module cards overview
- [x] `admin/(authenticated)/notices/page.tsx` — Full CRUD (MUI Dialog, category select, pin toggle)
- [x] `admin/(authenticated)/routine/page.tsx` — Day-grouped CRUD (time pickers, course fields)
- [x] `admin/(authenticated)/deadlines/page.tsx` — CRUD with datetime-local picker, overdue indicator
- [x] `admin/(authenticated)/documents/page.tsx` — Dynamic Course & Document Upload portal:
  - Document type stat cards (PDF, PPT, Word, others) with interactive filters
  - Course Folders grid with rename and delete buttons
  - Add Course dialog (inserts into `courses` table)
  - Rename / Delete Course (includes warning prompts when documents exist)
  - Document management with Rename, Download, and Delete actions
  - Upload file dialog with pre-selected course and progress bar
  - **Running Courses Portal**: Admin dashboard containing level/term choices for courses, sessional folders, and mapping teachers.
  - **Direct Downloads**: Direct client-side download behavior (`triggerDirectDownload`) enabled on all downloads.
  - **Layout cleanup**: Swapped search bar to the left and aligned New Subfolder button right on the top navbar. Grouped `New Subfolder` button directly to the left of the `Upload File here` button in the lower row. Removed `+ Create Subfolder` quick card from the grid view.
  - **File Thumbnail Previews**: Implemented direct image previews in file listing tables.
- [x] `admin/settings/page.tsx` — Updated settings page course list to display dynamic teacher details and avatar pictures.

### Phase 8: Database & Infrastructure
- [x] `supabase-schema.sql` — 5 tables (notices, routine, deadlines, documents, courses) + RLS policies + storage bucket instructions

### Phase 9: BAUST Cover Page Generators
- [x] **Lab Report Generator** (`generators/lab-report/page.tsx` + `download.ts`)
  - Live A4 preview, PDF/PNG/DOCX download, AI content generation via Groq/Gemini
- [x] **Assignment Generator** (`generators/assignment/page.tsx` + `download.ts`)
  - Assignment cover page with course info table, comments box, teacher/student sections
- [x] **Index Page Generator** (`generators/index-page/page.tsx` + `download.ts`)
  - Experiment index table with date formatting, watermark logo, PDF/PNG download
- [x] **AI Generation API** (`api/generate/route.ts`) — Groq (primary) + Gemini (fallback)
- [x] Sidebar updated with "Generators" section linking to all three tools
- [x] Input forms removed; generators use default preset values with centered live preview

### Build Verification
- [x] `npm run build` passes with zero TypeScript errors
- [x] All 23 routes generated successfully

---

## ⬜ NOT YET DONE (Future Enhancements)

### Supabase Setup (Manual Steps Required)
- [ ] User must create Supabase project and add URL + anon key to `.env.local`
- [ ] User must run `supabase-schema.sql` in Supabase SQL Editor
- [ ] User must create a `documents` storage bucket (public, 50MB limit)
- [ ] User must create an admin user in Supabase Auth dashboard

### Potential Improvements
- [ ] Admin logout functionality (sign out + clear Supabase session)
- [ ] Real-time subscriptions (Supabase Realtime for live notice updates)
- [ ] File drag-and-drop upload UI enhancement
- [ ] Dark mode toggle
- [ ] Push notifications for deadlines
- [ ] Past deadline archive view
- [ ] Search/filter functionality across notices and documents
- [ ] Responsive optimizations for very small screens

---

## 🗂 Key Technical Decisions & Gotchas

### Next.js 16 Breaking Changes
- **`middleware.ts` → `proxy.ts`**: File renamed, export renamed from `middleware()` to `proxy()`. The old convention shows a deprecation warning.
- **`cookies()` is async**: Must use `await cookies()` in server components.

### MUI v6 Breaking Changes
- **`primaryTypographyProps` removed** from `ListItemText`: Use `slotProps={{ primary: { sx: {...} } }}` instead.
- **`containedPrimary` override key removed**: Use `"&.MuiButton-containedPrimary"` selector inside `root` overrides.

### CSS Layer Order (Critical for Tailwind + MUI)
```css
@layer theme, base, mui, components, utilities;
@import "tailwindcss";
```
MUI's `AppRouterCacheProvider` must have `enableCssLayer: true` for this to work.

### Auth Architecture
- **Viewers**: Class access code → JWT cookie (`cr-session`, httpOnly, 7-day expiry)
- **Admin**: Supabase Auth (email/password) → Supabase cookies managed by `@supabase/ssr`
- Both are checked in `proxy.ts` — viewer cookie for all routes, Supabase session for `/admin/*`

---

## 📁 File Tree Summary
```
src/
├── app/
│   ├── (protected)/        # Viewer-facing pages behind access code
│   │   ├── layout.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── notices/page.tsx
│   │   ├── routine/page.tsx
│   │   ├── deadlines/page.tsx
│   │   └── documents/page.tsx
│   ├── admin/
│   │   ├── login/page.tsx
│   │   └── (authenticated)/  # Admin CRUD pages behind Supabase Auth
│   │       ├── layout.tsx
│   │       ├── dashboard/page.tsx
│   │       ├── notices/page.tsx
│   │       ├── routine/page.tsx
│   │       ├── deadlines/page.tsx
│   │       └── documents/page.tsx
│   ├── api/verify-code/route.ts
│   ├── layout.tsx
│   ├── globals.css
│   └── page.tsx              # Access code entry screen
├── components/
│   ├── layout/     (Navbar, Sidebar)
│   ├── notices/    (NoticeCard)
│   ├── routine/    (TimetableGrid)
│   ├── deadlines/  (DeadlineCard)
│   └── documents/  (FileCard, CourseSection)
├── lib/
│   ├── auth.ts
│   └── supabase/   (client, server, middleware)
├── theme/          (muiTheme, ThemeRegistry)
├── types/          (notices, routine, deadlines, documents)
└── proxy.ts        # Route protection (NOT middleware.ts!)
```
