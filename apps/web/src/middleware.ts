import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtectedRoute = createRouteMatcher([
	"/library(.*)",
	"/collections(.*)",
])

const isPublicApiRoute = createRouteMatcher([
	"/api/webhooks(.*)",
	"/api/uploadthing(.*)",
	"/api/trpc(.*)",
	"/api/captures(.*)",
])

export default clerkMiddleware(async (auth, req) => {
	// Skip Clerk auth processing for API routes that use their own
	// Bearer token auth (desktop OAuth tokens)
	if (isPublicApiRoute(req)) return
	if (isProtectedRoute(req)) {
		await auth.protect()
	}
})

export const config = {
	matcher: [
		// Skip Next.js internals and static files
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
}
