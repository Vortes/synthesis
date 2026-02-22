import { LayoutGrid, Activity, Globe, Settings } from "lucide-react"
import { cn } from "../../lib/utils"

interface CollectionItem {
	label: string
	color: string
	count: number
	href?: string
}

interface SidebarProps {
	activePath?: string
	className?: string
	collections?: CollectionItem[]
	platform?: "web" | "desktop"
}

const navItems = [
	{ label: "Library", icon: LayoutGrid, href: "/library", count: 247 },
	{ label: "Flows", icon: Activity, href: "/flows", count: 12 },
	{ label: "Sources", icon: Globe, href: "/sources", count: 38 },
] as const

const defaultCollections: CollectionItem[] = [
	{ label: "Onboarding patterns", color: "#6B8E6B", count: 34 },
	{ label: "Navigation", color: "#7B8DAF", count: 21 },
	{ label: "Data tables", color: "#C4956A", count: 18 },
	{ label: "Settings pages", color: "#9B7BB5", count: 15 },
	{ label: "Empty states", color: "#B5736B", count: 9 },
]

export function Sidebar({
	activePath = "/",
	className,
	collections,
	platform = "web",
}: SidebarProps) {
	const collectionItems = collections ?? defaultCollections
	const isDesktop = platform === "desktop"

	return (
		<aside
			className={cn(
				"w-[220px] min-w-[220px] bg-surface flex flex-col pb-6 relative",
				isDesktop ? "pt-0" : "py-6",
				className,
			)}
		>
			{/* Right edge sculpted border */}
			<div className="absolute right-0 top-0 bottom-0 w-px bg-transparent shadow-sculpted-v" />

			{/* macOS traffic light clearance + drag region (desktop only) */}
			{isDesktop && (
				<div className="h-[52px] shrink-0 drag-region" />
			)}

			{/* Brand area */}
			<div className="px-6 mb-8 flex items-center gap-2">
				<div className="w-1.5 h-1.5 rounded-full bg-orange shrink-0" />
				<span className="font-mono text-[13px] font-normal tracking-[0.06em] text-ink">
					synthesis
				</span>
			</div>

			{/* Nav section */}
			<nav>
				{navItems.map((item) => {
					const isActive = activePath === item.href
					return (
						<a
							key={item.href}
							href={item.href}
							className={cn(
								"flex items-center gap-2.5 px-6 py-2 text-[13.5px] font-normal cursor-pointer transition-all duration-200 relative",
								isActive
									? "text-ink"
									: "text-ink-quiet hover:text-ink-mid hover:bg-black/[0.02]",
							)}
						>
							{isActive && (
								<span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-orange rounded-r" />
							)}
							<item.icon
								className={cn(
									"w-4 h-4 shrink-0",
									isActive ? "opacity-80" : "opacity-50",
								)}
							/>
							{item.label}
							<span className="ml-auto font-mono text-[11px] text-ink-whisper font-light">
								{item.count}
							</span>
						</a>
					)
				})}
			</nav>

			{/* Sculpted divider */}
			<div className="h-px mx-6 my-3 bg-transparent shadow-sculpted-h" />

			{/* Collections section */}
			<div className="flex-1 overflow-y-auto">
				<div className="font-mono text-[10px] font-normal uppercase tracking-[0.1em] text-ink-whisper px-6 mb-2">
					Collections
				</div>
				{collectionItems.map((item, index) => {
					const href = item.href ?? "#"
					const isActive = item.href ? activePath === item.href : false
					return (
						<a
							key={index}
							href={href}
							className={cn(
								"flex items-center gap-2.5 px-6 py-2 text-[13.5px] font-normal cursor-pointer transition-all duration-200 relative",
								isActive
									? "text-ink"
									: "text-ink-quiet hover:text-ink-mid hover:bg-black/[0.02]",
							)}
						>
							{isActive && (
								<span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-orange rounded-r" />
							)}
							<span
								className="w-2 h-2 rounded-full shrink-0"
								style={{ background: item.color }}
							/>
							{item.label}
							<span className="ml-auto font-mono text-[11px] text-ink-whisper font-light">
								{item.count}
							</span>
						</a>
					)
				})}
			</div>

			{/* Footer */}
			<div className="px-6 py-4 mt-auto border-t border-edge">
				<div className="flex items-center gap-2.5 py-1.5 text-ink-quiet text-[13px] cursor-pointer transition-all duration-200 hover:text-ink-mid">
					<Settings className="w-[15px] h-[15px] opacity-40" />
					Settings
				</div>
			</div>
		</aside>
	)
}
