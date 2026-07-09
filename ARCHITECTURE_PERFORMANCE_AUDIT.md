# Mandarin E-Learning Website Architecture and Performance Audit

Source: local codebase scan and production build of `template-web` on Jul 4, 2026.

Operational metrics such as production response times, concurrent users, Web Vitals, slow query logs, and APM traces were not present in the repository. Those areas are marked as unknown where applicable.

## Executive Summary

The app is a Next.js App Router monolith for a Mandarin e-learning platform. It combines static marketing pages, dynamic authenticated student/teacher/admin pages, Next.js route handlers, and Supabase Auth/Postgres/Storage.

The highest priority risks are:

- `seed_student_assignments` is a `SECURITY DEFINER` RPC granted to all authenticated users and does not check whether the caller may seed the target student.
- `/typing-hanzi` can load assignment questions from query params and write legacy progress without the newer `student_assignments` lock context.
- Two progress systems coexist: legacy `student_chapter_progress` / `student_assignment_progress` and newer `student_assignments` / `student_assignment_attempts`.
- PDF chapter materials are buffered through a Next API route with `Cache-Control: private, no-store`, so repeated views cannot benefit from browser/CDN caching.
- Teacher dashboard loads classrooms, then runs one count query per classroom, which is an N+1 pattern.
- Question import syncs Assignment B by looping chapters and querying A1, A2, and A3 sequentially per chapter.
- Assignment B typing appends the full initial word pool whenever rows shift, so long sessions or large pools can grow client state repeatedly.
- Static media includes a 1.9 MB PNG and several course images are referenced as CSS background images, bypassing Next image optimization.
- Admin list endpoints are unpaginated.
- No app-level cache layer, rate limiting, or background queueing was found.

## 1. Tech Stack

| Area | Finding |
| --- | --- |
| Frontend | Next.js App Router `16.0.10`, React `19.2.0`, TypeScript 5, Tailwind CSS 4 |
| Backend | Next.js route handlers and server components in the same app |
| Database | Supabase PostgreSQL through `@supabase/supabase-js` `2.99.3` and `@supabase/ssr` `0.9.0` |
| Auth | Supabase email/password auth with `profiles.role` and `profiles.status` |
| Storage | Supabase Storage private bucket `chapter-materials` for chapter PDFs |
| Analytics | `@vercel/analytics/next` in `app/layout.tsx` |
| Hosting clues | README recommends Vercel; no `vercel.json`, Dockerfile, or deployment config found |
| CDN | No explicit CDN config. Vercel/Supabase would provide platform CDN behavior when deployed, but PDFs are currently served as `no-store` |

Production dependencies are modest: Next, React, Supabase, Radix primitives, Lucide, `pdfjs-dist`, Vercel Analytics, and small utility packages.

## 2. Architecture Overview

The repository is a monolith:

- `app/`: Next.js App Router pages and API route handlers.
- `components/`: UI primitives plus student, teacher, admin, and layout components.
- `lib/supabase/`: server, browser, admin, and middleware Supabase clients.
- `lib/lms/`: LMS helpers for assignments, questions, attempts, materials, classroom logic, and scoring.
- `supabase/`: baseline schema plus LMS/admin/material migrations.
- `public/`: marketing images, SVGs, and a PDF worker file.

Rendering is hybrid:

| Route group | Rendering mode | Notes |
| --- | --- | --- |
| `/` | Static | Marketing homepage with local data and public image references |
| `/course/[id]` | SSG | Uses `generateStaticParams()` for 3 course pages |
| `/signup`, `/login`, `/enroll`, `/about` | Static | Public pages without server data dependency |
| `/student/dashboard`, `/student/chapter/[id]`, `/student/assignment/[id]` | Dynamic SSR | Server-side Supabase auth and data reads |
| `/teacher/*`, most `/admin/*` | Dynamic SSR or CSR over API | Role-protected pages with Supabase reads or client fetches |
| `/api/*` | Route handlers | REST-style JSON endpoints plus PDF streaming/upload endpoints |

Frontend/backend communication is mixed:

- Server components query Supabase directly with the server client.
- Client components use Supabase browser client for RLS-protected reads/writes.
- Privileged or workflow-specific actions use REST-style `fetch()` calls to `/api/*`.
- Admin/teacher APIs often use service-role clients after route-level role checks.

## 3. Data Layer

No ORM or query builder was found. The app uses Supabase JS/PostgREST directly.

Main tables:

