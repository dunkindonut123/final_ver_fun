# Perceived Speed Recheck — Post-Fix

Date: 2026-07-09  
Scope: Investigation only against current code after the perceived-speed fix pass. No code/config/DB changes in this recheck.

Compared against [PERCEIVED_SPEED_ANALYSIS.md](PERCEIVED_SPEED_ANALYSIS.md).

---

## Verdict

The biggest user-facing issues from the prior audit are **fixed**:

| Prior issue | Current status |
| --- | --- |
| Teacher/admin client second loading phase | **Fixed** — all live portal pages server-fetch; no mount `useEffect` data loads |
| No shared portal layouts (shell remount) | **Fixed** — `student/(portal)`, `teacher`, `admin/(portal)` layouts |
| Missing / lost `loading.tsx` skeletons | **Fixed** — content-only skeletons under layouts; full shell only for `/student/assignment/[id]` |
| Assignment B 3× sequential A1/A2/A3 queries | **Fixed** — single query; prefers nested B rows |
| Supabase client on every portal page via shell logout | **Fixed** — dynamic import on Sign Out; student dashboard manifest no longer statically references `createBrowserClient` |
| Silent Sign Out / Assignment B save / admin approve | **Fixed** (promotions reject still text-only) |

What remains is mostly **server waterfall depth** (auth + sequential entity checks) and a few **weak pending-UI** edges — not the “click → Loading…” second phase.

---

## 1. Navigation latency

**Global tax (unchanged):** middleware `getUser()` + page-level `getUser()` on portal routes. Left alone per prior decision.

### Second loading phase (definitive)

| Route | Second phase? |
| --- | --- |
| `/student/dashboard` | **No** |
| `/student/chapter/[id]` | **No** (Materials iframe still deferred on tab) |
| `/student/assignment/[id]` | **No** |
| `/teacher/dashboard` | **No** |
| `/teacher/classroom/[id]` | **No** |
| `/teacher/student/[id]` | **No** on paint; attempt history lazy on expand |
| `/admin/dashboard` | **No** |
| `/admin/teachers` | **No** |
| `/admin/classrooms` | **No** |
| `/admin/promotions` | **No** |
| `/admin/materials` | **No** |
| `/admin/questions` | **No** on mount |
| `/admin/login` | N/A (client form) |

Dead (unrouted) client fetchers still exist: `assignment-flow.tsx`, `assignment-exercise.tsx` — not hit by live routes.

### Sequential round-trips before render

| Location | Finding | Severity |
| --- | --- | --- |
| All teacher pages | Still **~4 sequential** phases: auth → profile → entity → list loader (loader itself may chain more) | Medium |
| Admin portal pages | **~3 phases**: `getAdminPageContext` (auth+profile) → data `Promise.all` | Medium |
| Student dashboard / chapter | Still **3–4** phases, but well parallelized inside phases; data ships in first HTML | Medium |
| Student assignment A / B with synced rows | **1–2** phases | Low |
| `lib/admin/queries/classrooms.ts` | Internal classrooms → teachers → counts still sequential inside one loader | Low–Medium |
| `lib/teacher/queries/student-detail.ts` | Assignments → chapters → question counts still chained | Medium |

Skeletons now cover the wait, so sequential RTs hurt TTFB more than “frozen page” feel.

### Skeletons

| Pattern | Routes |
| --- | --- |
| Content-only (`PulseBlock` under layout) | Student portal, all teacher, all admin portal |
| Full `PortalLoadingShell` | `/student/assignment/[id]` only (no portal layout) |
| None | `/admin/login`, `/admin/students` (redirect) |

---

## 2. Interaction latency

