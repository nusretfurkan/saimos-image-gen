# Phase 3: Image-to-Image Editing - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Upload or paste a reference image and transform it using a text prompt. Includes file picker, drag-and-drop, clipboard paste, thumbnail preview, client-side validation (format + size), and the generation flow that sends both image and prompt to the API. Text-to-image generation (Phase 2) and visual identity (Phase 4) are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion

User delegated all implementation decisions to Claude's judgment. The following areas are open for Claude to optimize during research and planning:

**Upload zone design**
- How the upload area looks and behaves
- Drag-and-drop visual feedback and hover states
- Prominence and integration with the prompt area
- Whether upload zone is inline, overlay, or dedicated section

**Reference image preview**
- Thumbnail size and positioning relative to prompt input
- Remove/replace behavior once an image is uploaded
- Preview quality and aspect ratio handling

**Mode switching**
- How image-to-image coexists with text-to-image
- Whether it's a separate tab, toggle, unified flow, or contextual (auto-detects when image is added)
- Transition UX between modes

**Before/after display**
- How original and transformed images are shown together
- Side-by-side, overlay, sequential, or toggle approach
- Whether comparison is optional or automatic

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User wants Claude to optimize all areas for the best user experience.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-image-to-image-editing*
*Context gathered: 2026-02-18*
