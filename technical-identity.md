# curate — Brand Identity

---

## The Brand in One Sentence

curate looks and sounds like a tool made by someone with taste, for someone with taste — quiet enough to disappear, sharp enough to be remembered.

---

## Brand Concept: The Pressed Surface

The visual identity of curate is built on a single metaphor: a physical surface that things are pressed into. Not a screen. Not a dashboard. A material.

This idea shows up everywhere. Text is debossed — visible only through light and shadow, like letterpress on heavy stock. Dividers are score marks pressed into the surface. Cards sit inset or raised, never floating in space. Light falls across the page the way it would fall across paper on a desk.

The brand doesn't announce itself. It reveals itself through texture, through the way light behaves, through the quiet physicality of every element. You feel it before you name it.

---

## Visual Principles

### 1. Material over decoration.

Every visual choice should feel like it belongs to a physical object. Shadows are motivated by light direction, not added for depth. Textures exist because surfaces have texture, not because the design needed filling. The goal is a page that feels like something you could touch.

### 2. Quiet confidence.

The design whispers. No gradients screaming for attention. No illustration. No decorative flourishes. The confidence is in the restraint — in the amount of whitespace, the weight of the typography, the precision of the spacing. If something doesn't earn its place, it doesn't exist.

### 3. Contemporary warmth.

The palette is warm but not vintage. The surface has texture but not nostalgia. The brand should feel like it was made this year by someone who happens to appreciate physical craft — not like it's referencing a bygone era. Modern tools, analog sensibility.

### 4. One accent, used sparingly.

Orange is the only color that breaks the neutral palette, and it appears only where it matters: calls to action, active states, the occasional dot accent. It should feel like a signal, not a theme. The moment orange appears in more than three places on a given screen, it's lost its power.

---

## Color Palette

### Surface tones

These are the foundation. Nearly everything lives in this range.

| Name         | Hex     | Usage                            |
| ------------ | ------- | -------------------------------- |
| Surface      | #f0eeeb | Primary background — the "paper" |
| Surface Cool | #eceae7 | Inset cards, recessed areas      |
| Surface Warm | #f4f2ef | Raised cards, elevated areas     |
| Edge         | #e5e3df | Page boundary, html background   |

### Ink tones

Text and typographic hierarchy.

| Name        | Hex     | Usage                                       |
| ----------- | ------- | ------------------------------------------- |
| Ink         | #1c1b19 | Headlines, primary text, dark surface cards |
| Ink Mid     | #5e5b55 | Body text, descriptions                     |
| Ink Quiet   | #a09b93 | Labels, nav links, secondary text           |
| Ink Whisper | #c8c4bc | Metadata, numbering, placeholder elements   |

### Shadow constants

Used for embossed dividers and score marks.

| Name         | Hex     | Usage                                    |
| ------------ | ------- | ---------------------------------------- |
| Shadow Dark  | #C4BDB4 | Top/left shadow edge — the press mark    |
| Shadow Light | #FFFCF8 | Bottom/right highlight — the light catch |

### Accent

| Name         | Hex                   | Usage                                |
| ------------ | --------------------- | ------------------------------------ |
| Orange       | #e8663c               | CTA buttons, active nav, dot accents |
| Orange Hover | #d45a32               | Button hover state                   |
| Orange Soft  | rgba(232,102,60,0.08) | Secondary button hover background    |

### Dark surface

| Name            | Hex                    | Usage                      |
| --------------- | ---------------------- | -------------------------- |
| Dark BG         | #1c1b19                | Inverted card backgrounds  |
| Dark Text       | #f0eeeb                | Text on dark surfaces      |
| Dark Text Muted | rgba(240,238,235,0.55) | Body text on dark surfaces |

---

## Typography

### Type pairing

| Role    | Font       | Weight        | Usage                                   |
| ------- | ---------- | ------------- | --------------------------------------- |
| Display | Fraunces   | 300, 400      | Headlines, card titles, debossed quotes |
| Body    | Outfit     | 300, 400, 500 | Body text, descriptions, buttons        |
| Mono    | Geist Mono | 300, 400      | Brand name, labels, metadata, numbering |

### Why these fonts

**Fraunces** is a variable optical-size serif with soft, slightly organic letterforms. It reads as contemporary and warm without drifting into the tech aesthetic of geometric sans-serifs. The light weight (300) at large sizes has the quiet authority the brand needs. The italic is distinctive without being decorative.

**Outfit** is a clean geometric sans-serif with enough warmth to not feel clinical. At light weights it pairs well with Fraunces without competing. At medium weight it works for buttons and UI labels.

**Geist Mono** is precise and restrained. It references the craft of code and specs without feeling like a terminal. Used for the brand name, section labels, and metadata — the structural elements that hold the page together.

### Type rules

The brand name is always set in Geist Mono at 13px, weight 400, with 0.06em letter-spacing. Always lowercase. Never Curate. Never SYNTHESIS.

Headlines use Fraunces at 300 weight with tight tracking (-0.025em). The italic variant is reserved for emphasis within headlines — the word or phrase that carries the meaning. ("you can _actually use._")