| Table | Purpose |
| --- | --- |
| `profiles` | One row per auth user; role, status, email, full name |
| `teachers` | Teacher profile extension; optional legacy `teacher_code` |
| `students` | Student profile extension; teacher, classroom, current HSK level |
| `classrooms` | Teacher-owned classes with class code and HSK level |
| `hsk_chapters` | 90 seeded chapters: 9 HSK levels x 10 chapters |
| `assignments` | 4 assignment metadata rows per chapter: A1, A2, A3, B |
| `student_assignments` | Per-student assignment lock, completion, score, started/completed timestamps |
| `assignment_questions` | CSV-imported Mandarin questions: Hanzi answer, pinyin hint, meaning hint |
| `student_assignment_attempts` | Attempt history for assignment scores and A metrics |
| `promotion_flags` | Teacher/admin HSK promotion workflow |
| `chapter_materials` | One PDF metadata row per chapter, pointing to private storage path |

Mandarin content storage:

- Hanzi/character answers live in `assignment_questions.answer`.
- Pinyin hints live in `assignment_questions.pinyin_hint`.
- Meaning prompts live in `assignment_questions.meaning_hint`.
- A1-A3 questions are CSV-imported.
- Assignment B is generated from A1-A3 answers for the same chapter.
- No stroke order data, recorded audio files, video pipeline, flashcard system, or custom CJK font assets were found.

Authorization and consistency risks:

| Risk | Details |
| --- | --- |
| `SECURITY DEFINER` RPC | `seed_student_assignments` accepts arbitrary `p_student_id` and `p_hsk_level`, is granted to `authenticated`, and does not check `auth.uid()` or ownership |
| Question visibility | `assignment_questions_select_authenticated` lets any authenticated user read all question rows, regardless of HSK level, classroom, or assignment lock |
| Material access | `chapter_materials` metadata is readable to all authenticated users; PDF bytes are API-gated only by current HSK level |
| Non-transactional writes | Assignment completion updates current state then inserts attempt history; promotion approval and signup also span multiple independent writes |
| Legacy bypass | `/typing-hanzi` reads questions from `hsk`, `assignment`, and `chapterId` query params and uses legacy progress writes when no `studentAssignmentId` exists |

Index strategy:

| Category | Details |
| --- | --- |
| Present | `teacher_requests(status, created_at desc)`, `classrooms(teacher_id)`, `classrooms(upper(class_code))`, `student_assignments(student_id)`, `assignment_questions(assignment_id)`, `student_assignment_attempts(student_assignment_id, completed_at desc)` |
| Implicit | Primary keys and unique constraints on key relationships, including `student_assignments(student_id, assignment_id)` and `assignments(chapter_id, assignment_key)` |
| Likely missing | `students(classroom_id)`, `students(teacher_id)`, `profiles(role, created_at desc)`, `profiles(role, status, created_at desc)`, `promotion_flags(status, created_at desc)`, `promotion_flags(student_id, created_at desc)`, `classrooms(teacher_id, created_at desc)`, `assignments(chapter_id)` |
| Functional mismatch | `find_classroom_by_code` uses `upper(trim(class_code))`, but the migration index is `upper(class_code)`, so PostgreSQL may not use that index |

N+1 and fan-out patterns:

- Teacher dashboard fetches classrooms, then counts students once per classroom.
- Chapter-level lock/unlock sends one PATCH request per assignment.
- Assignment B import sync loops chapters and performs A1/A2/A3 queries per chapter.
- Admin classroom counts fetch all matching `students.classroom_id` rows and count in JavaScript.
- Admin list endpoints are unpaginated.

## 4. Media and Assets

| Asset area | Implementation | Performance note |
| --- | --- | --- |
| Chapter materials | One PDF per chapter in private Supabase Storage bucket `chapter-materials` | Max 20 MB, proxied through Next API |
| PDF delivery | `GET /api/chapter-materials/[chapterId]` downloads the full file into memory and returns `ArrayBuffer` | No streaming/range support and `Cache-Control: private, no-store` |
| PDF worker | `public/pdf.worker.min.mjs` | 1.3 MB; current viewer uses iframe rather than pdf.js |
| Largest image | `public/images/aboutpict.png` | 1.9 MB PNG; convert to AVIF/WebP or resize |
| Other images | `public/images/*.jpg` | Around 110-133 KB each |
| Course card images | CSS `backgroundImage: url(...)` | Bypasses Next image sizing, lazy loading, and format negotiation |
| Audio | No stored audio files found | Pronunciation uses browser `speechSynthesis` with `zh-CN` utterances |
| Video | No video files found | No video pipeline observed |
| Chinese fonts | No custom CJK font files or `next/font` usage found | Relies on system fallback for Chinese characters |

