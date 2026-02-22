import {
	SURFACE,
	SHADOW_DARK,
	SHADOW_LIGHT,
	TEXT_GHOST,
	TEXT_SECONDARY,
} from "../constants"

export default function CtaButton({ children }: { children: React.ReactNode }) {
	return (
		<a
			href="#"
			className="inline-block"
			style={{
				padding: "18px 48px",
				borderRadius: 100,
				background: SURFACE,
				fontFamily: "var(--font-jetbrains), monospace",
				fontSize: 12,
				fontWeight: 400,
				letterSpacing: "0.1em",
				textTransform: "uppercase" as const,
				color: TEXT_GHOST,
				textDecoration: "none",
				boxShadow: `
          4px 4px 10px ${SHADOW_DARK},
          -4px -4px 10px ${SHADOW_LIGHT}
        `,
				transition: "all 0.25s ease",
				cursor: "pointer",
			}}
			onMouseEnter={(e) => {
				e.currentTarget.style.color = TEXT_SECONDARY
				e.currentTarget.style.boxShadow = `
          2px 2px 6px ${SHADOW_DARK},
          -2px -2px 6px ${SHADOW_LIGHT}
        `
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.color = TEXT_GHOST
				e.currentTarget.style.boxShadow = `
          4px 4px 10px ${SHADOW_DARK},
          -4px -4px 10px ${SHADOW_LIGHT}
        `
			}}
			onMouseDown={(e) => {
				e.currentTarget.style.boxShadow = `
          inset 3px 3px 8px ${SHADOW_DARK},
          inset -3px -3px 8px ${SHADOW_LIGHT}
        `
			}}
			onMouseUp={(e) => {
				e.currentTarget.style.boxShadow = `
          2px 2px 6px ${SHADOW_DARK},
          -2px -2px 6px ${SHADOW_LIGHT}
        `
			}}
		>
			{children}
		</a>
	)
}
