import { TEXT_PRIMARY, TEXT_SECONDARY } from "../constants"

const proseStyle = {
	fontFamily: "var(--font-dm-serif), serif",
	fontSize: "clamp(18px, 2.4vw, 26px)",
	fontWeight: 400,
	lineHeight: 1.6,
	color: TEXT_PRIMARY,
} as const

export default function Manifesto() {
	return (
		<div
			id="manifesto"
			className="mx-auto max-w-[640px]"
			style={{ padding: "120px 48px" }}
		>
			<p className="mb-7" style={proseStyle}>
				Every designer has the same dirty secret.
			</p>
			<p className="mb-7" style={proseStyle}>
				A Screenshots folder with 2,000 images you&apos;ll never open
				again. A dozen Pinterest boards collecting dust. A perfect example
				of exactly the thing you need right now &mdash; buried somewhere.
			</p>
			<p className="mb-7" style={proseStyle}>
				The problem was never finding inspiration. It was the gap between{" "}
				<em style={{ fontStyle: "italic", color: TEXT_SECONDARY }}>
					seeing something great
				</em>{" "}
				and{" "}
				<em style={{ fontStyle: "italic", color: TEXT_SECONDARY }}>
					needing it later
				</em>
				.
			</p>
			<p className="mb-7" style={proseStyle}>
				You already have taste. You already notice things. You just need a
				place where those observations don&apos;t disappear.
			</p>
		</div>
	)
}