The build confirmed that `public/images` exists and totals about 2.5 MB. The largest single file is `aboutpict.png` at about 1.9 MB.

## 5. Frontend Performance Factors

Build output:

- `npm run build` succeeded.
- `.next/static` is about 1.6 MB.
- `.next/server` is about 23 MB.
- Largest observed JS chunks were around 203 KB and 210 KB.
- `public` totals about 3.8 MB.
- `node_modules` is about 453 MB locally, which is not a browser bundle metric.

Code splitting and hydration:

- Next App Router provides route-level chunking.
- Assignment B is dynamically imported with `ssr: false`.
- `AssignmentGameRouter` statically imports `MandarinTypingGame`, so B routes may still pay for A-game code.
- Portal shells hydrate broadly because layout shells are client components with auth, router/pathname, nav, logo, and logout behavior.
- `ChapterDetailContent` is fully client-rendered even though much of its assignment/material markup is static.

State management and caching:

- State management is local React state and direct Supabase/browser fetches.
- No Redux, Zustand, SWR, React Query, or equivalent client cache was found.
- Most client views refetch on mount and after mutations.
- Admin/teacher screens fetch whole datasets and filter/render client-side.

Runtime red flags:

- Assignment B `TypingGame` appends the full original word pool whenever rows shift. This can repeatedly grow client-side state.
- Course cards use CSS background images instead of `next/image`.
- `pdfjs-dist` and `public/pdf.worker.min.mjs` appear unused by the current iframe-based PDF viewer.
- Fonts are declared in CSS, but no `next/font` or `@font-face` loading was found.

## 6. Backend/API Performance Factors

| Path or flow | Type | Performance notes |
| --- | --- | --- |
| Student dashboard | Server component | Multiple Supabase reads across two `Promise.all` batches |
| Student chapter | Server component | Parallel profile/chapter/student/assignment/material reads, then extra question count query |
| Student assignment | Server component | Fetches assignment with nested questions; Assignment B runs extra combined A question fetches |
| `/typing-hanzi` | Dynamic legacy route | Loads questions directly from query params and does not enforce `student_assignments` locks |
| Complete assignment | `PATCH /api/student/assignments/[id]/complete` | Auth check, assignment ownership read, update, then insert attempt row |
| Chapter PDF | `GET /api/chapter-materials/[chapterId]` | Auth, access checks, admin metadata read, storage download, bytes returned `no-store` |
| Admin imports | `POST /api/admin/questions/import` | Parses CSV synchronously, deletes/reinserts questions in chunks, syncs B questions |
| Teacher lock toggle | `PATCH /api/teacher/assignments/[id]/toggle-lock` | One API request per assignment toggle; chapter toggle fans out multiple requests |

No Redis, in-memory cache, Next `unstable_cache`, explicit `revalidate`, rate limiter, or background queue was found. Expensive operations such as CSV import, PDF upload, PDF download, and Assignment B synchronization run synchronously in request handlers.

Average response times are unknown. Measuring this requires Vercel function logs, Supabase query stats, browser Web Vitals, or APM instrumentation.

## 7. Known Bottlenecks and Missing Operational Data

Known code-level bottlenecks:

- PDF proxying with full buffering and no caching.
- Teacher dashboard N+1 count queries.
- Unpaginated admin list endpoints.
- Client-side filtering/rendering of large portal datasets.
- Assignment B CSV regeneration and question loading fan-out.
- Legacy `/typing-hanzi` path bypassing current assignment lock model.
- Dual progress data models creating consistency risk.

Unknown operational areas:

| Area | Status |
| --- | --- |
| Average response times | Not available in repo |
| Slowest user-facing pages | No user reports, Lighthouse output, Web Vitals, or APM traces found |
| Error logs | Not available in repo |
| Slow query logs | Not available in repo |
| Recent slowdown correlation | Not inferable from code alone |
| User count and concurrency | Home/README imply hundreds or 500+ students, but production counts are unavailable |
| Data volume | Schema seeds 90 chapters and 360 assignment rows; actual students, attempts, questions, and PDFs are unknown |
| Growth trajectory | Not inferable from repository |

## 8. Scale Context

The curriculum metadata is bounded and small:

- 9 HSK levels.
- 10 chapters per level.
- 4 assignments per chapter.
- 360 seeded assignment metadata rows.

The scaling risk is mostly in user-linked and content-linked tables:

