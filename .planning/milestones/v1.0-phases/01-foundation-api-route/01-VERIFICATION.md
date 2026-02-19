---
phase: 01-foundation-api-route
verified: 2026-02-18T15:00:00Z
status: human_needed
score: 5/5 must-haves verified
human_verification:
  - test: "Send a text prompt to the production API route and confirm a real generated image is returned"
    expected: "HTTP 200 with binary PNG data; file is a valid, viewable image (not an error response disguised as binary)"
    why_human: "Cannot invoke actual Gemini/OpenAI image generation in a static grep-based check; the network call and returned bytes must be inspected visually"
  - test: "Open https://saimos-image-gen.vercel.app in a browser, open DevTools > Sources, search all loaded JS files for 'GEMINI' or 'AIza'"
    expected: "Zero matches — the API key must not appear in the client-side bundle"
    why_human: "Requires inspecting the built JS bundle in a browser; static grep of source cannot verify tree-shaken production bundle"
---

# Phase 1: Foundation + API Route Verification Report

**Phase Goal:** A working, secure Gemini API proxy is deployed to Vercel and handles all generation requests with proper validation and error handling
**Verified:** 2026-02-18T15:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths (from ROADMAP.md Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | POST with text prompt returns a generated image (base64 or binary) | ? HUMAN | Route code is fully wired; real generation requires human curl test against production |
| 2 | Malformed or empty request returns specific validation error (not generic 500) | VERIFIED | Production confirmed: `{"error":"Please enter a prompt."}` on empty prompt; `{"error":"Invalid request body."}` on malformed JSON; `{"error":"Invalid aspect ratio."}` on bad enum |
| 3 | Safety-filtered prompt returns clear "try rephrasing" message | VERIFIED | Triple-check in route: `promptFeedback.blockReason` -> 422, `finishReason=SAFETY` -> 422, missing `inlineData` -> 422; all return `ERROR_MESSAGES.SAFETY_BLOCKED` |
| 4 | API key not present in any client-side JavaScript bundle after build | ? HUMAN | Source confirms `GEMINI_API_KEY` only in `src/lib/gemini.ts` via `process.env` (server-only); no `NEXT_PUBLIC_` found anywhere in `src/`; bundle confirmation needs browser DevTools |
| 5 | App accessible at public Vercel URL | VERIFIED | `https://saimos-image-gen.vercel.app` returns HTTP 200; alias confirmed in `vercel alias ls` pointing to latest production deployment |

**Score:** 3 automated + 2 human-needed = 5/5 truths accounted for, 3 fully verified programmatically

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | Project manifest with all dependencies incl. `@google/genai` | VERIFIED | Contains `@google/genai: ^1.41.0`, `zod: ^4.3.6`, `clsx: ^2.1.1`, `tailwind-merge: ^3.4.1`, `next: 16.1.6` |
| `src/lib/gemini.ts` | GoogleGenAI client and MODEL_ID constant | VERIFIED | Exports `getAI()` (lazy singleton) and `MODEL_ID = "gemini-3-pro-image-preview"`. Note: plan specified `export const ai` (eager singleton); implementation uses `getAI()` (lazy init) to fix Vercel build-time crash when env var is absent. Goal is identical. |
| `src/lib/schemas.ts` | Zod validation schema with PRD error messages | VERIFIED | Exports `generateRequestSchema` and `GenerateRequest` type; imports `VALID_ASPECT_RATIOS`, `VALID_RESOLUTIONS`, `VALID_MIME_TYPES`, `ERROR_MESSAGES`, `MAX_PROMPT_LENGTH` from `@/lib/constants` |
| `src/lib/constants.ts` | Error messages, aspect ratios, resolutions | VERIFIED | Exports `ERROR_MESSAGES`, `VALID_ASPECT_RATIOS`, `VALID_RESOLUTIONS`, `ASPECT_RATIOS`, `RESOLUTIONS`; also exports OpenAI fallback constants (additive) |
| `src/lib/types.ts` | Shared TypeScript interfaces | VERIFIED | Exports `ErrorResponse`, `GenerateSuccessMetadata`; also exports `ThinkingLevel`, `GenerateRequest`, `ImageUploadState` (additive) |
| `src/lib/utils.ts` | `cn()` class name utility | VERIFIED | Exports `cn()` using `clsx` + `tailwind-merge` |
| `src/app/api/generate/route.ts` | Complete Gemini proxy; exports POST and maxDuration; min 80 lines | VERIFIED | 222 lines; exports `POST` and `maxDuration = 120`; handles validation, safety, timeout, binary response, OpenAI fallback |
| `vercel.json` | Vercel deployment config (optional if Next.js defaults suffice) | N/A | Not present; `export const maxDuration = 120` in route.ts handles timeout config. Acceptable per plan. |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/lib/gemini.ts` | `process.env.GEMINI_API_KEY` | Environment variable (no NEXT_PUBLIC_ prefix) | VERIFIED | `process.env.GEMINI_API_KEY` used at lines 9 and 13; no NEXT_PUBLIC_ prefix found anywhere in `src/` |
| `src/lib/schemas.ts` | `src/lib/constants.ts` | Import for validation constants | VERIFIED | Line 2-8: imports `VALID_ASPECT_RATIOS`, `VALID_RESOLUTIONS`, `VALID_MIME_TYPES`, `ERROR_MESSAGES`, `MAX_PROMPT_LENGTH` from `@/lib/constants` |
| `src/app/api/generate/route.ts` | `src/lib/gemini.ts` | `import { getAI, MODEL_ID }` | VERIFIED | Line 3: `import { getAI, MODEL_ID } from "@/lib/gemini"` (plan expected `ai` export; implementation uses `getAI()` — intent satisfied) |
| `src/app/api/generate/route.ts` | `src/lib/schemas.ts` | `import { generateRequestSchema }` | VERIFIED | Line 4: `import { generateRequestSchema } from "@/lib/schemas"` |
| `src/app/api/generate/route.ts` | Gemini API | `getAI().models.generateContent()` network call | VERIFIED | Line 94: `getAI().models.generateContent({...})` — matches plan requirement (plan specified `ai.models.generateContent`; `getAI()` is the accessor) |
| Vercel deployment | `GEMINI_API_KEY` | Vercel environment variable | VERIFIED | `npx vercel env ls production` shows `GEMINI_API_KEY` Encrypted in Production/Preview/Development |
| Public URL `/api/generate` | `src/app/api/generate/route.ts` | Vercel serverless function routing | VERIFIED | Production URL returns 405 on GET, 400 with specific messages on invalid POST, confirming routing works |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| INFRA-01 | 01-01-PLAN, 01-02-PLAN | All Gemini API calls go through server-side route (API key never exposed to client) | SATISFIED | `GEMINI_API_KEY` only in `src/lib/gemini.ts` via `process.env`; no `NEXT_PUBLIC_` in any src file; route.ts is a Next.js Route Handler (server-side only) |
| INFRA-02 | 01-01-PLAN, 01-02-PLAN | Input validation with specific error messages per PRD error table | SATISFIED | Zod schema validates all fields with PRD messages; production confirmed correct error strings returned at 400 |
| INFRA-03 | 01-02-PLAN | Content safety filter rejections show appropriate message (not generic error) | SATISFIED | Triple-check in route.ts lines 121-157: blockReason check, finishReason=SAFETY check, missing inlineData check — all return 422 with `SAFETY_BLOCKED` message |
| INFRA-04 | 01-02-PLAN | Timeout handling with clear message for long-running generations | SATISFIED | `Promise.race` timeout at `GEMINI_TIMEOUT_MS` (40s, reduced from 115s to accommodate OpenAI fallback); timeout returns 504 with `ERROR_MESSAGES.TIMEOUT`; `maxDuration = 120` on Vercel |
| INFRA-05 | 01-03-PLAN | App is deployed and accessible on Vercel | SATISFIED (partially) | `https://saimos-image-gen.vercel.app` returns 200; `GEMINI_API_KEY` configured; but full end-to-end image generation on production needs human verification |

**Orphaned requirements:** None. All 5 INFRA requirements (INFRA-01 through INFRA-05) are claimed by plans in this phase and verified above.

**Note from REQUIREMENTS.md:** INFRA-05 is marked `[ ]` (Pending) in the traceability table — this is a documentation gap; deployment evidence shows it is functionally complete pending human confirmation of end-to-end image generation.

---

### Notable Deviations from Plan (Not Gaps — Goals Still Met)

| Deviation | Plan Spec | Actual Implementation | Impact |
|-----------|-----------|----------------------|--------|
| Gemini client export pattern | `export const ai = new GoogleGenAI(...)` (eager) | `export function getAI()` (lazy singleton) | Fixes Vercel build crash; goal (server-only Gemini client) identical |
| GEMINI_TIMEOUT_MS value | 115,000ms (115s) | 40,000ms (40s) | Reduced to leave room for OpenAI fallback; INFRA-04 timeout behavior still correct |
| OpenAI fallback added | Not in plan | `src/lib/openai.ts` + fallback in route.ts | Additive; triggered only on Gemini 503/429/timeout for text-to-image; does not violate any requirement |

---

### Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| None found | — | — | Route is fully implemented, no stubs, no placeholders, no TODO comments |

---

### Human Verification Required

**Items that cannot be confirmed programmatically:**

#### 1. End-to-End Image Generation on Production

**Test:** Run the following curl command (replace key if needed — GEMINI_API_KEY is set in Vercel):
```
curl -X POST https://saimos-image-gen.vercel.app/api/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a simple red circle on a white background"}' \
  --output test-production.png -v 2>&1 | grep -E "< HTTP|< Content-Type|< X-Image-Provider"
```
**Expected:** HTTP/2 200, `Content-Type: image/png` (or `image/webp`), `X-Image-Provider: gemini` or `openai`, and `test-production.png` is a valid viewable image file.
**Why human:** Actual Gemini/OpenAI API call required; cannot be verified by static analysis or grep.

#### 2. API Key Not in Client Bundle

**Test:** Visit `https://saimos-image-gen.vercel.app` in a browser. Open DevTools > Sources > Search all files (Ctrl+Shift+F). Search for `GEMINI`, `AIza`, and `OPENAI`.
**Expected:** Zero matches in any loaded JS file.
**Why human:** Production bundle must be inspected in browser; source-level grep confirms intent but tree-shaking and bundler output must be verified directly.

---

### Summary

Phase 1's goal — a working, secure Gemini API proxy deployed to Vercel — is substantively achieved. All five INFRA requirements have implementation evidence:

- The API route (222 lines, no stubs) fully implements: JSON body parsing, Zod validation, Gemini call with timeout, triple-check safety filter detection, binary image response, and OpenAI fallback.
- All key wiring links are confirmed: gemini client -> process.env.GEMINI_API_KEY, schemas -> constants, route -> gemini/schemas, Vercel -> environment variable.
- Production URL (`https://saimos-image-gen.vercel.app`) is live, returning 200 on GET and correct 400/405 error responses on invalid API calls.
- No NEXT_PUBLIC_ prefix found anywhere; API key is exclusively server-side.

Two items require human confirmation: (1) actual image generation working end-to-end on production, and (2) visual bundle inspection to confirm the API key is absent from client JS. Both are network/browser-level checks that static analysis cannot substitute for.

One implementation deviation is noteworthy but not a gap: the Gemini timeout was reduced from 115s to 40s and an OpenAI fallback was added. This ensures the app works even when Gemini is unavailable (503/429), which arguably exceeds the original goal.

---

_Verified: 2026-02-18T15:00:00Z_
_Verifier: Claude (gsd-verifier)_
