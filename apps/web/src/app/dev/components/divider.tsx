import { SHADOW_DARK, SHADOW_LIGHT } from "../constants"

export default function Divider() {
	return (
		<div
			className="mx-auto"
			style={{
				width: 60,
				height: 1,
				boxShadow: `0 -1px 0 ${SHADOW_DARK}, 0 1px 0 ${SHADOW_LIGHT}`,
			}}
		/>
	)
}
