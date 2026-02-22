import { TEXT_PRIMARY } from "../constants"
import CtaButton from "./cta-button"

export default function CtaSection() {
	return (
		<div
			className="flex min-h-[60vh] flex-col items-center justify-center text-center"
			style={{ padding: "120px 48px" }}
		>
			<h2
				className="mx-auto mb-12"
				style={{
					fontFamily: "var(--font-dm-serif), serif",
					fontSize: "clamp(32px, 5vw, 60px)",
					fontWeight: 400,
					lineHeight: 1.05,
					letterSpacing: "-0.02em",
					color: TEXT_PRIMARY,
					maxWidth: 700,
				}}
			>
				Everything you notice becomes a reference you can actually use.
			</h2>
			<CtaButton>Request early access</CtaButton>
		</div>
	)
}
