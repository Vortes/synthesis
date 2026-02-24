# Capture Detail Modal + sourceApp Filtering — Implementation Guide

## Brand Constraints (read `technical-identity.md` for full reference)

All new UI must follow the curate visual identity. Key rules for this feature:

- **Palette:** Neutral surface tones only (`surface` #f0eeeb, `surface-cool` #eceae7, `surface-warm` #f4f2ef, `ink` #1c1b19, `ink-mid` #5e5b55, `ink-quiet` #a09b93, `ink-whisper` #c8c4bc). Orange (#e8663c) for active/selected states only — never decorative.
- **Typography:** Labels/metadata in `font-mono text-[11px] tracking-[0.06em]` (Geist Mono). Body in Outfit (`font-sans`). Headlines in Fraunces (`font-serif`). See existing components for exact usage.
- **Depth:** Cards use the raised shadow system (`shadow-card`, `shadow-card-hover`). Modal overlay should feel like a physical surface dimming — use `bg-ink/60` (not pure black). Modal content card uses `bg-surface` with `shadow-card` or heavier.
- **Motion:** Hover transitions 250ms ease. Reveals 550ms ease. No bouncing, no aggressive slides.
- **Orange rule:** Only for active pill states and CTA. App filter pills use orange for active state. Tag pills in the modal are read-only and use `border-edge` neutral style (no orange).
- **Quiet confidence:** Minimal decoration. No icons next to metadata labels — use typography hierarchy (mono labels, sans values). Generous whitespace.

---

## Phase 1: Foundation (Dialog + Data Interface)

**Goal:** Add shadcn Dialog primitive and extend data interfaces. Verify: `pnpm build` passes.

### 1a. Install Radix Dialog

```bash
cd packages/ui && pnpm add @radix-ui/react-dialog
```

### 1b. Create `packages/ui/src/components/ui/dialog.tsx`

Standard shadcn Dialog (copy from shadcn/ui source). Exports: `Dialog`, `DialogTrigger`, `DialogPortal`, `DialogOverlay`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose`.

Use these styles:
- **Overlay:** `fixed inset-0 z-50 bg-ink/60 backdrop-blur-sm` with fade in/out animations (use `bg-ink/60` not pure black — matches brand surface metaphor)
- **Content:** `fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-surface rounded-xl shadow-card` with zoom+fade animations
- Include an X close button top-right using `lucide-react` `X` icon, styled `text-ink-quiet hover:text-ink`

### 1c. Extend `CaptureCardData` in `packages/ui/src/components/library/capture-card.tsx`

Add to the existing interface (all optional so nothing breaks):

```ts
export interface CaptureCardData {
  // ... existing fields ...
  sourceApp?: string | null;
  sourceUrl?: string | null;
  description?: string | null;
}
```

### 1d. Export Dialog from `packages/ui/src/index.ts`

Add Dialog exports to the UI components section.

---

## Phase 2: CaptureCard Updates (onClick + sourceApp badge)

**Goal:** Cards are clickable, show sourceApp badge on hover. Verify: cards render, hover shows badge, click fires callback.

### 2a. Add `onClick` to `CaptureCardProps` in `capture-card.tsx`

```ts
interface CaptureCardProps {
  // ... existing ...
  onClick?: (capture: CaptureCardData) => void;
}
```

Wire it to the root `<div>`:
```tsx
onClick={() => onClick?.(capture)}
```

### 2b. Add sourceApp hover badge to `CaptureCard`

Inside the preview area `<div>` (the one with `aspect-[4/3]`), add a badge that appears on hover — positioned bottom-left, similar to the existing flow badge:

```tsx
{capture.sourceApp && (
  <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-ink/75 backdrop-blur-sm rounded-[5px] font-mono text-[10px] font-normal text-dark-text tracking-[0.04em] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
    {capture.sourceApp}
  </div>
)}
```

Note: When `variant === "flow"` and `flowSteps` is set, the flow badge already occupies bottom-left. In that case, skip the sourceApp badge (flow badge takes priority).

### 2c. Update `CaptureGrid` to pass through `onCardClick`

Add to `CaptureGridProps`:
```ts
onCardClick?: (capture: CaptureCardData) => void;
```

Pass to each `<CaptureCard>`:
```tsx
onClick={onCardClick}
```

---

## Phase 3: CaptureDetailModal Component

**Goal:** Modal opens with split layout. Verify: render modal with mock data, image shows left, metadata shows right.

### 3a. Create `packages/ui/src/components/library/capture-detail-modal.tsx`

```ts
import { Dialog, DialogContent } from "../ui/dialog";
import type { CaptureCardData } from "./capture-card";

export interface CaptureDetailData extends CaptureCardData {
  // CaptureCardData already has sourceApp, sourceUrl, description after Phase 1
}

interface CaptureDetailModalProps {
  capture: CaptureDetailData | null; // null = closed
  onClose: () => void;
  onDelete?: (id: string) => void;
}
```

**Layout (inside `DialogContent` with `max-w-5xl`):**

```
┌──────────────────────────────────────────────┐
│  ┌─────────────────────┐  Source  Safari     │
│  │                     │  URL    https://... │
│  │   Screenshot        │                     │
│  │   (dark bg,         │  Tags  ┌───┐ ┌───┐ │
│  │    object-contain)  │        │pill│ │pill│ │
│  │                     │        └───┘ └───┘  │
│  │        60%          │                     │
│  │                     │  Captured            │
│  │                     │  Feb 23, 2026       │
│  └─────────────────────┘                     │
│                           [Delete]    40%    │
└──────────────────────────────────────────────┘
```

Key details:
- `Dialog open={capture !== null} onOpenChange={(open) => !open && onClose()}`
- DialogContent: `max-w-5xl p-0 overflow-hidden rounded-xl bg-surface`
- Left panel: `w-[60%] bg-dark-bg flex items-center justify-center p-6`, image with `max-h-[80vh] object-contain rounded-lg`
- Right panel: `w-[40%] p-8 flex flex-col gap-6 overflow-y-auto max-h-[90vh]`
- **Metadata sections** use a consistent pattern:
  - Label: `font-mono text-[11px] font-light tracking-[0.06em] text-ink-whisper` (same as grid date headers)
  - Value: `text-sm text-ink-mid font-light` (Outfit)
- Source section: App name as value text, URL as clickable `<a target="_blank" rel="noopener noreferrer" className="text-sm text-ink-mid hover:text-ink truncate transition-colors duration-200">`
- Tags: Flex-wrap pills — `font-mono text-[11.5px] tracking-[0.04em] px-3.5 py-1.5 rounded-full border border-edge text-ink-quiet bg-transparent` (read-only, no hover/active states)
- Date: Format with `toLocaleDateString` with month/day/year
- Delete button: Bottom of right panel, use `text-ink-quiet hover:text-ink` style (no red — stays neutral per brand). Mono label, subtle.
- Hide sections if data is null/empty (e.g., no source section if no sourceApp and no sourceUrl)

### 3b. Export from `packages/ui/src/index.ts`

```ts
export { CaptureDetailModal, type CaptureDetailData } from "./components/library/capture-detail-modal";
```

---

## Phase 4: Wire Modal into Library Pages

**Goal:** Clicking a card opens the detail modal in both web and desktop. Verify: click card → modal opens, close works, delete works.

### 4a. `apps/web/src/app/(app)/library/page.tsx`

Changes:
1. Import `CaptureDetailModal` from `@curate/ui`
2. Add state: `const [selectedCapture, setSelectedCapture] = useState<CaptureCardData | null>(null)`
3. Pass `onCardClick={setSelectedCapture}` to `<CaptureGrid>`
4. Add delete handler that calls `deleteCapture.mutate`, clears `selectedCapture`
5. Render `<CaptureDetailModal>` at end of JSX:

```tsx
<CaptureDetailModal
  capture={selectedCapture}
  onClose={() => setSelectedCapture(null)}
  onDelete={(id) => {
    deleteCapture.mutate({ id });
    setSelectedCapture(null);
  }}
/>
```

### 4b. `apps/desktop/src/renderer/LibraryView.tsx`

Same changes as 4a. Import paths differ (`@curate/ui` is the same, trpc comes from `./trpc`).

---

## Phase 5: sourceApp Filtering in SearchGateway

**Goal:** App names appear as filterable pills with distinct styling. Verify: app pills render, toggling filters the grid.

### 5a. Update `SearchGateway` props in `packages/ui/src/components/shell/search-gateway.tsx`

Add to `SearchGatewayProps`:
```ts
suggestedApps?: string[];
onActiveAppsChange?: (apps: string[]) => void;
```

Add state: `const [activeApps, setActiveApps] = useState<string[]>([])`.

Sync to parent same as tags:
```ts
useEffect(() => {
  onActiveAppsChange?.(activeApps);
}, [activeApps, onActiveAppsChange]);
```

On Escape, also clear `activeApps`.

### 5b. Render app pills BEFORE tag pills

In the pills container `<div>`, render app pills first with distinct styling (orange accent per brand — these are actionable filter controls, so orange is earned):
- Same base classes as tag pills
- Inactive: `text-ink-quiet border-orange/30 bg-orange/[0.04] hover:border-orange/50 hover:bg-orange/[0.06]`
- Active: `text-paper bg-orange border-orange`
- When user types, filter `suggestedApps` the same way tags are filtered (match against query)

### 5c. Wire in both library pages

In `apps/web/src/app/(app)/library/page.tsx` and `apps/desktop/src/renderer/LibraryView.tsx`:

1. Add state: `const [activeApps, setActiveApps] = useState<string[]>([])`
2. Derive `suggestedApps` from captures:
```ts
const suggestedApps = useMemo(() => {
  const apps = new Set(captures.map(c => c.sourceApp).filter(Boolean) as string[]);
  return [...apps].sort();
}, [captures]);
```
3. Pass `suggestedApps` and `onActiveAppsChange={setActiveApps}` to `<SearchGateway>`
4. Add app filtering to `filteredCaptures` memo:
```ts
if (activeApps.length > 0) {
  results = results.filter(c => c.sourceApp && activeApps.includes(c.sourceApp));
}
```
5. Include `activeApps` in `isFiltering` check

---

## File Change Summary

| File | Phase | Action |
|------|-------|--------|
| `packages/ui/package.json` | 1 | `pnpm add @radix-ui/react-dialog` |
| `packages/ui/src/components/ui/dialog.tsx` | 1 | **Create** |
| `packages/ui/src/components/library/capture-card.tsx` | 1,2 | Edit interface + add onClick + hover badge |
| `packages/ui/src/components/library/capture-grid.tsx` | 2 | Edit — pass through onCardClick |
| `packages/ui/src/components/library/capture-detail-modal.tsx` | 3 | **Create** |
| `packages/ui/src/index.ts` | 1,3 | Edit — add Dialog + CaptureDetailModal exports |
| `packages/ui/src/components/shell/search-gateway.tsx` | 5 | Edit — add app pill support |
| `apps/web/src/app/(app)/library/page.tsx` | 4,5 | Edit — wire modal + app filtering |
| `apps/desktop/src/renderer/LibraryView.tsx` | 4,5 | Edit — wire modal + app filtering |

## Verification Per Phase

| Phase | Check |
|-------|-------|
| 1 | `pnpm build` passes |
| 2 | Cards render, hover shows sourceApp badge, click logs callback |
| 3 | `pnpm build` passes (modal not wired yet) |
| 4 | Click card → modal opens, shows image + metadata, delete works, close works |
| 5 | App pills appear in search, toggling filters grid, both web + desktop |
