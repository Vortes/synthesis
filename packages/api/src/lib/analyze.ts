import OpenAI from "openai"

function getClient() {
	const apiKey = process.env.OPENAI_API_KEY
	if (!apiKey) return null
	return new OpenAI({ apiKey })
}

const VISION_PROMPT = `You are tagging a UI screenshot for a design reference library. A designer will search this library to find inspiration or reference for a specific design subject. Your job is to tag what this screenshot IS a reference FOR — not to inventory everything visible in it.

Follow these three steps:

STEP 1 — IDENTIFY THE PRIMARY SUBJECT
Determine what design element or pattern this screenshot was captured to reference. Ask yourself: why would a designer save this? Is it:
- A full page or view (e.g. dashboard, landing page, settings screen, onboarding flow)?
- A specific component being showcased (e.g. a button style, a card design, a data table, a navigation bar)?
- A design pattern or state (e.g. empty state, error handling, loading skeleton, confirmation dialog)?

The primary subject is the thing that makes this screenshot worth saving. Everything else is incidental.

STEP 2 — TAG THE SUBJECT, NOT THE INVENTORY
Generate tags that describe what this screenshot is a reference FOR. Do not tag elements that are merely present in the background or as supporting UI.

- If the screenshot is of a dashboard, tag it as a dashboard with its characteristics ("dashboard", "dark mode", "sidebar layout", "data-heavy", etc.). Do NOT tag "buttons" or "icons" just because buttons and icons appear on the dashboard.
- If the screenshot is a close-up of a single button component, THEN tag "button", "pill shape", "primary action", etc.
- If the screenshot shows an empty state, tag "empty state", "zero data", "illustration", "call to action" — the empty state is the subject.

The test: would a designer searching for this tag expect to find THIS screenshot? If someone searches "buttons", they expect a button component reference — not a dashboard that happens to contain buttons.

STEP 3 — ADD SYNONYMS
Include 2-3 alternative search terms for the primary subject. Think about what different words a designer might type when looking for this type of reference from memory.

Generate 8-12 tags total covering:
- SCREEN TYPE or COMPONENT TYPE (1-2 tags): The primary subject name
- VISUAL STYLE (2-3 tags): Color scheme, aesthetic, mood
- LAYOUT (1-2 tags): How the primary subject is structured
- SYNONYMS (2-3 tags): Alternative search terms for the primary subject

Rules:
- All tags lowercase, 1-3 words each
- 8-12 tags total
- Tag the SUBJECT, not the inventory
- Do NOT include generic tags like "ui", "screenshot", "web", "design", "page", "screen"
- Return ONLY valid JSON, no markdown fences or explanation

Return exactly this format:
{
  "tags": ["tag1", "tag2", ...]
}`

export async function analyzeCapture(imageUrl: string): Promise<string[] | null> {
	const client = getClient()
	if (!client) return null

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
		})

		const raw = response.choices[0]?.message?.content ?? null
		if (!raw) return null

		const parsed = JSON.parse(raw)
		return Array.isArray(parsed.tags) ? parsed.tags : null
	} catch (error) {
		console.error("[analyze] Vision analysis failed:", error)
		return null
	}
}