- Each student receives assignment rows for their HSK level, roughly 40 assignment rows per student per level.
- Attempt history can grow unbounded without retention, summarization, or pagination.
- PDF downloads can become expensive because files are proxied and not cached.
- Admin/teacher dashboards will degrade as classrooms, students, promotions, and assignment rows grow.
- RLS policy checks and missing indexes will matter more as table size increases.

## Recommended First Audit Targets

1. Lock down `seed_student_assignments` by revoking broad execute access or adding caller ownership/admin checks inside the function.
2. Remove or protect `/typing-hanzi` so all gameplay flows through `student_assignments`.
3. Consolidate progress onto `student_assignments` / `student_assignment_attempts` and retire legacy progress writes.
4. Move multi-step writes such as assignment completion, signup seeding, and promotion approval into transactional RPCs.
5. Add query plans and indexes for `students.classroom_id`, `students.teacher_id`, `profiles.role/status`, `promotion_flags`, and teacher dashboard classroom ordering.
6. Replace per-classroom count queries with grouped SQL, an RPC, a view, or a single aggregate endpoint.
7. Serve PDFs with signed URLs or cacheable authenticated delivery where access rules allow it.
8. Add pagination and search to admin list endpoints.
9. Convert `aboutpict.png` and other marketing images to WebP/AVIF, and avoid CSS background images for content images.
10. Fix Assignment B word state so it rotates/recycles from a bounded pool rather than appending the entire source pool repeatedly.
11. Remove `pdfjs-dist` and `public/pdf.worker.min.mjs` if iframe rendering is intentional, or actually use PDF.js if custom PDF rendering is needed.
12. Add instrumentation: Vercel Web Vitals, function timing logs, Supabase slow query logs, and production error tracking.

## Build Notes

`npm run build` succeeded.

Warnings observed:

- Next.js warned that the `middleware` file convention is deprecated in favor of `proxy`.
- Next.js inferred the workspace root from a parent `package-lock.json`, while this project also has its own `package-lock.json`. Set `turbopack.root` or remove the extra lockfile if needed for consistent builds.
- `baseline-browser-mapping` reported that its data is over two months old.

## 9. Runtime and Operational Findings

Source: operational data gathering on Jul 4, 2026. Methods included local production build (`npm run build` + `next start`), curl timing, GitHub deployment API, HTTP response headers, Supabase migration SQL review, Next.js build manifests, and attempted Lighthouse runs. Items without reachable dashboards, browser DevTools, or authenticated production access are marked explicitly.

### 9.1 Real Page Performance (Lighthouse / Web Vitals)

| Item | Finding |
| --- | --- |
| Production URL | `https://final-ver-4d9x0hkbb-ikigaisamurai8-9678s-projects.vercel.app` (GitHub Deployments API, Production environment, deployment `5278196301`, Jul 2, 2026) |
| Production reachability | HTTP 302 to Vercel SSO (`vercel.com/sso-api`). Deployment appears protected; unauthenticated Lighthouse/PageSpeed requests cannot load page content. |
| Lighthouse (local prod-like) | **Not completed.** Headless Chrome returned: *"Chrome prevented page load with an interstitial"* against `http://127.0.0.1:3456/` (multiple flag attempts). LCP, CLS, TBT, and INP were not captured. |
| Lighthouse (production) | **Skipped — no access.** Production URL requires Vercel SSO authentication. |
| Local prod-like TTFB (curl) | Measured against `next start` on `127.0.0.1:3456` after successful build on Jul 4, 2026. Warm local server; not representative of cold Vercel edge/function starts or Supabase latency from end users. |

| Page | HTTP | TTFB | Total | Response size | Notes |
| --- | --- | --- | --- | --- | --- |
| `/` (homepage) | 200 | 3.6 ms | 3.7 ms | 184 KB | Static prerender |
| `/login` | 200 | 5.5 ms | 5.6 ms | 9.5 KB | Static |
| `/about` | 200 | 6.0 ms | 6.0 ms | 31.5 KB | Static |
| `/student/dashboard` | 307 | 80.4 ms | 81.1 ms | 9.1 KB | Redirect without session cookie (middleware + server auth path) |
| `/teacher/dashboard` | 307 | 9.7 ms | 10.2 ms | 9.1 KB | Redirect without session cookie |
| `/admin/dashboard` | 307 | 11.7 ms | 12.1 ms | 9.1 KB | Redirect without session cookie |
| `/admin/login` | 200 | 6.7 ms | 6.8 ms | 13.5 KB | Static; bypasses middleware session refresh |

