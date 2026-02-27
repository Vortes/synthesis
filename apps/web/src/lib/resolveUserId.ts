import { auth } from "@clerk/nextjs/server"
import { createClerkClient } from "@clerk/nextjs/server"

const clerkClient = createClerkClient({
	secretKey: process.env.CLERK_SECRET_KEY!,
})

export async function resolveUserId(req: Request): Promise<string | null> {
	// Path 1: Clerk session (web clients — cookies/session JWT)
	try {
		const { userId } = await auth()
		if (userId) {
			console.log(`[resolveUserId] Session auth succeeded: ${userId}`)
			return userId
		}
	} catch {
		// auth() may fail outside of Next.js request context — continue to Path 2
	}

	// Path 2: OAuth Bearer token (desktop client)
	const header = req.headers.get("authorization")
	if (!header?.startsWith("Bearer ")) return null
	const token = header.slice(7)

	try {
		// Verify the OAuth access token via Clerk's Backend API
		const response = await fetch(
			"https://api.clerk.com/v1/oauth_applications/access_tokens/verify",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ token }),
			},
		)

		if (!response.ok) {
			const text = await response.text()
			console.error(
				`[resolveUserId] Clerk token verify failed (${response.status}): ${text}`,
			)
			return null
		}

		const data = (await response.json()) as { sub?: string; user_id?: string }
		const userId = data.sub || data.user_id || null
		console.log(`[resolveUserId] OAuth token verified, userId: ${userId}`)
		return userId
	} catch (err) {
		console.error("[resolveUserId] Token verification error:", err)
		return null
	}
}
