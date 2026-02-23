# Search Improvement Plan

> Goal: Instant as-you-type search powered by ~20 rich AI-generated tags per capture, client-side keyword filtering, redesigned search UX with dynamic tag pills, and larger thumbnails. No description field — tags are the entire search backend.

---

## What's Changing (Architecture Summary)

**Removing:**
- Vector/semantic search (pgvector embeddings) — replaced by rich keyword tags
- `embedding` column from Capture model
- `descriptionUrl` column from Capture model
- `uploadDescription()` function and UploadThing dependency in analyze.ts
- `generateEmbedding()` function
- `search` tRPC procedure (vector search)
- Search overlay/blur behavior
- Static filter pills ("All", "Components", "Flows", "Pages")
- Date display on capture cards
- Date grouping in search results

**Adding:**
- `tags` (String[]) column on Capture
- Structured JSON output from GPT-4o-mini (~20 rich tags per capture including synonyms)
- Client-side instant keyword filtering against tags
- Dynamic tag pills below search bar (contextual suggestions from user's library)
- Tag pill filters (independent toggle filters layered on top of text query)
- Larger thumbnail grid (2-3 columns instead of 4)

**Keeping:**
- GPT-4o-mini as the vision model
- `analyzeCapture()` function (rewritten for JSON output)
- `capture.list` tRPC procedure (now includes tags)
- `capture.create`, `capture.delete`, `capture.byId` procedures unchanged
- Cmd+K shortcut, Escape to clear

---

## Phase 1 — Schema: New columns, remove old ones

**Files to modify:**
- `packages/db/prisma/schema.prisma`

**Changes:**

Remove from the Capture model:
```
descriptionUrl  String?
embedding       Unsupported("vector(1536)")?
```

Add to the Capture model:
```prisma
tags         String[]   @default([])
```

The model should look like:
```prisma
model Capture {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  imageUrl    String
  tags        String[]  @default([])
  analyzedAt  DateTime?
  sourceUrl   String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([userId])
}
```

Run: `npx prisma migrate dev --name replace-embeddings-with-tags`

After the migration is generated, add a GIN index to the SQL file for fast array queries:
```sql
CREATE INDEX "Capture_tags_idx" ON "Capture" USING GIN ("tags");
```

Then run `npx prisma generate`.

**How to test:**
- `pnpm dev:web` starts without errors
- Prisma Studio shows the updated Capture table: `tags` present, `descriptionUrl` and `embedding` gone
- Existing captures still load in the library grid (they'll have empty tags — that's expected)

---

## Phase 2 — AI Analysis: Structured JSON with ~20 tags

**Files to modify:**
- `packages/api/src/lib/analyze.ts`

**Changes:**

1. Delete `uploadDescription()` entirely.
2. Delete `generateEmbedding()` entirely.
3. Remove the `UTApi` / `uploadthing/server` import.
4. Remove the OpenAI embeddings usage — only chat completions remain.

5. Replace `VISION_PROMPT` with:
```
Analyze this UI screenshot for a design reference library. Return a JSON object with exactly one field:

{
  "tags": ["tag1", "tag2", ...]
}

Generate approximately 20 tags covering ALL of the following categories:

SCREEN TYPE (1-2 tags): What this screen fundamentally is.
  Examples: "login", "sign in", "dashboard", "pricing", "footer", "navigation", "modal", "settings", "landing page", "checkout", "profile", "404", "onboarding"

COMPONENTS (3-5 tags): Key UI elements visible on screen.
  Examples: "form", "card", "table", "sidebar", "hero section", "input fields", "buttons", "dropdown", "tabs", "carousel", "avatar", "search bar", "toggle"

VISUAL STYLE (3-4 tags): Color and aesthetic qualities.
  Examples: "dark mode", "light theme", "minimal", "vibrant", "monochrome", "glassmorphism", "gradient", "flat design", "neumorphism", "high contrast"

LAYOUT (2-3 tags): How content is structured.
  Examples: "single column", "split view", "grid layout", "sidebar layout", "centered", "full width", "stacked", "masonry"

TYPOGRAPHY (1-2 tags): Text styling.
  Examples: "sans-serif", "serif", "monospace", "large headings", "small text", "bold typography"

DETAILS (2-4 tags): Notable design specifics.
  Examples: "rounded corners", "shadows", "illustrations", "icons", "animation", "border", "dividers", "hover effects", "badge", "notification"

SYNONYMS (2-3 tags): Alternative terms someone might search for.
  Examples: if it's a login page, include "sign in" and "authentication". If it's a navbar, include "header" and "top bar". Think about what words a user might type when trying to find this screenshot from memory.

Rules:
- All tags lowercase, 1-3 words each
- Do NOT include generic tags like "ui", "screenshot", "web", "design", "page", "screen"
- Return ONLY valid JSON, no markdown fences or explanation
```

6. Change `analyzeCapture()` return type and implementation:
```typescript
export async function analyzeCapture(imageUrl: string): Promise<string[] | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: VISION_PROMPT },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? null;
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.tags) ? parsed.tags : null;
  } catch (error) {
    console.error("[analyze] Vision analysis failed:", error);
    return null;
  }
}
```

The function now returns `string[] | null` — just the tags array, nothing else.

The file should only export `analyzeCapture`. Nothing else.

**How to test:**
- Import and call `analyzeCapture(someImageUrl)` with a few different screenshots
- Verify it returns a string array like `["login", "sign in", "authentication", "form", ...]`
- Verify ~20 tags per capture, covering the categories in the prompt
- Verify tags are lowercase and 1-3 words
- Verify the first 1-2 tags identify the screen type
- Verify synonym tags are present (e.g. "login" capture also has "sign in")
- Try edge cases: a mostly black screenshot, a mobile screenshot, a screenshot with lots of text

---

## Phase 3 — API: Clean up router, remove vector search

**Files to modify:**
- `packages/api/src/routers/capture.ts`

**Changes:**

1. Update the import from analyze.ts — only `analyzeCapture` is exported now. Remove `generateEmbedding` and `uploadDescription` from the import.

2. Rewrite the `analyze` mutation:
```typescript
analyze: protectedProcedure
  .input(z.object({ id: z.string() }))
  .mutation(async ({ ctx, input }) => {
    const user = await ctx.db.user.findUnique({
      where: { clerkId: ctx.userId },
    });
    if (!user) return { success: false };

    const capture = await ctx.db.capture.findFirst({
      where: { id: input.id, userId: user.id },
    });
    if (!capture) return { success: false };

    const tags = await analyzeCapture(capture.imageUrl);
    if (!tags) return { success: false };

    await ctx.db.capture.update({
      where: { id: capture.id },
      data: {
        tags,
        analyzedAt: new Date(),
      },
    });

    return { success: true };
  }),
```

No more raw SQL, no more vector string construction, no more UploadThing upload.

3. Delete the `search` procedure entirely (the vector/semantic search one).

4. Add a `reanalyzeAll` mutation for migrating existing captures:
```typescript
reanalyzeAll: protectedProcedure
  .mutation(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { clerkId: ctx.userId },
    });
    if (!user) return { processed: 0, failed: 0 };

    const captures = await ctx.db.capture.findMany({
      where: { userId: user.id, tags: { isEmpty: true } },
    });

    let processed = 0;
    let failed = 0;

    for (const capture of captures) {
      const tags = await analyzeCapture(capture.imageUrl);
      if (!tags) {
        failed++;
        continue;
      }

      await ctx.db.capture.update({
        where: { id: capture.id },
        data: {
          tags,
          analyzedAt: new Date(),
        },
      });

      processed++;

      // Rate limit: 1.5 second delay between calls
      await new Promise(r => setTimeout(r, 1500));
    }

    return { processed, failed };
  }),
```

**How to test:**
- Upload a new screenshot → trigger analyze → check Prisma Studio: `tags` populated, no `descriptionUrl` or `embedding`
- Call `reanalyzeAll` → all existing captures get `tags`
- The old `search` endpoint no longer exists (calling it should 404 or type-error)
- `list` and `byId` still work as before, now returning `tags`

---

## Phase 4 — Frontend: Instant search, tag pills, larger thumbnails

**Files to modify:**
- `packages/ui/src/components/shell/search-gateway.tsx`
- `packages/ui/src/components/library/capture-card.tsx`
- `packages/ui/src/components/library/capture-grid.tsx`
- `apps/web/src/app/(app)/library/page.tsx`

### 4A — SearchGateway (`search-gateway.tsx`)

Complete rewrite of behavior. Remove all existing focus/blur/overlay logic.

**New props:**
```typescript
interface SearchGatewayProps {
  onQueryChange: (query: string) => void;
  onActiveTagsChange: (tags: string[]) => void;
  suggestedTags: string[];
  className?: string;
}
```

**Behavior:**
- Text input fires `onQueryChange` on every keystroke (debounced 150ms)
- No overlay, no blur, no backdrop. The input is just an inline element.
- Below the input, render `suggestedTags` as pill buttons
- Clicking a pill toggles it. Active pills have a visually distinct style (filled/solid background). Manage active pill state internally and call `onActiveTagsChange` with the current set.
- Keep the Cmd+K shortcut to focus
- Escape clears the query, deactivates all pills, and unfocuses
- Keep the existing visual style of the input (large serif font, bottom border) — just remove the overlay/modal behavior
- Remove the static "All", "Components", "Flows", "Pages" filter list entirely

### 4B — CaptureCard (`capture-card.tsx`)

- Remove the entire "Card info" section — the `<div className="px-3.5 py-3">` block and everything inside it (source, tags display, date fallback). Lines 92-148.
- The card is now just the image area with hover action buttons.
- `CaptureCardData` already has `tags?: string[]` — no changes needed to the interface for search purposes. Remove unused fields if present (like `source`).

### 4C — CaptureGrid (`capture-grid.tsx`)

- Change grid column minimum from `220px` to `340px`:
  ```
  grid-cols-[repeat(auto-fill,minmax(340px,1fr))]
  ```

### 4D — Library page (`library/page.tsx`)

**State:**
```typescript
const [query, setQuery] = useState("");
const [activeTags, setActiveTags] = useState<string[]>([]);
```

**Data loading:**
- Fetch all captures via `trpc.capture.list` on mount (same as now). This now includes tags.
- Remove the `trpc.capture.search` query entirely.
- Remove `activeSearch` state.

**Derive suggested tags:**
```typescript
const suggestedTags = useMemo(() => {
  if (!captures.length) return [];

  if (!query.trim() && activeTags.length === 0) {
    // Default: most frequent first-tags (screen types) from user's library
    const firstTags = captures
      .map(c => c.tags?.[0])
      .filter(Boolean) as string[];
    const counts = new Map<string, number>();
    for (const tag of firstTags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);
  }

  // While typing: find tags that match the current query
  const q = query.toLowerCase();
  const allTags = new Set(captures.flatMap(c => c.tags ?? []));
  return [...allTags]
    .filter(tag => tag.includes(q) && !activeTags.includes(tag))
    .slice(0, 6);
}, [captures, query, activeTags]);
```

**Client-side filtering:**
```typescript
const filteredCaptures = useMemo(() => {
  let results = captures;

  // Apply active tag filters (AND logic — capture must have ALL active tags)
  if (activeTags.length > 0) {
    results = results.filter(c =>
      activeTags.every(tag => c.tags?.includes(tag))
    );
  }

  // Apply text query (every word must match some tag)
  const trimmed = query.trim().toLowerCase();
  if (trimmed) {
    const words = trimmed.split(/\s+/);
    results = results.filter(c =>
      words.every(word =>
        c.tags?.some(t => t.includes(word))
      )
    );
  }

  return results;
}, [captures, query, activeTags]);
```

**Display:**
- When filtering (query or activeTags active): show a flat list, no date grouping. Label: `"X of Y captures"`.
- When not filtering: show date-grouped view as before. Label: `"Y captures"`.
- No loading spinner for filtering — it's synchronous.
- "No matches" empty state when `filteredCaptures` is empty but `captures` is not.

**Remove:**
- `activeSearch` state
- `trpc.capture.search` usage
- `isSearching` state and its spinner
- The `handleSearch` callback (replaced by `setQuery`)

### How to test:
- Type "login" → results filter instantly as you type each letter. No spinner, no blur, no overlay.
- Tag pills appear below the search bar. Before typing: most common screen types. While typing: relevant matching tags.
- Click a tag pill → it highlights, results narrow. Click again → deactivates, results widen.
- Type "dark" + click "footer" pill → only dark-themed footer captures show.
- Clear the search (backspace or X) → all captures reappear.
- Escape clears query + active tags, unfocuses input.
- Cmd+K focuses the input.
- Thumbnails are larger, 2-3 per row instead of 4.
- Cards show only the screenshot image, no dates or metadata.
- Search for gibberish → shows "No matches" state, not "No captures yet".
- Upload a new capture → still works.
- Delete a capture → still works.

---

## Phase Summary

| Phase | What | Depends on |
|---|---|---|
| 1 | Schema migration (add tags, remove embedding/descriptionUrl/description) | — |
| 2 | Rewrite analyze.ts (structured JSON, remove embedding + upload) | Phase 1 |
| 3 | Clean up capture router (new analyze, remove vector search, add reanalyzeAll) | Phase 2 |
| 4 | Frontend rewrite (instant search, tag pills, larger cards, no dates) | Phase 3 |

Each phase is deployable and testable on its own before moving to the next.

---

## Files Reference

| File | Phase |
|---|---|
| `packages/db/prisma/schema.prisma` | 1 |
| `packages/api/src/lib/analyze.ts` | 2 |
| `packages/api/src/routers/capture.ts` | 3 |
| `packages/ui/src/components/shell/search-gateway.tsx` | 4 |
| `packages/ui/src/components/library/capture-card.tsx` | 4 |
| `packages/ui/src/components/library/capture-grid.tsx` | 4 |
| `apps/web/src/app/(app)/library/page.tsx` | 4 |
