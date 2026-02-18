# Phase 2: Text-to-Image Generation - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Core generation loop: user types a text prompt, selects aspect ratio and resolution filters, hits generate, and sees the resulting image displayed as the hero element. Includes loading state, inline error handling with retry, and cost/timeout indicators. Image-to-image editing, fullscreen view, download, and visual identity are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

User delegated all implementation decisions to Claude's optimization. The following areas are flexible — Claude chooses the best approach during planning and implementation.

**Prompt input design**
- Auto-expanding textarea that grows with content (min ~2 lines, max ~6 lines)
- Helpful placeholder text guiding the user (e.g., "Describe the image you want to create...")
- Cmd/Ctrl+Enter as keyboard shortcut to submit (button is primary submit method)
- No character limit display — keep it clean
- Generate button disabled when textarea is empty

**Aspect ratio selector**
- Visual pill buttons showing ratio shape indicators (small rectangles reflecting the ratio)
- Horizontally scrollable row on mobile to fit all 8 options compactly
- Compact grid or wrapped row on desktop where space allows
- 1:1 selected by default, clearly highlighted
- Each pill shows the ratio text (e.g., "16:9") with a small shape preview

**Image reveal experience**
- Output area completely hidden before first generation (no placeholder, no empty box)
- Smooth fade-in transition when image first appears
- On regeneration: previous image stays visible during loading, crossfades to new result
- Spinner overlays the previous image during regeneration (not replacing it with blank)

**Cost & warning display**
- Subtle muted text under or beside resolution pills showing per-image cost (e.g., "$0.13" / "$0.24")
- When 4K is selected, an inline note appears: "4K may take longer (up to 2 min)"
- Cost text uses smaller, secondary typography — informative but not alarming
- No modal or toast — everything inline and non-disruptive

</decisions>

<specifics>
## Specific Ideas

- Generated image is the hero — everything else is secondary (PRD directive)
- Error messages are inline, never modals — with a "Try Again" option
- Spinner with "Generating..." text during the entire generation wait
- Filters presented as compact controls below/beside the prompt area
- All filter values have sensible defaults (1:1, 1K)
- No streaming — wait for full response, then display

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-text-to-image-generation*
*Context gathered: 2026-02-18*
