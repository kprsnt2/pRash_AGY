# pRash Hub — Project Audit & Remediation Plan

> **Deliverable:** `audit_plan.md`
> **Project:** `prash-chat-hub` / pRash Hub — All-in-One Multi-Agent AI chat platform
> **Stack:** Next.js 14.2.15 (App Router) · React 18.3 · TypeScript 5.5 (strict) · Tailwind 3.4 · IndexedDB (idb-keyval) · react-markdown + KaTeX/GFM
> **Repo:** `kprsnt2/pRash_AGY` (per `DEPLOY.md`)
> **Audit method:** Static review of all source, config, and docs; `tsc --noEmit`; `npm audit`; dependency/usage cross-checks. No runtime/logins performed.
> **Overall assessment:** Solid, cleanly-architected prototype/POC that **over-promises "production-ready."** The core cascade-failover chat loop works and the code is type-clean, but there are security, correctness, and dependency issues that should be resolved before a public deploy.

---

## 1. Executive Summary

The app has a genuinely nice foundation: strict TypeScript, small focused components, a working multi-provider failover cascade, zero-training privacy routing, local-first storage, GFM/KaTeX markdown, and a printable worksheet view. `tsc --noEmit` passes with zero errors.

However, the audit surfaced several issues that conflict with the "production-ready" and "private/sovereign" claims made in `README.md`/`DEPLOY.md`. The most important:

