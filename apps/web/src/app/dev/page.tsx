"use client"

import { useEffect, useState } from "react"
import { DESK, SURFACE, TEXT_PRIMARY } from "./constants"
import Nav from "./components/nav"
import Hero from "./components/hero"
import Divider from "./components/divider"
import HowItWorks from "./components/how-it-works"
import Manifesto from "./components/manifesto"
import Pillars from "./components/pillars"
import CtaSection from "./components/cta-section"
import Footer from "./components/footer"

export default function DevPage() {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	return (
		<div
			className="min-h-screen"
			style={{
				backgroundColor: DESK,
				fontFamily: "var(--font-inter), sans-serif",
				lineHeight: 1.6,
				WebkitFontSmoothing: "antialiased",
			}}
		>
			{/* Desk grain — subtle texture on the dark surface */}
			<div
				className="pointer-events-none fixed inset-0 z-[1]"
				style={{
					opacity: 0.12,
					backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
					backgroundSize: "256px 256px",
				}}
			/>

			{/* Paper surface — centered, fixed width */}
			<div
				className="relative z-[2] mx-auto"
				style={{
					minHeight: "100vh",
					backgroundColor: SURFACE,
					color: TEXT_PRIMARY,
					boxShadow: `
            0 4px 16px rgba(0,0,0,0.15),
            0 12px 40px rgba(0,0,0,0.12),
            0 24px 80px rgba(0,0,0,0.1),
            -2px 0 8px rgba(0,0,0,0.06),
            2px 0 8px rgba(0,0,0,0.06)
          `,
				}}
			>
				{/* Paper grain overlay */}
				<div
					className="pointer-events-none absolute inset-0 z-[60]"
					style={{
						opacity: 0.3,
						backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
						backgroundSize: "256px 256px",
					}}
				/>

				{/* Content */}
				<div className="relative z-[40]">
					<Nav mounted={mounted} />
					<Hero mounted={mounted} />
					<Divider />
					<HowItWorks />
					<Divider />
					<Manifesto />
					<Divider />
					<Pillars />
					<CtaSection />
					<Footer />
				</div>
			</div>
		</div>
	)
}
