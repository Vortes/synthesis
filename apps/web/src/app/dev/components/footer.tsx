import { TEXT_GHOST } from "../constants"

export default function Footer() {
	return (
		<footer
			className="flex items-center justify-between max-md:flex-col max-md:gap-3"
			style={{ padding: "48px" }}
		>
			<p
				style={{
					fontFamily: "var(--font-jetbrains), monospace",
					fontSize: 10,
					letterSpacing: "0.08em",
					color: TEXT_GHOST,
				}}
			>
				curate &mdash; 2026
			</p>
			<p
				style={{
					fontFamily: "var(--font-jetbrains), monospace",
					fontSize: 10,
					letterSpacing: "0.08em",
					color: TEXT_GHOST,
				}}
			>
				Your design memory, always organized.
			</p>
		</footer>
	)
}
