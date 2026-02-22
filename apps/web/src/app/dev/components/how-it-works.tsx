import { SHADOW_DARK, SHADOW_LIGHT, TEXT_PRIMARY, TEXT_SECONDARY } from "../constants"
import { steps } from "../constants"
import SectionLabel from "./section-label"
import SectionHeading from "./section-heading"

export default function HowItWorks() {
	return (
		<section
			id="how"
			style={{ padding: "120px 48px" }}
		>
			<SectionLabel>How it works</SectionLabel>
			<SectionHeading>
				Capture what you notice. Find it when you need it.
			</SectionHeading>

			<div className="mt-16 flex flex-col">
				{steps.map((step, i) => (
					<div
						key={i}
						className="flex items-baseline gap-6 py-8 max-md:flex-col max-md:gap-2"
						style={{
							borderBottom: "1px solid transparent",
							boxShadow:
								i === 0
									? `0 1px 0 ${SHADOW_LIGHT}`
									: `0 1px 0 ${SHADOW_LIGHT}, 0 0px 0 ${SHADOW_DARK}`,
						}}
					>
						<span
							className="shrink-0 max-md:w-auto"
							style={{
								fontFamily: "var(--font-dm-serif), serif",
								fontSize: 48,
								color: SHADOW_DARK,
								textShadow: `1px 1px 1px ${SHADOW_LIGHT}`,
								width: 60,
							}}
						>
							{i + 1}
						</span>
						<div>
							<h3
								className="mb-1.5"
								style={{
									fontFamily: "var(--font-inter), sans-serif",
									fontSize: 16,
									fontWeight: 500,
									color: TEXT_PRIMARY,
								}}
							>
								{step.title}
							</h3>
							<p
								style={{
									fontSize: 14,
									fontWeight: 300,
									lineHeight: 1.7,
									color: TEXT_SECONDARY,
								}}
							>
								{step.desc}
							</p>
						</div>
					</div>
				))}
			</div>
		</section>
	)
}
