import { SHADOW_DARK, SHADOW_LIGHT, TEXT_PRIMARY } from "../constants"

export default function SectionHeading({ children }: { children: React.ReactNode }) {
	return (
		<h2
			style={{
				fontFamily: "var(--font-dm-serif), serif",
				fontSize: "clamp(28px, 4.5vw, 48px)",
				fontWeight: 400,
				lineHeight: 1.1,
				letterSpacing: "-0.01em",
				maxWidth: 600,
				color: TEXT_PRIMARY,
				opacity: 0.25,
				textShadow: `
          -1px -1px 2px ${SHADOW_DARK},
          1px 1px 2px ${SHADOW_LIGHT}
        `,
			}}
		>
			{children}
		</h2>
	)
}