- **Security:** The public `/api/chat` route has **no authentication or rate limiting**, and it happily spends the server's own env-var API keys (OpenAI/Gemini/NVIDIA/Groq) on behalf of *anyone* who can reach the URL — a cost-abuse vector that the docs actively encourage deploying publicly. Combined with **known Next.js 14.2.15 advisories (1 critical / 1 high incl. SSRF & cache-poisoning)** and **plaintext API keys in `localStorage`**, this is the largest risk.
- **Correctness:** **PDFs are silently dropped end-to-end** despite being advertised (accepted by the picker, shown as a chip, but never parsed or sent to any model). **Provider `BASE_URL` env vars, if set as documented in `.env.example`, break OpenAI/NVIDIA/Groq** (they omit the `/chat/completions` path). Several **default model IDs (`gpt-5.4-mini`, `gpt-5.4-nano`) appear non-standard** and would 404 on first use. **Vision attachments are sent to text-only failover models** (NVIDIA/Groq defaults) with no capability guard, turning a failover into a second failure.
- **Quality gaps:** No tests, no lint config (the `lint` script can't actually run cleanly), no error boundaries, dead code (`AgentIcon`, `rehype-highlight`, `code`/`other` attachment paths), intermittent a11y/keyboard issues, and minor state bugs (`createdAt` overwritten on every save).

Everything below is grouped by theme, rated **P0–P3**, given a file/line reference, and rolled into phased remediation with effort estimates.

---

## 2. Findings by Area

Legend — **Severity:** 🔴 P0 Critical · 🟠 P1 High · 🟡 P2 Medium · 🟢 P3 Low / polish. **Effort:** S ≈ <1h, M ≈ <1d, L ≈ multi-day.

### 2.1 Security & Privacy

| # | Sev | Finding | Evidence | Impact / Recommendation |
|---|-----|---------|----------|------------------------|
| S1 | 🔴 P0 | **Unauthenticated, un-rate-limited public API route exposes server secrets.** `/api/chat` runs with no auth and calls providers with `process.env.*` keys when the client doesn't override them. Any visitor to a public URL can drain the owner's paid keys. | `src/app/api/chat/route.ts:26-36,51-66` | Cost abuse / key exhaustion. **Add a shared-secret bearer token or simple password gate** (env `APP_ACCESS_TOKEN` checked in the route), plus basic IP/user rate limiting. At minimum, gate env-key usage behind an auth header. |
| S2 | 🔴 P0 | **Known Next.js 14.2.15 vulnerabilities** (SSRF in server actions/rewrites, RCE on Windows-hosted servers, cache poisoning, DoS). | `package.json:15`; `npm audit` → **1 critical + 1 high** | Deployed-server risk. **Upgrade Next.js** to the latest patched 14.2.x line and bump `postcss`. Note: `npm audit fix --force` jumps to Next 16 (breaking) — plan a migration (§5, Phase 1). |
| S3 | 🟠 P1 | **API keys stored in plaintext `localStorage`** (acknowledged feature, but risky on shared machines; XSS would exfiltrate them). | `src/lib/storage.ts:61-79`; `SettingsModal.tsx` inputs | Confirm/intend it; document the risk, and ensure **no inline scripts / `dangerouslySetInnerHTML`** widen the XSS surface. Consider an in-session-only (memory) key option. |
| S4 | 🟡 P2 | **No Content-Security-Policy / security headers.** KaTeX CSS is loaded from a third-party CDN `<link>`; no CSP, HSTS, etc. | `src/app/layout.tsx:18-23` | Add a `headers()` config / middleware with a reasonable CSP (self-host KaTeX to relax it), `X-Content-Type-Options`, `Referrer-Policy`. |
| S5 | 🟡 P2 | **Client-supplied `customKeys` are trusted verbatim** (fine for harm-to-self, but enables using the server as an open proxy to arbitrary `*_BASE_URL`). | `route.ts:11-20,52-66` | Allow-list/ignore `BASE_URL` overrides from the client, or pin provider hostnames server-side. Prevents the endpoint being used to hit internal services (SSRF relay). |

### 2.2 Correctness / Functional Bugs

| # | Sev | Finding | Evidence | Impact / Recommendation |
|---|-----|---------|----------|------------------------|
| C1 | 🔴 P0 | **`*_BASE_URL` env vars, set exactly as `.env.example` instructs, break OpenAI/NVIDIA/Groq.** Defaults are full `/chat/completions` URLs; the env docs use *base* URLs (`…/v1`), and the route uses either one interchangeably. | `route.ts:52-66,128-135,162-168`; `models.ts:24,51,63`; `.env.example:9,19,24` | 404 on every call. **Standardize:** either make defaults base URLs and always append the provider path, or document env as full endpoints. Normalize in one helper (e.g. ensure `${base}/chat/completions`). |
| C2 | 🟠 P1 | **PDF support is non-functional.** `.pdf` is accepted by the picker and rendered as a chip, but `detectAttachmentType` → `'pdf'` → binary `readAsDataURL` (no `extractedText`); both provider builders then **skip any non-image attachment lacking `extractedText`**. No PDF parser exists in the project. | `file-utils.ts:16,77-91`; `route.ts:259,393`; `ChatInput.tsx:176` (accept) | Feature silently missing. **Options:** add client-side PDF text extraction (`pdfjs-dist`) into `extractedText`, **or** remove `.pdf` from `accept` + README claims until implemented. (Depends on feature intent.) |
| C3 | 🟠 P1 | **Vision attachments forced onto text-only failover models.** Images are pushed regardless of the target model; NVIDIA/Groq defaults are `vision:false`, so a cascade failover carrying an image becomes a second 400 error. | `route.ts:251-258,384-392`; `models.ts:47,60` | Ruins the headline "zero-downtime" promise for image queries. **Guard on `vision` capability:** strip image parts for non-vision providers (with a user-visible note), or route image+attachment flows only through vision-capable providers/models. |
| C4 | 🟠 P1 | **Default model IDs likely invalid** (`gpt-5.4-mini`, `gpt-5.4-nano` don't match known OpenAI catalogs; would 404 on first use). | `models.ts:19-20`; `.env.example:7` | Immediate first-run failure. **Verify every default ID against each provider's current model list** and correct, or validate model IDs on startup and surface a clear error. *(Couldn't web-confirm current OpenAI naming at audit time — flagged for validation.)* |
| C5 | 🟡 P2 | **`createdAt` is overwritten on every message save**, so a session's creation time drifts forward. | `src/app/page.tsx:87-95` | Preserve the original `createdAt` from the existing session/loaded record. |
| C6 | 🟡 P2 | **`isWorksheet` heuristic is brittle** — any assistant message containing "Answer Key"/"Student Name:" shows a *Print Worksheet* button. | `MessageItem.tsx:45-50` | Prefer an explicit signal (`agentId === 'printnova'` or response metadata) rather than substring sniffing. |
| C7 | 🟢 P3 | **"Retry" after a completed turn would duplicate** the turn (uses `handleSendMessage` which appends). Currently only shown on error, so low risk. | `page.tsx:288-294,253-265` | Track "last failed" state and only offer retry for the failed turn. |
| C8 | 🟢 P3 | `isTemporary` session flag is defined but never used (privacy uses `isPrivacyMode`); `FailoverAttempt.latencyMs` never populated; `'attempted'` status never surfaced. | `types/chat.ts:20,54; route.ts:44-47` | Remove unused fields or wire them up (latency would improve the failover log UX). |

### 2.3 Reliability & Resilience

| # | Sev | Finding | Evidence | Recommendation |
|---|-----|---------|----------|----------------|
| R1 | 🟡 P2 | **No App Router error boundaries / loading / not-found pages.** A throw in a component blanks the app. | `src/app/` (only `layout`, `page`, `globals`, `api/chat`) | Add `error.tsx`, `global-error.tsx`, `loading.tsx`, `not-found.tsx`. |
| R2 | 🟡 P2 | **No request-body size cap on the route**; many large base64 images can balloon memory. `serverActions.bodySizeLimit` in `next.config.mjs` is irrelevant (no server actions used). | `route.ts:28`; `next.config.mjs:4-8` | Enforce an attachment count/total-size limit server-side with a clear error; drop the misleading server-actions config. |
| R3 | 🟢 P3 | Provider errors on a rate-limit/quota are treated identically to hard failures; no backoff or "cool-down" between attempts. | `route.ts:180-187` | Consider a short delay/backoff between cascade attempts and clearer error copy when *all* providers are exhausted. |

### 2.4 Performance

| # | Sev | Finding | Evidence | Recommendation |
|---|-----|---------|----------|----------------|
| P1 | 🟡 P2 | **Full markdown re-parse on every streamed chunk.** `setMessages` bumps the whole list each chunk and `MessageItem` re-renders/re-parses via ReactMarkdown → O(n²)-ish jank on long answers (labs/worksheets/contracts are long). | `page.tsx:237-249`; `MessageItem.tsx:172-176` | Memoize `MessageItem` (`React.memo`) and/or throttle streaming updates (e.g. batch on `requestAnimationFrame` ~ every 50–100ms). |

### 2.5 Code Quality, Dead Code & Maintainability

| # | Sev | Finding | Evidence | Recommendation |
|---|-----|---------|----------|----------------|
| Q1 | 🟢 P3 | **Dead code:** `AgentIcon.tsx` is unused (imported once into `AgentSelector.tsx` but never rendered — selectors use `badgeEmoji`). | `AgentIcon.tsx`; `AgentSelector.tsx:6` | Delete `AgentIcon.tsx` + the unused import. |
| Q2 | 🟢 P3 | **Unused dependency:** `rehype-highlight` declared but never imported → code blocks are not syntax-highlighted. | `package.json:19` | Either wire it into `MessageItem`/`WorksheetPrintModal` ReactMarkdown (`rehypePlugins`) **or** remove it. |
| Q3 | 🟢 P3 | **Unreachable branches:** `AttachmentType` includes `'code'` and `'other'`, but `detectAttachmentType` never returns `'code'`, and only `'pdf'`/non-text reach `'other'`. | `types/chat.ts:1`; `file-utils.ts:11-33,60`; `AttachmentManager.tsx:58` | Collapse to the types actually produced, or return `'code'` for source files. |
| Q4 | 🟢 P3 | `MessageMetadata` fields (`isDoctorReport`, `prescriptionsFound`, `abnormalLabsFound`, …) and `enableMedicalLayout` are defined/labeled but no special layout renders. | `types/chat.ts:23-31`; `AgentSelector.tsx:87-89` | Implement the promised layouts or trim the unused metadata to avoid over-promising. |
| Q5 | 🟢 P3 | Inconsistent provider/labeling: `MessageItem` still references legacy agent ids (`'worksheet'`) alongside legacy map handling. | `MessageItem.tsx:45-50` | Rely on `getAgentById` legacy map consistently. |

### 2.6 Testing & Tooling

| # | Sev | Finding | Evidence | Recommendation |
|---|-----|---------|----------|----------------|
| T1 | 🟠 P1 | **Zero tests** — no test runner, no unit/integration/e2e, no `test` script. | `package.json:5-10` | Add Vitest (+ React Testing Library) for `getProviderCascade`, `storage`, `file-utils`, attachment building; add an e2e smoke test (Playwright) for send→stream. |
| T2 | 🟠 P1 | **Lint is configured but unusable** — `"lint": "next lint"` exists but there's **no ESLint config**, so it prompts/fails to run cleanly (esp. in CI). | no `.eslintrc*`/`eslint.config.*` found | Add `eslint-config-next` + `eslint-plugin-*`, an `.eslintrc`, and enforce in CI. |
| T3 | 🟡 P2 | No CI (GitHub Actions) to run typecheck/lint/test/build on PRs. | repo | Add a minimal workflow so §5 gates are enforced. |

### 2.7 Accessibility & UX

| # | Sev | Finding | Evidence | Recommendation |
|---|-----|---------|----------|----------------|
| A1 | 🟡 P2 | **Non-interactive elements as controls:** session rows and attachment chips are `<div onClick>` — not keyboard-focusable/operable. | `Sidebar.tsx:154-163`; `AttachmentManager.tsx:43` | Use `<button>` (or add `role`/`tabIndex`/key handlers). |
| A2 | 🟡 P2 | **Modals lack keyboard/AT affordances:** no *Esc*-to-close, no focus trap/focus restore, no `role="dialog"`/`aria-modal`. | `SettingsModal.tsx`, `WorksheetPrintModal.tsx`, `AttachmentManager.tsx:89` | Add Esc handling, focus trap + restore, and dialog ARIA. |
| A3 | 🟢 P3 | Icon-only buttons rely on `title` only in places (no `aria-label`); streaming loader/status are not announced. | `ChatArea.tsx`, `ChatInput.tsx` | Add `aria-label`s and an `aria-live` region for streaming/error status. |

### 2.8 Dependencies / Supply Chain

| # | Sev | Finding | Evidence | Recommendation |
|---|-----|---------|----------|----------------|
| D1 | 🔴 P0 | `npm audit` reports **1 critical + 1 high** for prod deps (`next@14.2.15` and its bundled `postcss`) — incl. SSRF, cache poisoning, Windows RCE. | `npm audit --omit=dev` | Upgrade Next.js to latest patched 14.2.x **now**; schedule a Next 15/16 migration (§5 Phase 1). Fixing via `npm audit fix --force` is a **breaking** change — do it deliberately. |
| D2 | 🟢 P3 | `rehype-highlight` installed but unused (see Q2). | `package.json:19` | Use or remove. |

### 2.9 Documentation Accuracy (README/DEPLOY)

| # | Sev | Finding | Recommendation |
|---|-----|---------|----------------|
| DOC1 | 🟡 P2 | README/DEPLOY advertise **PDF** analysis and "20+ attachments" that don't work as-is (C2); "production-ready" and "stored securely in localStorage" overstate reality (S1/S3). | Correct docs to match shipped behavior, or ship the features. Add a "Self-host / keep private" security note. |
| DOC2 | 🟢 P3 | `.env.example` `*_BASE_URL` comments are the direct cause of C1. | Fix the example to full endpoints (or whatever convention is chosen) after C1. |

---

## 3. What's Good (keep it)

- Strict TypeScript throughout; `tsc --noEmit` is clean.
- Clean, small, single-responsibility components with clear prop contracts.
- The failover cascade + live failover-chain badge is a genuinely useful, well-structured feature.
- Privacy mode correctly gates **both** provider routing and IndexedDB persistence (`storage.ts:10`, `page.tsx:67`).
- Local-first data sovereignty with JSON export/import is easy and dependency-light.
- Solid markdown stack (GFM tables + KaTeX) that the MetricMancer/RxSleuth/PrintNova agents actually benefit from; thoughtful print stylesheet for worksheets.

---

## 4. Prioritized Remediation Plan

Phased so you get risk reduction fast. Each item links to its finding ID.

### Phase 0 — Security & Correctness Blockers (do first, ~2–4 days)
1. **Add auth + rate limiting to `/api/chat`** (S1) — shared bearer token from env; per-IP throttle. *M*
2. **Upgrade Next.js to latest patched 14.2.x + bump postcss** (D1/S2). *S–M*
3. **Fix provider URL resolution** (C1) — one helper; update `.env.example` to match (DOC2). *S*
4. **Verify/correct default model IDs** (C4) — validate against each provider; add a startup/env validation with clear errors. *S*
5. **Guard vision on non-vision failover** (C3) — strip image parts for text-only models + notify user. *M*
6. **Decide PDF story** (C2): implement `pdfjs-dist` extraction **or** remove `.pdf` from `accept`/docs until done. *M or S*
7. Restrict client `customKeys` BASE_URL override / pin hostnames (S5). *S*

**Exit criteria:** public endpoint can't burn server keys without the token; all four providers callable with documented env config; image queries survive a failover; dependency audit shows no critical/high in prod deps.

### Phase 1 — Hardening & Operational Readiness (~1 week)
8. **Content-Security-Policy + security headers**; self-host KaTeX (S4). *M*
9. Migrate **Next.js 15/16** on a branch with tests (D1). *L*
10. App Router **error/loading/not-found boundaries** (R1). *S*
11. **Request body/attachment size limits** + clearer errors (R2). *S*
12. Set up **GitHub Actions CI**: `typecheck → lint → test → build` (T3) and fix the **ESLint config** so `npm run lint` actually works (T2). *M*
13. Align **README/DEPLOY** with reality (DOC1) — incl. "not for public multi-tenant use without auth" note. *S*

### Phase 2 — Quality, Tests, UX (~1–2 weeks)
14. **Vitest** unit tests for `getProviderCascade`, `storage`, `file-utils`, attachment/S SE builders, cascade failover (T1). *M*
15. **Streaming perf**: `React.memo(MessageItem)` + throttled update batching (P1). *M*
16. **Accessibility**: real buttons for rows/chips, modal Esc + focus trap + ARIA, `aria-label`s, `aria-live` streaming status (A1–A3). *M*
17. Fix small correctness/state: preserve `createdAt` (C5), worksheet detection by signal (C6), retry-only-failed (C7). *S*
18. **Dead-code cleanup**: remove `AgentIcon` (Q1), unused `rehype-highlight` or wire it up (Q2/D2), collapse unreachable `'code'/'other'` paths (Q3), trim/implement `MessageMetadata`/medical layout (Q4), legacy-id handling (Q5). *S*

### Phase 3 — Backlog / Enhancements (optional)
- Populate `failoverChain.latencyMs` and render latency in the Cascade Log (C8).
- Session rename/pin, message-level regenerate/edit, token/cost estimator.
- Streaming via a typed protocol/`EventSource` instead of raw `X-Prash-*` headers + text stream (observability + robustness).
- Decide medical/crisis-disclaimer in-app banner for the CBT/Doctor agents (safety copy) if targeting non-technical users.

---

## 5. Quick Wins (high value / low effort)
- Fix provider BASE_URL handling + `.env.example` (C1/DOC2). *S*
- Add a simple token/rate-limit gate to the API route (S1). *S*
- Remove unused `rehype-highlight` or actually enable highlighting (Q2/D2). *S*
- Delete dead `AgentIcon.tsx` + import (Q1). *S*
- Add `.eslintrc` so `npm run lint` works (T2). *S*
- Preserve original `createdAt` (C5). *S*
- Add `error.tsx`/`not-found.tsx` boundaries (R1). *S*

---

## 6. Verification Steps (run after each phase)
```bash
# Type safety
npx tsc --noEmit -p tsconfig.json

# Lint (after adding config)
npm run lint

# Unit tests (after Phase 2)
npm test            # or: npx vitest run

# Dependency audit (should be clean of critical/high in prod deps)
npm audit --omit=dev

# Production build
npm run build && npm run start
# Manual smoke: send text (cascade badge), send an image (verify failover keeps vision),
# toggle Privacy Mode (verify Gemini-only + nothing persisted to IndexedDB),
# attach a PDF (verify behavior matches the post-C2 decision).
```

---

## 7. Appendix — File Inventory Reviewed
- **App:** `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/app/api/chat/route.ts`
- **Components:** `AgentIcon.tsx`, `AgentSelector.tsx`, `AttachmentManager.tsx`, `ChatArea.tsx`, `ChatInput.tsx`, `MessageItem.tsx`, `ModelSelector.tsx`, `SettingsModal.tsx`, `Sidebar.tsx`, `WorksheetPrintModal.tsx`
- **Lib:** `agents.ts`, `file-utils.ts`, `models.ts`, `storage.ts`  ·  **Types:** `types/chat.ts`
- **Config/Docs:** `package.json`, `next.config.mjs`, `tsconfig.json`, `postcss.config.mjs`, `tailwind.config.ts`, `.env.example`, `.gitignore`, `README.md`, `DEPLOY.md`
- **Tools:** `tsc --noEmit` (clean), `npm audit` (1 critical + 1 high), grep/find for usage & dead code.

---

*Prepared as an implementation-plan deliverable. Phases 0–1 address the security/correctness gaps that most conflict with the project's stated goals; Phase 2 raises engineering quality; Phase 3 is optional productizing.*