| Page | LCP | CLS | TBT / INP | Status |
| --- | --- | --- | --- | --- |
| Homepage | Unknown | Unknown | Unknown | Lighthouse blocked |
| Student dashboard | Unknown | Unknown | Unknown | Auth redirect only measured; Lighthouse blocked |
| Student chapter page | Unknown | Unknown | Unknown | Not measured (requires auth); Lighthouse blocked |
| Student assignment page | Unknown | Unknown | Unknown | Not measured (requires auth); Lighthouse blocked |
| Teacher dashboard | Unknown | Unknown | Unknown | Auth redirect only measured; Lighthouse blocked |
| Admin dashboard | Unknown | Unknown | Unknown | Auth redirect only measured; Lighthouse blocked |

Likely LCP/TBT contributors from code and build artifacts (not Lighthouse-confirmed):

| Page | Likely LCP element | Evidence |
| --- | --- | --- |
| Homepage | `/images/heropict.jpg` or `/images/aboutpict.png` | `app/page.tsx` uses `next/image` for hero and about sections; `aboutpict.png` is ~1.9 MB in `public/images/` |
| Homepage | CSS `backgroundImage` course cards | `app/page.tsx` references `/images/*.jpg` via inline `backgroundImage`, bypassing `next/image` optimization |
| Student/teacher/admin portals | Client JS hydration | All portal routes load shared chunk `54f6bf10002c5633.js` (~203 KB, contains `@supabase/ssr` + `@supabase/supabase-js`) plus route-specific portal shell chunks |
| Student assignment | Game/typing client code | `assignment-game-router.tsx` adds chunk `78ddc1b9b18ff07a.js` (~28 KB) containing typing-game code |

### 9.2 Network Waterfall Analysis

**Skipped — no access.** Browser DevTools Network tab was not available in this environment. Cold-cache waterfall, top-10 largest/slowest requests, and sequential fetch-chain patterns were not captured.

Based on static audit + local TTFB only, the three slowest *observed* server-response paths were:

| Rank | Route | Local TTFB | Why it stood out |
| --- | --- | --- | --- |
| 1 | `/student/dashboard` (unauthenticated) | 80 ms | Middleware `getUser()` network call + server-component redirect path |
| 2 | `/admin/dashboard` (unauthenticated) | 12 ms | Middleware + redirect |
| 3 | `/teacher/dashboard` (unauthenticated) | 10 ms | Middleware + redirect |

Authenticated SSR pages (student chapter, student assignment) were not loadable without credentials, so their real waterfalls remain unmeasured.

### 9.3 Supabase Query Performance (live data)

**Skipped — no access.** Supabase Dashboard Query Performance and `pg_stat_statements` were not reachable. No direct Postgres connection string exists in the repository or `.env.local`.

Cross-reference against static-audit suspects:

| Suspected pattern (from Section 3) | Confirmed in live query stats? |
| --- | --- |
| Teacher dashboard per-classroom student counts (N+1) | **Unknown** — no query stats |
| Assignment B CSV sync (A1/A2/A3 per chapter loop) | **Unknown** — no query stats |
| Admin classroom counts (fetch all `students.classroom_id`, count in JS) | **Unknown** — no query stats |

### 9.4 Supabase Connection Pooling Config

| Item | Finding |
| --- | --- |
| Connection method | HTTP via `@supabase/supabase-js` and `@supabase/ssr` only (`NEXT_PUBLIC_SUPABASE_URL` + anon/service keys). No `DATABASE_URL`, `DIRECT_URL`, or `pg`/Prisma/Drizzle client found. |
| Pooler mode (Session vs Transaction) | **Not applicable** to the current app architecture. The application does not open direct Postgres connections; it uses Supabase PostgREST/Auth/Storage REST APIs. |
| Port 5432 vs 6543 | **Not configured** in app env vars. Only relevant if direct SQL connections are added later. |
| Max connections / exhaustion evidence | **Skipped — no access.** Supabase logs/dashboard not reachable. |

Supabase project ref from response headers: `wrlwlcgpsdrvsxffawvs` (`sb-project-ref` header on REST endpoint).

### 9.5 RLS Policy Cost

Policies sourced from `supabase/schema.sql`, `supabase/migration_v2_lms.sql`, `supabase/migration_v2_assignment_questions.sql`, `supabase/migration_v2_chapter_materials.sql`, and `supabase/fix_profiles_rls_recursion.sql`.

Index context relevant to policy predicates:

| Table | Indexes on policy-relevant columns |
| --- | --- |
| `students` | Primary key on `user_id` only. **No** indexes on `teacher_id` or `classroom_id`. |
| `classrooms` | `classrooms_teacher_id_idx (teacher_id)`, `classrooms_class_code_idx (upper(class_code))` |
| `student_assignments` | `student_assignments_student_id_idx (student_id)` |
| `assignment_questions` | `assignment_questions_assignment_id_idx (assignment_id)` |
| `profiles` | Primary key on `id` only. **No** index on `role` or `(role, status)`. |
| `chapter_materials` | Primary key on `chapter_id` only |

Helper functions used by multiple policies (security definer, query `profiles` by `auth.uid()`):

- `public.is_admin()` — `exists (select 1 from profiles where id = auth.uid() and role = 'admin')`
- `public.is_active_teacher()` — `exists (select 1 from profiles where id = auth.uid() and role = 'teacher' and status = 'active')`

#### `assignment_questions`

| Policy | Operation | Subquery/join? | Indexed predicate columns? | Per-row risk |
| --- | --- | --- | --- | --- |
| `assignment_questions_select_authenticated` | SELECT | No (`using (true)`) | N/A | Low for RLS evaluation; full table readable by any authenticated user |
| `assignment_questions_insert_admin` | INSERT | Yes (`public.is_admin()`) | `profiles.id` PK only; `role` unindexed | Low (admin check once per statement, not per question row) |
| `assignment_questions_update_admin` | UPDATE | Yes (`public.is_admin()`) | Same as above | Low |
| `assignment_questions_delete_admin` | DELETE | Yes (`public.is_admin()`) | Same as above | Low |

#### `student_assignments`

| Policy | Operation | Subquery/join? | Indexed predicate columns? | Per-row risk |
| --- | --- | --- | --- | --- |
| `student_assignments_select_student_or_teacher` | SELECT | Yes — `exists (select 1 from students s where s.user_id = student_assignments.student_id and s.teacher_id = auth.uid())` OR `is_admin()` | `student_id` indexed; join uses `students.user_id` (PK) and `students.teacher_id` (**not indexed**) | **Medium–high** on large `student_assignments` — per-row EXISTS subquery on `students` |
| `student_assignments_insert_student` | INSERT | No subquery (`student_id = auth.uid()`) | `student_id` indexed | Low |
| `student_assignments_update_student` | UPDATE | No subquery | `student_id` indexed | Low |
| `student_assignments_update_teacher` | UPDATE | Yes — EXISTS on `students` by `teacher_id` | `teacher_id` **not indexed** | **Medium–high** per row |

#### `students`

| Policy | Operation | Subquery/join? | Indexed predicate columns? | Per-row risk |
| --- | --- | --- | --- | --- |
| `students_select_own` | SELECT | No — `auth.uid() = user_id OR teacher_id = auth.uid()` | `user_id` PK; `teacher_id` **not indexed** | **Medium** for teacher viewing many students |
| `students_insert_own` | INSERT | No | PK | Low |
| `students_update_own` | UPDATE | No | PK | Low |
| `students_update_teacher` | UPDATE | No — `teacher_id = auth.uid()` | `teacher_id` **not indexed** | Medium for bulk teacher updates |
| `students_select_admin` | SELECT | Yes (`is_admin()`) | `profiles.role` unindexed | Low (single admin check) |
| `students_update_admin` | UPDATE | Yes (`is_admin()`) | Same | Low |
| `students_delete_admin` | DELETE | Yes (`is_admin()`) | Same | Low |

#### `classrooms`

| Policy | Operation | Subquery/join? | Indexed predicate columns? | Per-row risk |
| --- | --- | --- | --- | --- |
| `classrooms_select_teacher_own` | SELECT | Yes — `exists (select 1 from students s where s.user_id = auth.uid() and s.classroom_id = classrooms.id)` OR `teacher_id = auth.uid()` OR `is_admin()` | `teacher_id` indexed; student join uses `students.user_id` (PK) + `classroom_id` (**not indexed**) | **Medium** for students in large classrooms lists |
| `classrooms_insert_teacher` | INSERT | Yes (`is_active_teacher()`) | `profiles.role/status` unindexed | Low |
| `classrooms_update_teacher` | UPDATE | No — `teacher_id = auth.uid()` | `teacher_id` indexed | Low |
| `classrooms_insert_admin` | INSERT | Yes (`is_admin()`) | Unindexed role check | Low |

#### `chapter_materials`

