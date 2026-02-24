# Snap Overlay Feature (Element Detection for Screenshots)

## Status: Planning / Not Yet Implemented

## What It Is
When capturing a screenshot, instead of manually dragging a region, the user hovers over UI elements and the overlay highlights/snaps to that element's bounding box. Click to capture. Similar to CleanShot X's element detection.

## Recommended Approach: Accessibility API (AX Tree)

Pre-compute element positions rather than querying on every mouse move:

1. User presses hotkey
2. **Enumerate all visible AX elements + their frames** into a flat list (new N-API addon function)
3. Take the full-screen screenshot (existing `screencapture -x`)
4. Overlay shows frozen screenshot + uses pre-computed list for instant hit-testing on hover
5. Hovering highlights the tightest bounding element under cursor
6. Click → snap selection to that element's bounds

### Why AX Over Computer Vision
- Already have N-API addon infrastructure (`ax_url_reader.node`) + TCC permissions
- AX gives logical element boundaries (buttons, cards, inputs) not just visual edges
- Works for native apps AND browser content (browsers expose DOM via AX)
- No heavy dependencies (OpenCV etc.)

### Implementation Details
- Walk AX tree to depth 6-8 levels
- Collect elements with meaningful frames (width > ~20px, height > ~20px)
- Skip decorative/layout containers
- Pre-computation adds ~200-800ms before overlay appears (acceptable tradeoff)
- Existing `ax_url_reader.mm` N-API addon would need a new exported function for element enumeration

### Open Design Questions
1. **Snap as default or toggle?** Recommendation: toggle (e.g., hold Option for snap mode). Snap won't work well for custom-rendered canvases, games, etc. Free-drag remains default.
2. **Parent/child navigation?** v1: just snap to tightest element. v2: scroll wheel to expand/contract to parent/child elements.
3. **Primary target: browser content or all apps?** Browser AX trees are most reliable. Native apps are hit-or-miss.

### Risks / Caveats
- AX tree structure varies wildly between apps
- Element frames may not perfectly match visual boundaries (padding, overflow, CSS transforms)
- Complex web pages can have thousands of AX elements — need depth limiting
- Some apps (games, Electron apps with custom rendering) may have poor AX trees

## Current Capture Architecture Reference
See the main capture flow in:
- `apps/desktop/src/capture/captureManager.ts` — orchestrates the whole flow
- `apps/desktop/src/capture/overlayWindow.ts` — persistent overlay with canvas-based region selection
- `apps/desktop/native/src/ax_url_reader.mm` — existing N-API addon for AX API
