Product Definition
Who This Is Really For
The compulsive noticer.
This is for the person who can't use an app without seeing it — noticing the way a date picker handles edge cases, how a toast notification stacks, why a particular onboarding flow feels effortless. They have taste, and they're constantly accumulating observations. The problem isn't that they lack references. It's that their references live scattered across screenshots, bookmarks, Slack messages to themselves, and increasingly unreliable memory.
They're frustrated not because good tools don't exist, but because nothing matches the speed of noticing. The moment of "oh, that's clever" lasts about two seconds. Anything that takes longer than that to capture has already lost.
They're also tired of starting from zero. Every new project begins with the same ritual: hunting for examples they know they've seen before, rebuilding context they've already built, settling for whatever Mobbin surfaces instead of the specific thing they remember. Their personal design knowledge is enormous but effectively inaccessible.
The core emotional state: "I know I've seen the perfect example of this. I just can't find it."

How It Should Feel
Capture should feel like highlighting a sentence in a book — instant, low-effort, almost absent-minded. You shouldn't have to think about where something goes or what to call it. You just grab it and trust that it'll be findable later.
Browsing your library should feel like flipping through a well-organized sketchbook — not a database. There's serendipity in it. You came looking for modals but you scroll past a card layout you forgot you saved, and it sparks something. The organization is smart enough that you don't maintain it, but transparent enough that you're never confused about why something is where it is.
Retrieving a reference should feel like texting a friend who remembers everything. You describe what you're looking for in rough, imprecise terms — "that thing Stripe does with inline editing" — and it knows what you mean. The gap between having a vague memory and holding a concrete example should be seconds, not minutes.
Overall, the tool should feel like an extension of your own design memory — not another app to manage. It earns its place by disappearing into your workflow. The moment it feels like work (tagging, sorting, organizing, maintaining), it's failed.
Some texture words: quiet, fast, confident, effortless, personal. Not: social, gamified, flashy, opinionated.

What It's Definitely NOT
It's not a mood board tool. Mood boards are about aesthetics and vibes. This is about functional patterns and interaction decisions. You're not saving things because they're pretty. You're saving them because they solved a problem well.
It's not a design system. It doesn't generate tokens, components, or specs. It's the research layer that happens before you decide what to build.
It's not Mobbin. Mobbin is a curated public library someone else built. This is your library — shaped by what you've actually encountered, filtered by your own taste and context. Mobbin is a bookstore. This is your personal shelf.
It's not a screenshot manager. Screenshots are dumb rectangles. This tool understands what's in the capture — that it's a modal, that it belongs to Stripe, that it relates to inline editing. The intelligence is the point.
It's not a collaboration-first tool. Sharing is a feature, not the purpose. The primary value is personal. If it's not useful for a single designer working alone, no amount of team features saves it. Team functionality is a layer on top of something that already works for one person.
It's not another app demanding attention. No feed. No notifications that matter. No streak mechanics. No "discover what other designers are saving." It's a tool that's powerful when you need it and invisible when you don't.

Brand name: Synthesis (WIP)
Tagline: "Your design memory, always organized."
Positioning: Personal reference library that sits between screenshot tools (fast but dumb) and curated libraries like Mobbin (smart but not yours).
Five pillars: Effortless Capture, Ambient Intelligence, Instant Retrieval, Personal by Default, Quiet Presence.
Voice: Confident, concise, warm, precise, understated. Sharp colleague energy — assumes you're competent, never over-explains.
Core message: Synthesis turns everything you notice into a reference library you can actually use.

# synthesis — Product Strategy

> Your design library should build itself.

---

## The Insight

Every designer has the same dirty secret: a graveyard of inspiration. A Screenshots folder with 2,000 unsorted images. A dozen Pinterest boards they never revisit. Bookmarks from three browsers across two machines. Half-remembered references from apps they used once six months ago.

The problem isn't finding inspiration — it's that the moment between seeing something great and needing it later is where everything falls apart. You see a brilliant onboarding flow on a competitor's app. You think "I should save this." You screenshot it, maybe two or three screens. It lands in your camera roll or Downloads folder. You never see it again.