| Policy | Operation | Subquery/join? | Indexed predicate columns? | Per-row risk |
| --- | --- | --- | --- | --- |
| `chapter_materials_select_authenticated` | SELECT | No (`using (true)`) | N/A | Low for RLS cost; metadata readable by all authenticated users (~90 rows max) |

### 9.6 Middleware / Proxy Behavior

| Item | Finding |
| --- | --- |
| File | `middleware.ts` delegates to `lib/supabase/middleware.ts` → `updateSession()` |
| Deprecation warning | Build emits: *"The middleware file convention is deprecated. Please use proxy instead."* (Next.js 16.0.10) |
| Matcher paths | `/student/*`, `/teacher/*`, `/admin/*`, `/api/student/*`, `/api/teacher/*`, `/api/admin/*`, `/api/chapter-materials/*` |
| Bypass | `/admin/login` returns `NextResponse.next()` without session refresh |
| Runtime | Edge (`.next/server/edge/chunks/` in middleware manifest) |
| Per-request work | Creates Supabase SSR client from request cookies, then **`await supabase.auth.getUser()`** |
| Network call? | **Yes.** `getUser()` validates/refreshes the session against Supabase Auth servers; it is not a local JWT-only cookie read. |
| Redirects / rewrites | No explicit redirects in middleware itself; session refresh may set updated auth cookies on the response |

Evidence: every matched portal/API request pays at least one Supabase Auth round-trip before route handlers or server components run.

### 9.7 Supabase Storage & Egress

| Item | Finding |
| --- | --- |
| Bucket name | `chapter-materials` |
| Bucket visibility (migration) | **Private** (`public = false` in `supabase/migration_v2_chapter_materials.sql`) |
| Signed URLs in code | **None found.** No `createSignedUrl`, `getPublicUrl`, or `signedUrl` usage anywhere in the codebase. |
| Delivery path | PDF bytes downloaded server-side via `db.storage.from(...).download()` in `lib/lms/chapter-materials.ts`, then streamed from `GET /api/chapter-materials/[chapterId]` with `Cache-Control: private, no-store` |
| Max file size (migration) | 20 MB (`20971520` bytes) |
| MIME restriction | `application/pdf` only |
| `pdfjs-dist` / worker | `public/pdf.worker.min.mjs` (1.3 MB) exists but **pdfjs is not referenced in client JS chunks**; viewer uses iframe to API URL |
| Live bucket file count/sizes | **Skipped — no access.** Supabase Storage dashboard not reachable. |
| CDN caching (bucket/project) | **Skipped — no access.** Code explicitly sets `no-store` on PDF API responses, preventing browser/CDN caching regardless of bucket CDN settings. |

### 9.8 Bundle Analysis (real build output)

Method: `npm run build` on Jul 4, 2026 (Next.js 16.0.10 Turbopack). Per-route client JS deduplicated from `page_client-reference-manifest.js` files plus shared root chunks from `build-manifest.json`. `@next/bundle-analyzer` is **not installed** and `ANALYZE=true` is **not configured** in `next.config.ts`; interactive treemap was not generated.

Global client chunk totals:

| Metric | Value |
| --- | --- |
| All `.next/static/chunks/*.js` | ~1.5 MB on disk |
| Largest single chunk | `64d94a1b34fb7383.js` — 210 KB (Next.js shared framework/runtime) |
| Second-largest shared chunk | `54f6bf10002c5633.js` — 203 KB (`@supabase/ssr`, `@supabase/supabase-js`, auth-js) |
| Polyfill chunk | `a6dad97d9634a72d.js` — 110 KB |
| `pdfjs-dist` in client bundles | **Absent** |

| Route | Approx. unique client JS (deduped, incl. shared root) | Top route-specific contributors |
| --- | --- | --- |
| `/` (homepage) | ~567 KB / 11 chunks | `next/image` + `next/link` chunks (`b408e20bff74e639.js`, 22 KB); no Supabase client chunk on homepage |
| `/student/dashboard` | ~809 KB / 14 chunks | `components/student/dashboard-content.tsx` → `54f6bf10002c5633.js` (203 KB Supabase), `cf7f982da4db38c2.js` (27 KB), `653f47d948fde156.js`, `8c9197f25f629770.js` |
| `/student/chapter/[id]` | ~815 KB / 14 chunks | `components/student/chapter-detail-content.tsx` → same 203 KB Supabase chunk + `8f5fda5005950431.js`, `cf7f982da4db38c2.js`, `ff27b5154d54ba20.js` |
| `/student/assignment/[id]` | ~803 KB / 13 chunks | `components/student/assignment-game-router.tsx` → 203 KB Supabase chunk + `78ddc1b9b18ff07a.js` (28 KB typing game), `faa4f78150ef473c.js` |
| `/teacher/dashboard` | ~851 KB / 14 chunks | `components/teacher/dashboard-content.tsx` → 203 KB Supabase chunk + `da82fe69c8b5ce38.js` (39 KB), `0d714fa31d8e671d.js` (38 KB), `ff27b5154d54ba20.js` |
| `/admin/dashboard` | ~809 KB / 14 chunks | `components/admin/admin-dashboard-content.tsx` → 203 KB Supabase chunk + `65f7e24106661c95.js`, `cf7f982da4db38c2.js`, `ff27b5154d54ba20.js` |

