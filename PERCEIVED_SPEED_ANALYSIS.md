# Perceived Speed Analysis — Next.js + Supabase

Investigation only. No code, config, or database changes were made in this pass.

Focus: how long it takes for a page to feel responsive after a click, and how long it takes for a button/action to give feedback after being pressed.

---

## Already done (status only)

| Item | Status |
| --- | --- |
| `seed_student_assignments` RPC lockdown | Assumed closed; not re-audited |
| Missing indexes (`students.classroom_id`, `students.teacher_id`, `profiles.role`/`status`) | Assumed closed; not re-audited |
| Teacher dashboard N+1 count queries | Still open in spirit: dashboard now does **2 sequential** client queries (classrooms → students for counts), not N+1 — better, but still a post-paint load |
| Assignment B word-pool growth fix | Assumed closed; B still pays **3 sequential** A1/A2/A3 reads on open (see below) |
| `loading.tsx` skeletons for student/teacher/admin routes | Present |
| `getUser()` double-call | Confirmed necessary previously (middleware refreshes cookies, does not hand off a trusted user). Left alone unless something new appears |

---

## 1. Navigation latency (click → page feels done)

**Global tax on every portal nav:** middleware `getUser()` (+1 Auth RTT), then page-level `getUser()` again. No nested `layout.tsx` under portals — only `app/layout.tsx`.

| Location | Finding | Severity |
| --- | --- | --- |
| `middleware.ts` + `lib/supabase/middleware.ts` | Every portal/API hit awaits `auth.getUser()` before the page runs | High |
| `app/student/dashboard/page.tsx` | Server: `getUser` → parallel(profile, student) → parallel(teacher, classroom, assignments). **3 sequential phases**, well parallelized inside. **No client refetch.** | Medium |
| `app/student/chapter/[id]/page.tsx` | Server: `getUser` → parallel(5 queries) → optional fallback → `getQuestionCountsByAssignmentIds`. **3–4 phases.** Materials iframe deferred until Materials tab. | Medium |
| `app/student/assignment/[id]/page.tsx` (A1–A3) | Server: parallel(`getUser`, deep join with questions). **1 page phase.** Props into game. | Low |
| `app/student/assignment/[id]/page.tsx` + `lib/lms/assignment-questions.ts` (B) | After join, **ignores** nested B questions and runs `getCombinedAQuestionsForChapter` = **3 sequential** A1/A2/A3 queries. Worst student path. | High |
| `app/teacher/dashboard/page.tsx` + `components/teacher/dashboard-content.tsx` | Server auth only (3 sequential). Then **client second phase**: classrooms → students counts. Spinner after shell. | High |
| `app/teacher/classroom/[id]/page.tsx` + `components/teacher/classroom-content.tsx` | Server auth + classroom (3 sequential). Client: students → profiles → assignments (**3 sequential**). | High |
| `app/teacher/student/[id]/page.tsx` + `components/teacher/student-detail-content.tsx` | Server: **4–5 sequential** auth/entity reads. Client: assignments tree + promotion flag (parallel loaders; assignments path itself multi-step). | High |
| `app/admin/{dashboard,teachers,classrooms,promotions,materials}/page.tsx` + `*-content.tsx` | Server: `requireAdminPage` only (2 queries). **All list data via client `useEffect` → `/api/admin/*`**, each re-running `requireAdminApi` (`getUser` + profile again). Classic second loading phase. | High |
| `app/admin/questions/page.tsx` | Auth only; no mount fetch (upload UI). | Low |
| `app/admin/login/page.tsx` | Middleware bypass; static form. | Low |
| `app/admin/students/page.tsx` | Redirect to classrooms only. | Low |

### Routes with >2 sequential server round-trips before render

- Student dashboard
- Student chapter
- Student assignment **B**
- All three teacher pages
- All authenticated admin pages (middleware + page auth)

### Definitive client second-loading-phase list

| Route | Second phase? |
| --- | --- |
| `/student/dashboard` | No |
| `/student/chapter/[id]` | Deferred only (Materials iframe on tab) |
| `/student/assignment/[id]` | No DB; B game JS via `dynamic(..., { ssr: false })` |
| `/teacher/dashboard` | **Yes** |
| `/teacher/classroom/[id]` | **Yes** |
| `/teacher/student/[id]` | **Yes** |
| `/admin/dashboard` | **Yes** |
| `/admin/teachers` | **Yes** |
| `/admin/classrooms` | **Yes** |
| `/admin/promotions` | **Yes** |
| `/admin/materials` | **Yes** |
| `/admin/questions` | No (on mount) |
| `/admin/login` | No (on mount) |

---

## 2. Interaction latency (click → visible feedback)

| Location | Finding | Severity |
| --- | --- | --- |
| `components/layout/marketing-shell.tsx` — Sign Out | **No** pending/disabled/spinner; silent `signOut()` | High |
| `components/assignment-b-game.tsx` — complete | Finish UI shows; `fetch(.../complete)` has **no save indicator** (unlike A-level game) | High |
| `components/admin/admin-dashboard-content.tsx` — approve/reject teacher | Buttons `disabled` only; label unchanged, no spinner | High |
| `components/teacher/student-detail-content.tsx` — lock toggles | Switch disabled immediately; **checked state stale** until full refetch; no spinner | Medium |
| `components/admin/admin-promotions-content.tsx` — reject / confirm approve | Disabled only; no “Approving…/Rejecting…” | Medium |
| `components/login-form.tsx`, signup pages, admin login | Immediate spinner + disabled | Low (good) |
| `components/student/assignment-retry-button.tsx` | “Starting…” + disabled | Low (good) |
| `components/mandarin-typing-game.tsx` — complete A | Finished UI + “Saving…” / error states | Low (good) |
| Create classroom, flag promotion, admin CRUD (reassign/level/delete), materials upload/delete, CSV import | Pending labels/spinners present | Low (good) |
| Lock/admin actions generally | **Not optimistic** — wait for round-trip + refetch | Medium (feel, not “did click register”) |