| Location | Finding | Severity |
| --- | --- | --- |
| `marketing-shell.tsx` Sign Out | Pending + spinner + disabled | Low (good) |
| `assignment-b-game.tsx` complete | saving / saved / error UI | Low (good) |
| `admin-dashboard-content.tsx` approve/reject | Spinner + Approving…/Rejecting… | Low (good) |
| `admin-promotions-content.tsx` reject | Text “Rejecting…” only, no spinner | Low |
| `admin-promotions-content.tsx` confirm approve | “Approving…” on confirm | Low (good) |
| Teacher lock toggles | **Optimistic** checked flip; switch disabled; **no spinner / label** | Low–Medium |
| Create classroom, flag promotion, admin CRUD, materials, CSV import, retry, A-level save | Pending UI present | Low (good) |
| Admin dashboard action failure | Pending clears; **no error toast** if PATCH fails | Low |

Almost no true optimistic DB updates except lock toggles (with rollback).

---

## 3. Rendering / hydration

| Location | Finding | Severity |
| --- | --- | --- |
| Portal layouts | **Confirmed present** — shells persist across intra-portal nav | — (fixed) |
| Assignment / admin login | Correctly outside portal shells | — |
| Student dashboard/chapter content | Still client components for mostly static props | Low |
| Teacher/admin content | Still client (mutations, dialogs, local UI) — appropriate | — |
| `chapter-material-viewer.tsx` | Still client for iframe-only UI | Low |

---

## 4. Caching

| Location | Finding | Severity |
| --- | --- | --- |
| App-wide | Still **no** `unstable_cache`, `revalidate`, React Query/SWR | Medium (unchanged) |
| PDF API | Still `Cache-Control: private, no-store` | Medium |
| High-traffic reads | Same candidates as before: role gate, student dashboard progress, teacher classroom aggregates, admin lists, chapter metadata | Medium |

Caching was out of scope for the fix pass; still the next structural lever after waterfalls.

---

## 5. Bundle / client JS

| Location | Finding | Severity |
| --- | --- | --- |
| `MarketingShell` Supabase | Dynamic `import()` on logout only | — (fixed) |
| Student dashboard client manifest | **No** `createBrowserClient` static reference observed in current build output | — (improved) |
| `pdfjs-dist` | Still in `package.json` / `public/pdf.worker.min.mjs`; **not imported** in app source | Low (dead weight) |
| Teacher create-classroom / student games | Still pull browser Supabase where they need it | Expected |

---

## Already-done items (still not re-flagged)

- `seed_student_assignments` RPC lockdown  
- Query indexes migration  
- Teacher dashboard N+1 → batched counts (now server-side)  
- Assignment B word-pool growth  
- `getUser()` double-call (middleware + page) — still intentional  

---

## Top remaining changes (impact / risk)

| Rank | Change | Why | Risk |
| --- | --- | --- | --- |
| **1** | Parallelize teacher auth/entity checks (`Promise.all` profile + teacher record where safe) and collapse student-detail loader chain | Cuts TTFB on every teacher nav; skeletons already hide the wait but faster HTML is better | Low–Medium |
| **2** | Same for admin: consider combining role check with first data query, or caching role for the request | Admin pages always pay 2 auth RTs before data | Medium (auth correctness) |
| **3** | Add light caching for near-static reads (`hsk_chapters`, question counts, admin chapter materials list) | High reuse, low staleness risk | Low–Medium |
| **4** | Spinner/label on lock toggles + spinner on promotions Reject; surface failed admin approve/reject | Cheap polish for remaining “did it work?” moments | Low |
| **5** | Remove unused `pdfjs-dist` + worker; delete or quarantine dead `assignment-flow` / `assignment-exercise` | Bundle/deps hygiene | Low |

---

## Unclear without measurement

- How much of remaining latency is Auth RTT vs DB (middleware + page `getUser` still dominate wall-clock on fast DB).  
- Whether teacher student-detail’s internal 3-step loader is noticeable now that the page is server-rendered with a skeleton.  
- Real PDF load time with `no-store`.

Region pairing (Vercel `sin1` + Supabase SIN) not re-checked in this pass.