Body text uses Outfit at 300 weight, 14.5–17px depending on context, with generous line-height (1.7).

---

## Texture System

### Surface grain

A subtle noise texture overlays the entire page. It's generated via SVG `feTurbulence` (baseFrequency 0.85, 4 octaves) at 6% opacity. The grain is fixed-position so the content scrolls beneath it, reinforcing the sensation that the surface is a material, not a screen.

### Directional light

A radial gradient from the upper left (~30% from left, 0% from top) creates a barely-perceptible warm wash across the surface. This establishes a light source that motivates all shadows, deboss effects, and highlights.

### Shadow bands

Diagonal SVG bands simulate natural light falling across the hero section — like sunlight through a window. The bands use two blur levels (18px and 30px gaussians), alternating between shadow strips (rgba black, 2.5–4% opacity) and light strips (rgba white, 2.5–4% opacity). They animate with a slow drift (25s cycle) and breathing opacity (18s cycle).

The bands are masked so they fade from soft at the top of the page to full strength at the hero headline, then dissolve before the first section divider. Light goes from diffuse to focused as the eye moves down.

---

## Depth System

curate uses three levels of physical depth. Every element on the page belongs to one of them.

### Level 1: Pressed in (debossed)

Elements that feel pushed into the surface. Used for dividers, the manifesto quote, and inset content cards.

**Dividers:** 1px height, transparent background, `box-shadow: 0 -1px 0 #C4BDB4, 0 1px 0 #FFFCF8`. Centered, 200px wide.

**Debossed text:** Text color matches the surface exactly (#f0eeeb). Visibility comes entirely from layered text-shadows — dark offsets upper-left, bright offsets lower-right. The letterforms exist only in the interplay of light and shadow.

**Inset cards:** Background slightly darker than the surface (#eceae7). `box-shadow: inset 0 1px 3px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.02), 0 1px 0 rgba(255,255,255,0.7)`.

### Level 2: On the surface (flush)

Text, labels, and most content sit flush with the surface. No shadow treatment. They belong to the material.

### Level 3: Resting on the surface (raised)

Elements that feel like they're sitting on top of the material. Used for elevated cards and the CTA button.

**Raised cards:** Background slightly lighter (#f4f2ef). Multi-layer shadow: `0 0 0 1px rgba(0,0,0,0.03), 0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.05)`. Lifts further on hover.

**Dark cards:** Background #1c1b19. Heavier shadow to ground the dark mass against the light surface.

---

## Motion Principles

### Motion is evidence of life, not decoration.

The shadow bands drift slowly. Cards lift gently on hover. Content reveals with a soft upward fade. Nothing bounces. Nothing slides aggressively. Nothing loops for attention.

### Timing

Reveals: 0.55s ease, staggered by ~40ms between elements.
Hover transitions: 0.25–0.3s ease.
Ambient animation (shadow drift): 18–25s cycles, ease-in-out.

### The rule

If removing the animation wouldn't change the user's understanding of the page, the animation is doing its job — it's adding feeling, not information. The moment an animation draws conscious attention to itself, it's too much.

---

## The Orange Rule

Orange (#e8663c) is the brand's only chromatic color. It exists to say "this is where you act." It appears in exactly these contexts:

- Primary CTA buttons (filled, white text)
- Secondary CTA buttons (outline, orange text)
- "Early access" nav link
- Dot accents next to section labels
- Active/selected states in the product UI

It never appears in:

- Headlines or body text
- Backgrounds or surface colors
- Decorative elements
- Icons or illustrations

The restraint is the point. On a page of warm neutrals and embossed textures, a small dot of orange has the visual weight of a headline.

---

## Photography & Imagery Direction

curate does not use stock photography, illustrations, or decorative imagery on its marketing surfaces. The visual richness comes from the surface itself — the grain, the light, the shadows, the depth.

If imagery is ever needed (blog posts, social media), it should follow these rules:

- Overhead shots of physical surfaces: paper, linen, wood, concrete
- Close-up textures with directional light
- Never lifestyle photography of people using computers
- Never mockups of the app in a device frame (unless showing a specific feature in documentation)
- Always warm, slightly desaturated color grading

---

## Voice Summary

_(Detailed in the Tone & Voice Guide — this is the quick reference.)_

curate speaks like a sharp designer friend. Confident, concise, warm, precise, understated. It assumes the reader is competent. It never over-explains. It speaks from inside the problem, not above it.

**Texture words:** quiet · fast · confident · effortless · personal

**Words we use:** notice, capture, library, reference, remember, your

**Words we avoid:** powerful, seamless, leverage, cutting-edge, solution, revolutionize, AI-powered (as headline)

**Formatting:** Always lowercase _curate_. No exclamation marks. Short paragraphs. Em dashes for asides. Periods for weight. Fragments when they land harder than sentences.

---

## The Test

Before any design or copy ships, ask:

- Does it feel like a surface you could touch?
- Is the orange earning its place?
- Would you notice the grain if you weren't looking for it?
- Does the type hierarchy work through weight and space alone — no color, no decoration?
- Is the design quiet enough to disappear, and sharp enough to be remembered?
- Could this have come from any other product? Or is it unmistakably curate?