When it's time to actually design something, you start from scratch. You Google "best onboarding flows 2025." You open Mobbin and scroll. You ask a colleague, "have you seen any good examples of..." You rebuild context you already had, from an experience you already lived through.

**synthesis exists because the best design references are the ones you personally encountered, in context, while using real products** — not curated galleries of someone else's screenshots.

---

## What synthesis Is

synthesis is a desktop tool for designers that captures UI components and user flows from any application — web or native — and organizes them into a personal, AI-sorted reference library.

It works like this:

1. You're browsing a website or using any Mac app
2. You hit a keyboard shortcut
3. An overlay appears — as you hover, it detects and highlights individual UI components (a button group, a card, a navigation bar, a modal)
4. You click to capture that component, or drag to select a custom region
5. It's instantly saved to your library
6. AI analyzes the screenshot and tags it: component type, color palette, typography, platform, visual style
7. When you need a reference later, you search your own collection — by component, by color, by flow, by project

There's also a "Record Flow" mode: you tell synthesis you're about to walk through something (an onboarding sequence, a checkout, an account setup), and it automatically screenshots each distinct screen as you navigate. When you stop, it stitches them into an ordered flow you can step through later.

The key difference from everything else: **this is your library, built from your experience, organized by AI, available when you need it.**

---

## Who It's For

### Primary: Product Designers (IC level)

Designers at startups and mid-size companies who are responsible for end-to-end product design. They do their own competitive research, build their own reference collections, and are constantly encountering UI patterns they want to remember. They use Figma daily, probably have a Mobbin subscription, and have tried at least two different screenshot/bookmarking tools without sticking with any of them.

**Their current workflow:**

- See something → screenshot (⌘+Shift+4) → Desktop/Downloads folder → forget
- Need a reference → open Mobbin/Dribbble → scroll → settle for "close enough"
- Start new project → rebuild research from scratch every time

**What they actually want:**

- A library that grows passively as they browse
- To capture a specific component, not a whole page
- To find "that modal I saw on Stripe's dashboard three weeks ago" in seconds
- To show a developer or stakeholder "I want it to work like this" with a real example

### Secondary: Design Leads & Managers

People who oversee design teams and want to maintain shared reference libraries. They care about design consistency and want their team to start from established patterns rather than reinventing solutions. For them, synthesis becomes a shared team brain — everyone captures references, everyone benefits.

### Tertiary: Founders & Product Managers

Non-designers who frequently encounter apps and interfaces they admire, and want a way to communicate "make it feel like this" to their design and engineering teams without needing to learn Figma.

---

## The Competitive Landscape

The design reference space has several players, but they all solve a piece of the problem, not the whole thing. This creates the gap synthesis fills.

### Mobbin — The Curated Library

Mobbin is the market leader in design reference, with 300,000+ screens from 1,000+ apps. It's excellent for browsing what exists. Pricing runs ~$130/year for individuals, up to ~$4,000 for enterprise teams.

**What Mobbin does well:** Comprehensive curated database, excellent filtering (by component, flow type, industry), Figma integration, team collections.

**What Mobbin doesn't do:** Mobbin is a read-only catalog of someone else's curation. You can't capture your own finds. You can't clip a component from a random website you stumbled on. You can't record a live flow you're personally walking through. You're limited to what their team has cataloged. They do allow screenshot uploads to collections, but only iOS/Android screenshots — and there's no AI analysis, no component detection, no flow recording.

**synthesis's relationship to Mobbin:** Not a direct competitor. Mobbin is a reference encyclopedia. synthesis is your personal notebook. Many users will use both — Mobbin for broad research, synthesis for personal capture and retrieval. Over time, synthesis could become a replacement as personal libraries grow rich enough to be self-sufficient.

### Eagle — The Local Asset Manager

Eagle is a $29.95 one-time purchase desktop app for organizing all visual assets. Designers love it. It has a browser extension, tagging, color filtering, smart folders, and supports 90+ file formats.

**What Eagle does well:** Excellent organization, one-time purchase, works offline, handles any file type, powerful filtering, great for managing existing files.

