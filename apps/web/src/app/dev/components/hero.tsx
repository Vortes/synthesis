import { SURFACE, SHADOW_DARK, SHADOW_DARKER, SHADOW_LIGHT, TEXT_GHOST } from "../constants"
import CtaButton from "./cta-button"

export default function Hero({ mounted }: { mounted: boolean }) {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center px-12 py-20">
			<div className="relative mb-6 flex items-center justify-center">
				<span
					aria-hidden="true"
					className="select-none"
					style={{
						fontFamily: "var(--font-dm-serif), serif",
						fontSize: "clamp(72px, 12vw, 160px)",
						fontWeight: 400,
						lineHeight: 0.9,
						letterSpacing: "0.06em",
						textAlign: "center" as const,
						color: SURFACE,
						textShadow: `
                    -2px -2px 3px ${SHADOW_DARK},
                    -1px -1px 2px ${SHADOW_DARKER},
                    2px 2px 3px ${SHADOW_LIGHT},
                    1px 1px 1px rgba(255, 252, 248, 0.8)
                  `,
						opacity: mounted ? 1 : 0,
						transform: mounted ? "translateY(0)" : "translateY(8px)",
						transition: "opacity 2s ease 0.5s, transform 2s ease 0.5s",
					}}
				>
					curate
				</span>
			</div>
			<p
				className="mb-10 text-center"
				style={{
					fontSize: "clamp(14px, 1.6vw, 20px)",
					fontWeight: 300,
					letterSpacing: "0.04em",
					maxWidth: 520,
					color: TEXT_GHOST,
					lineHeight: 1.7,
					opacity: mounted ? 1 : 0,
					transform: mounted ? "translateY(0)" : "translateY(6px)",
					transition: "opacity 2s ease 1s, transform 2s ease 1s",
				}}
			>
				Your design memory, always organized.
			</p>

			<div
				style={{
					opacity: mounted ? 1 : 0,
					transform: mounted ? "translateY(0)" : "translateY(6px)",
					transition: "opacity 2s ease 1.4s, transform 2s ease 1.4s",
				}}
			>
				<CtaButton>Request early access</CtaButton>
			</div>
		</div>
	)
}
