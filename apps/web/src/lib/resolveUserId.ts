import { auth } from "@clerk/nextjs/server"

export async function resolveUserId(req: Request): Promise<string | null> {
	// Debug: log the incoming auth header
	const authHeader = req.headers.get("authorization")
	console.log(`[resolveUserId] Authorization header present: ${!!authHeader}`)
	if (authHeader) {
		console.log(
			`[resolveUserId] Token prefix: ${authHeader.substring(0, 20)}...`,
		)
	}

	// Accepts both web session cookies (session_token) and
	// desktop OAuth Bearer tokens (oauth_token)
	const authResult = await auth({
		acceptsToken: ["session_token", "oauth_token"],
	})

	// Debug: log the full auth result
	console.log(`[resolveUserId] auth() result keys:`, Object.keys(authResult))
	console.log(
		`[resolveUserId] auth() result:`,
		JSON.stringify(authResult, null, 2),
	)

	if ("userId" in authResult && authResult.userId) return authResult.userId
	if ("subject" in authResult && authResult.subject) return authResult.subject
	return null
}
