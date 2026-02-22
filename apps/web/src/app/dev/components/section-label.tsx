import { TEXT_GHOST } from "../constants"

export default function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<span
			className="mb-6 block uppercase"
			style={{
				fontFamily: "var(--font-jetbrains), monospace",
				fontSize: 11,
				letterSpacing: "0.12em",
				color: TEXT_GHOST,
			}}
		>
			{children}
		</span>
	)
}
