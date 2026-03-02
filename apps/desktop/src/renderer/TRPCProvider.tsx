import { useEffect, useRef, useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { httpBatchLink } from "@trpc/client"
import superjson from "superjson"
import { trpc } from "./trpc"
import { useAuth } from "./AuthProvider"

export function TRPCProvider({ children }: { children: React.ReactNode }) {
	const { token, signOut } = useAuth()
	const tokenRef = useRef(token)
	const signOutRef = useRef(signOut)

	useEffect(() => {
		tokenRef.current = token
	}, [token])

	useEffect(() => {
		signOutRef.current = signOut
	}, [signOut])

	const [queryClient] = useState(() => new QueryClient())
	const [trpcClient] = useState(() =>
		trpc.createClient({
			links: [
				httpBatchLink({
					url: `${import.meta.env.VITE_WEB_URL || "http://localhost:3000"}/api/trpc`,
					transformer: superjson,
					headers: () => {
						const h: Record<string, string> = {}
						if (tokenRef.current) {
							h["Authorization"] = `Bearer ${tokenRef.current}`
						}
						const bypass = import.meta.env.VITE_VERCEL_PROTECTION_BYPASS
						if (bypass) {
							h["x-vercel-protection-bypass"] = bypass
						}
						return h
					},
					fetch: async (input, init) => {
						const res = await fetch(input, init)
						if (res.status === 401) {
							signOutRef.current()
						}
						return res
					},
				}),
			],
		}),
	)

	return (
		<trpc.Provider
			client={trpcClient}
			queryClient={queryClient}
		>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</trpc.Provider>
	)
}
