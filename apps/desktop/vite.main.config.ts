import { defineConfig } from "vite"

export default defineConfig(() => ({
	define: {
		"process.env.VITE_WEB_URL": JSON.stringify(process.env.VITE_WEB_URL),
		"process.env.CLERK_OAUTH_CLIENT_ID": JSON.stringify(
			process.env.CLERK_OAUTH_CLIENT_ID ?? "",
		),
		"process.env.CLERK_DOMAIN": JSON.stringify(process.env.CLERK_DOMAIN!),
		"process.env.APP_PROTOCOL": JSON.stringify(process.env.APP_PROTOCOL!),
		"process.env.VITE_VERCEL_PROTECTION_BYPASS": JSON.stringify(
			process.env.VITE_VERCEL_PROTECTION_BYPASS ?? "",
		),
	},
	build: {
		rollupOptions: {
			external: [/\.node$/],
		},
	},
}))
