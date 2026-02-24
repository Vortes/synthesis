import { SURFACE, TEXT_GHOST, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants"

export default function Nav({ mounted }: { mounted: boolean }) {
	return (
		<nav
			className="sticky top-0 z-[70] flex items-center justify-between"
			style={{
				padding: "28px 48px",
				backgroundColor: SURFACE,
				opacity: mounted ? 1 : 0,
				transition: "opacity 1s ease 0.3s",
			}}
		>
			<div
				style={{
					fontFamily: "var(--font-dm-serif), serif",
					fontSize: 18,
					letterSpacing: "0.02em",
					color: TEXT_SECONDARY,
				}}
			>
				curate
			</div>
			<ul className="flex list-none gap-9">
				{[
					{ label: "How it works", href: "#how" },
					{ label: "Principles", href: "#principles" },
					{ label: "About", href: "#manifesto" },
				].map((link) => (
					<li key={link.label}>
						<a
							href={link.href}
							style={{
								fontFamily: "var(--font-jetbrains), monospace",
								fontSize: 11,
								fontWeight: 400,
								letterSpacing: "0.08em",
								textTransform: "uppercase" as const,
								color: TEXT_GHOST,
								textDecoration: "none",
								transition: "color 0.4s ease",
							}}
							onMouseEnter={(e) =>
								(e.currentTarget.style.color = TEXT_PRIMARY)
							}
							onMouseLeave={(e) =>
								(e.currentTarget.style.color = TEXT_GHOST)
							}
						>
							{link.label}
						</a>
					</li>
				))}
			</ul>
		</nav>
	)
}
