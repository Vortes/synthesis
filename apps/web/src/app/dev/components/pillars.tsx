import { SURFACE, SHADOW_DARK, SHADOW_LIGHT, TEXT_GHOST, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants"
import { pillars } from "../constants"
import SectionLabel from "./section-label"
import SectionHeading from "./section-heading"

export default function Pillars() {
	return (
		<section
			id="principles"
			style={{ padding: "120px 48px" }}
		>
			<SectionLabel>Principles</SectionLabel>
			<SectionHeading>What we believe.</SectionHeading>

			<div className="mt-20 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-8">
				{pillars.map((p) => (
					<div
						key={p.num}
						className="rounded-2xl"
						style={{
							padding: "40px 36px",
							background: SURFACE,
							boxShadow: `
                      6px 6px 14px ${SHADOW_DARK},
                      -6px -6px 14px ${SHADOW_LIGHT},
                      inset 1px 1px 3px rgba(255, 252, 248, 0.5),
                      inset -1px -1px 3px rgba(174, 168, 159, 0.2)
                    `,
						}}
					>
						<span
							className="mb-4 block uppercase"
							style={{
								fontFamily: "var(--font-jetbrains), monospace",
								fontSize: 11,
								letterSpacing: "0.1em",
								color: TEXT_GHOST,
							}}
						>
							{p.num}
						</span>
						<h3
							className="mb-3"
							style={{
								fontFamily: "var(--font-dm-serif), serif",
								fontSize: 22,
								fontWeight: 400,
								color: TEXT_PRIMARY,
							}}
						>
							{p.title}
						</h3>
						<p
							style={{
								fontSize: 14,
								fontWeight: 300,
								lineHeight: 1.7,
								color: TEXT_SECONDARY,
							}}
						>
							{p.desc}
						</p>
					</div>
				))}
			</div>
		</section>
	)
}