Shared pattern across all authenticated portal routes: every route pays for the ~510 KB of shared Next.js root chunks **plus** the ~203 KB Supabase browser client chunk, regardless of page-specific UI.

### 9.9 Real Usage Data

| Data source | Status |
| --- | --- |
| Vercel Analytics dashboard (page views, Web Vitals) | **Skipped — no access.** `@vercel/analytics/next` is installed in `app/layout.tsx`, but the Vercel project analytics dashboard was not reachable from this environment. |
| Supabase row counts (`student_assignments`, `student_assignment_attempts`, `assignment_questions`, `profiles`) | **Skipped — no access.** Service-role REST count query was blocked in this environment; Supabase dashboard not reachable. |
| Error logs (Vercel functions, Supabase, last 7 days) | **Skipped — no access.** No log dashboard or CLI credentials available. |

### 9.10 Environment / Deployment Config

| Item | Finding |
| --- | --- |
| Hosting platform | **Vercel** (GitHub Deployments show Preview + Production environments; `x-vercel-id` header on deployment responses) |
| Production deployment URL | `https://final-ver-4d9x0hkbb-ikigaisamurai8-9678s-projects.vercel.app` |
| Deployment protection | Vercel SSO enabled (302 to `vercel.com/sso-api` for unauthenticated requests) |
| Vercel edge region (observed) | **`sin1`** (Singapore) — from `x-vercel-id: sin1::...` response header |
| Supabase project | `wrlwlcgpsdrvsxffawvs.supabase.co` |
| Supabase edge region (observed) | **Singapore (`SIN`)** — from Cloudflare `cf-ray: ...-SIN` on Supabase REST responses |
| Region mismatch? | **No evidence of mismatch.** Both Vercel deployment and Supabase API responses observed in Singapore region during testing. |
| `vercel.json` / explicit region config | **Not found** in repository |
| API route runtime | **Node.js (default).** No `export const runtime = 'edge'` found in any `app/**/route.ts` or page file. |
| Middleware runtime | **Edge** (middleware manifest uses `server/edge/chunks/`) |
| Node version (local build) | Node v24.14.0 |
| Env vars present (names only) | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_URL_TOKEN`, `ADMIN_APPROVAL_TOKEN`, `RESEND_API_KEY` |

### 9.11 Items Skipped — Manual Follow-up Required

The following items could not be completed in this environment and should be pulled manually:

1. **Lighthouse / Web Vitals (LCP, CLS, TBT/INP)** on production or SSO-authenticated deployment — headless Chrome failed locally; production URL requires Vercel SSO.
2. **Network waterfall analysis** (cold cache, top 10 largest/slowest requests, sequential fetch chains) — requires browser DevTools with authenticated session.
3. **Supabase Query Performance** (`pg_stat_statements` / Dashboard → Database → Query Performance) — no dashboard or direct SQL access.
4. **Supabase connection pool exhaustion logs** — no Supabase logs/dashboard access (note: current app uses HTTP API only, not direct Postgres pooling).
5. **Supabase Storage live bucket stats** (file count, total size, CDN toggle) — no Storage dashboard access.
6. **Vercel Analytics dashboard** (page views, real-user Web Vitals) — no Vercel project dashboard access.
7. **Supabase live row counts** for `student_assignments`, `student_assignment_attempts`, `assignment_questions`, `profiles` — REST count query blocked; use Supabase dashboard or SQL.
8. **Vercel function logs and Supabase error logs** (last 7 days) — no log dashboard access.
9. **Interactive bundle treemap** via `@next/bundle-analyzer` — package not installed; run `ANALYZE=true npm run build` after adding analyzer to generate per-route package breakdown visualization.
10. **Authenticated SSR page performance** (student chapter, student assignment with real data) — requires valid student session cookie and known entity IDs.