**What Eagle doesn't do:** Eagle is a general-purpose file manager. It doesn't understand UI. It can't detect components. It can't auto-tag a screenshot as "navbar" or "onboarding step 3 of 5." It has no AI analysis. It can't record flows. It treats a UI screenshot the same as a photo of a sunset.

**synthesis's relationship to Eagle:** synthesis is Eagle rebuilt specifically for UI/UX, with AI intelligence about what it's looking at. Eagle is for people who organize everything. synthesis is for designers who want their UI references to organize themselves.

### Visily — The Screenshot-to-Wireframe Tool

Visily captures screenshots and converts them into editable wireframes. It has a Chrome extension for capturing full pages, selected areas, or specific UI elements.

**What Visily does well:** Component-level capture, Chrome extension, converts screenshots to editable designs, free to use.

**What Visily doesn't do:** Visily is a wireframing tool, not a reference library. Every screenshot is a starting point for a new design, not a reference to revisit. There's no AI tagging, no searchable library, no flow recording, no organization by component type. It also only works in browsers — not native apps.

**synthesis's relationship to Visily:** synthesis takes Visily's component-level capture concept and combines it with Eagle's organizational power and Mobbin's design-aware categorization — then adds AI to glue it together.

### Bookmarkify / Cosmos / Kosmik — Visual Bookmark Managers

These tools save web pages visually with screenshots and let you tag and organize them. Kosmik has AI auto-tagging by color and theme.

**What they don't do:** They save entire pages, not components. They don't understand UI patterns. They're general-purpose inspiration tools, not designer-specific. They work in browsers only.

### The Actual Competitor: The Screenshots Folder

Honestly, this is what synthesis is really competing against. The unspoken truth is that most designers' "reference system" is ⌘+Shift+4 into a folder they never open again. The bar to beat isn't Mobbin — it's the path of least resistance. synthesis has to be faster and easier than taking a screenshot and doing nothing with it.

---

## Why Now

Three things make this moment right:

**1. AI Vision models are finally good enough.** Two years ago, you couldn't reliably send a UI screenshot to an AI and get back structured data about component types, color palettes, typography, and layout patterns. Now you can. Claude, GPT-4V, and Gemini all handle this well. This is the enabling technology that makes auto-tagging possible — the thing that turns a dumb screenshot folder into an intelligent design library.

**2. Designers are drowning in tools but starving for workflow integration.** The average designer's toolchain — Figma, Notion, Slack, Mobbin, Loom, Linear — involves constant context-switching. None of these tools are present at the moment of inspiration (casually browsing a competitor's app). synthesis sits at the OS level, available everywhere, capturing the moment.

**3. The shift from "find inspiration" to "recall experience."** Mobbin proved there's a massive market for design reference ($130/yr/user). But the next evolution isn't a bigger library curated by someone else — it's a personal library curated by your own experience, made searchable by AI. The same shift that went from "use stock photos" to "generate your own images" is happening in reference: from "browse someone's catalog" to "search your own memory."

---

## Product Principles

### 1. Capture should be invisible

If saving a reference takes more than 2 seconds and one action, the feature fails. The keyboard shortcut → hover → click workflow must feel as natural as ⌘+C. The entire point is to not interrupt whatever you were doing.

### 2. Organization should be automatic

The moment you have to manually tag something is the moment your library starts to die. AI does the heavy lifting — component type, colors, typography, platform, style. Users can refine and add custom tags, but the default should be good enough to never require it.

### 3. Retrieval should feel like memory

When you think "that pricing table I saw on Linear's site," you should be able to type "pricing table" or "Linear" or even search by the blue color you vaguely remember and find it. The search should work the way your brain does — fuzzy, associative, visual.

### 4. The library gets more valuable over time

Unlike a bookmarking tool that gets cluttered, synthesis should get more useful the more you use it. More captures = better AI understanding of your taste = better suggestions = a richer personal design system. Your library is an asset, not a junk drawer.

### 5. Desktop-native, not browser-bound

A Chrome extension is table stakes. But designers also use native apps — Slack, Discord, Figma, Sketch, native Mac apps, even competitors' Electron apps. The capture layer must work everywhere, which means it lives at the OS level.
