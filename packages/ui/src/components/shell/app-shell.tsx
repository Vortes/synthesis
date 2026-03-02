import { Sidebar } from "./sidebar"
import { cn } from "../../lib/utils"

interface AppShellProps {
	activePath?: string
	pageTitle?: string
	children: React.ReactNode
	className?: string
	userButton?: React.ReactNode
	platform?: "web" | "desktop"
	onSignOut?: () => void | Promise<void>
	isSigningOut?: boolean
}

export function AppShell({
	activePath,
	children,
	className,
	userButton,
	platform = "web",
	onSignOut,
	isSigningOut,
}: AppShellProps) {
	const isDesktop = platform === "desktop"

	return (
		<div className="flex h-screen bg-edge text-foreground">
			<Sidebar
				activePath={activePath}
				platform={platform}
				onSignOut={onSignOut}
				isSigningOut={isSigningOut}
			/>
			<main
				className={cn(
					"flex-1 flex flex-col bg-surface overflow-hidden",
					className,
				)}
			>
				{/* Drag region for frameless window (desktop only) */}
				{isDesktop && <div className="h-[52px] shrink-0 drag-region" />}
				{children}
			</main>
		</div>
	)
}