Almost no true optimistic updates; enroll page is a mock local success only.

---

## 3. Rendering / hydration

| Location | Finding | Severity |
| --- | --- | --- |
| `app/` tree | **Confirmed:** only root `app/layout.tsx`. **No** `student/`, `teacher/`, or `admin/` `layout.tsx`. Earlier “no shared layout” hypothesis is **correct**. | High |
| `StudentShell` / `TeacherShell` / `AdminShell` | Each page wraps content in shell → shell **remounts on every intra-portal navigation** (header/nav rehydrate) | High |
| `components/layout/marketing-shell.tsx` | Client; needs interactivity for nav active state + logout | — |
| `components/student/dashboard-content.tsx` | Entire dashboard is client; data is props-only — **could be mostly server-rendered** (links/cards need no client state except `useMemo` for chapter list) | Medium |
| `components/student/chapter-detail-content.tsx` | Client wrapper for tabs + retry button; assignment list itself is static props | Medium |
| Teacher/admin `*-content.tsx` | Necessarily client today because they own `useEffect` data loading | High (coupled to navigation pattern) |
| `components/student/chapter-material-viewer.tsx` | Client but only renders iframe/link — **no real interactivity**; could be server | Low |
| `AssignmentGameRouter` / games | Correctly client (input, timers) | — |

---

## 4. Caching

| Location | Finding | Severity |
| --- | --- | --- |
| App-wide | **No** `unstable_cache`, `revalidate`, `React.cache`, Next `fetch` cache options, SWR, or React Query found | High (systemic) |
| `next.config.ts` | Empty — no cache/CDN tuning | Low |
| `app/api/chapter-materials/[chapterId]/route.ts` | Explicit `Cache-Control: private, no-store` on PDFs | Medium (materials tab) |
| Supabase queries in RSC/API/client | Default: always live round-trips | High |

### Highest-traffic reads to cache first

Impact-ranked; traffic is estimated, not measured.

| Rank | Read | Why | Impact |
| --- | --- | --- | --- |
| 1 | Auth session / role gate (`getUser` + `profiles.role`) | Hit on **every** nav + every admin API | High — but caching auth is risky; needs careful design |
| 2 | Student dashboard: `students` + `student_assignments` progress | Every student home visit | High |
| 3 | Teacher classroom roster + assignment aggregates | Core teacher loop | High |
| 4 | Admin list endpoints (teachers / classrooms / students / promotions) | Every admin page mount; currently uncached + re-authed | Medium–High |
| 5 | `hsk_chapters` / assignment metadata / question counts | Mostly static reference data | Medium |

---

## 5. Bundle / client JS

| Location | Finding | Severity |
| --- | --- | --- |
| `pdfjs-dist` in `package.json` + `public/pdf.worker.min.mjs` (1.3 MB) | **Not imported anywhere in app source.** Production `.next/static/chunks` has **no** pdfjs. Viewer is iframe → API. Dead weight in deps/public, **not** loaded on portal routes. | Low (cleanup; not a runtime nav cost) |
| `.next/static/chunks/54f6bf10002c5633.js` (~203 KB) | Still pulled into **every** student/teacher/admin portal route (and login) via client manifests | High |
| `components/layout/marketing-shell.tsx` | Imports `@/lib/supabase/client` for logout only → pulls Supabase into shell → **all portal pages** | High |
| Student dashboard/chapter content | Client components that don’t call Supabase still inherit shell’s Supabase chunk | Medium |
| `assignment-game-router.tsx` | `dynamic()` for Assignment B — good; A-level still eagerly imports `MandarinTypingGame` | Low |
| `components/student/assignment-exercise.tsx` / `assignment-flow.tsx` | Heavy client paths; **not wired** to current `/student/*` routes (legacy) | Low |

**Correction to prior hypothesis:** pdfjs is **not** loaded on every portal route. The 203 KB Supabase client chunk **is**.

---

## Top 5 changes (impact / risk)

| Rank | Change | Why first | Risk |
| --- | --- | --- | --- |
| **1** | Move teacher + admin list/detail data into the **server page** (kill the post-paint `useEffect` fetch) | Biggest “click → still Loading…” feel on the most navigated staff routes; skeletons already exist but content still waits a second phase | Medium — auth/RLS must stay correct |
| **2** | Add **portal `layout.tsx`** shells so header/nav don’t remount every navigation | Instant perceived continuity; small code move | Low |
| **3** | Fix Assignment B open path: use joined B questions **or** one parallel/in-query for A1–A3 instead of 3 sequential awaits | Directly cuts student assignment-start latency on a hot path | Low–Medium (verify B sync still correct) |
| **4** | Split logout out of `MarketingShell` (or lazy-load Supabase) so the **203 KB chunk isn’t on every portal page** | Cuts JS on the highest-traffic student pages that don’t need browser Supabase for render | Medium (logout UX must stay) |
| **5** | Pending UI for Sign Out, Assignment B save, admin approve/reject, lock toggles (optimistic checked state) | Cheap wins for “did my click register?” | Low |

---

## Unclear without measurement

Do not rank these higher until measured:

- How much of the student dashboard’s 3-phase server waterfall is Auth RTT vs DB
- Whether admin’s triple `getUser` is the dominant cost vs the list queries
- Real PDF download time with `no-store`

Region pairing (Vercel `sin1` + Supabase SIN) looked fine in a prior audit — not re-flagged as a bottleneck.
