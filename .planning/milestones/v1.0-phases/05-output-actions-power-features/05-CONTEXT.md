# Phase 5: Output Actions + Power Features - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Give the user full control over generated images — fullscreen viewing, downloading as PNG, copying to clipboard — and a thinking level toggle (low/high) that trades generation speed for quality. The core generation UI, upload flow, and visual identity are handled by earlier phases.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

The user delegated all implementation decisions to Claude. The following areas are flexible during planning and implementation:

**Fullscreen viewer feel:**
- Opening/closing transitions and animations
- What's visible in the overlay (image metadata, prompt text, or image only)
- Pinch-to-zoom on mobile (PRD says "nice-to-have, not required")
- Overall lightbox experience and gesture handling

**Image action buttons:**
- Button placement (below image, overlay on hover, toolbar, etc.)
- Icon-only vs icon+text vs text-only style
- Success/failure feedback pattern (toasts, inline confirmation, etc.)
- Copy-to-clipboard fallback when Clipboard API is unavailable

**Thinking level control:**
- Where the toggle lives in the UI (near filters, separate section, etc.)
- Default level (low or high)
- Label and terminology ("Thinking Level", "Quality", etc.)
- How the quality vs speed tradeoff is communicated to the user

### Locked by PRD

These are fixed — not at Claude's discretion:
- Fullscreen: dark semi-transparent backdrop, image displayed at contain (not cover), close via X button + backdrop click + Escape key
- Download: filename format `saimos-gen-{timestamp}.png`, trigger native save on mobile
- Thinking: two levels only — low and high

</decisions>

<specifics>
## Specific Ideas

No specific requirements — user is open to standard approaches optimized for the best experience.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-output-actions-power-features*
*Context gathered: 2026-02-18*
