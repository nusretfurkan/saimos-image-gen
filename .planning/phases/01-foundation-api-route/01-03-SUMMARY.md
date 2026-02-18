---
phase: 01-foundation-api-route
plan: 03
subsystem: deployment
tags: [vercel, deployment, production, environment-variables, openai-fallback]

# Dependency graph
requires:
  - phase: 01-foundation-api-route
    plan: 02
    provides: POST endpoint at /api/generate with binary response
provides:
  - Live production URL at https://saimos-image-gen.vercel.app
  - GEMINI_API_KEY configured as Vercel production env var
  - OPENAI_API_KEY configured as Vercel production env var
  - OpenAI gpt-image-1.5 fallback for Gemini 503/429/timeout errors
  - All Phase 1 success criteria verified against production
affects: [02-01-PLAN, 03-01-PLAN, 04-01-PLAN, 05-01-PLAN]
---

## Summary

Deployed the project to Vercel production and verified all Phase 1 success criteria against the live URL. Added OpenAI gpt-image-1.5 as an automatic fallback when Gemini is unavailable (503/429/timeout), ensuring image generation works reliably.

## Self-Check: PASSED

## key-files

### created
- src/lib/openai.ts -- OpenAI gpt-image-1.5 client using raw fetch

### modified
- src/app/api/generate/route.ts -- Added OpenAI fallback in catch block, X-Image-Provider header
- src/lib/constants.ts -- Added OpenAI config constants and aspect ratio/resolution mapping tables
- .env.local -- Added OPENAI_API_KEY

## tasks-completed

| # | Task | Commit | Status |
|---|------|--------|--------|
| 1 | Deploy to Vercel and configure environment | `15bae1b` | ✓ |
| 2 | Verify Phase 1 success criteria on production | manual verification | ✓ |

## deviations

1. **Lazy Gemini initialization** — Changed from eager `new GoogleGenAI()` to lazy `getAI()` function to fix build-time crash when GEMINI_API_KEY is unavailable during Vercel build.
2. **OpenAI fallback added** — gpt-image-1.5 fallback for Gemini 503/429/timeout. Not in original plan but needed because Gemini model was consistently unavailable during execution.
3. **Gemini timeout reduced from 115s to 40s** — Vercel Hobby plan has shorter function limits; 40s leaves room for OpenAI fallback (~15s).

## Production Verification Results

| Check | Status |
|-------|--------|
| Valid prompt → image (200) | ✓ |
| Empty prompt → 400 with message | ✓ |
| Malformed body → 400 with message | ✓ |
| GET → 405 | ✓ |
| App accessible at public URL | ✓ |

## decisions

- Used raw `fetch` for OpenAI (no npm dependency) since only one endpoint is needed
- Fallback limited to text-to-image mode (OpenAI editing API has different contract)
- X-Image-Provider header indicates which provider generated the image
- Fallback is opt-in: only triggers if OPENAI_API_KEY env var is set
