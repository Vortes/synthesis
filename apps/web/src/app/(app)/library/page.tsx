"use client"

import { useState, useMemo } from "react"
import { ImageIcon } from "lucide-react"
import { SearchGateway, CaptureGrid } from "@synthesis/ui"
import type { CaptureCardData, CaptureGroup } from "@synthesis/ui"
import { trpc } from "@/trpc/client"

function groupCapturesByDate(captures: CaptureCardData[]): CaptureGroup[] {
	const now = new Date()
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	const yesterday = new Date(today)
	yesterday.setDate(yesterday.getDate() - 1)

	const groups: Record<string, CaptureCardData[]> = {}
	const groupOrder: string[] = []

	for (const capture of captures) {
		const date = new Date(capture.createdAt)
		const captureDay = new Date(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
		)

		let label: string
		if (captureDay.getTime() === today.getTime()) {
			label = "Today"
		} else if (captureDay.getTime() === yesterday.getTime()) {
			label = "Yesterday"
		} else {
			label = captureDay.toLocaleDateString(undefined, {
				month: "short",
				day: "numeric",
				year: "numeric",
			})
		}

		if (!groups[label]) {
			groups[label] = []
			groupOrder.push(label)
		}
		groups[label]!.push(capture)
	}

	return groupOrder.map((label) => ({ label, captures: groups[label]! }))
}

export default function LibraryPage() {
	const [query, setQuery] = useState("")
	const [activeTags, setActiveTags] = useState<string[]>([])
	const [deletingId, setDeletingId] = useState<string | null>(null)
	const utils = trpc.useUtils()

	const { data: captures = [], isLoading } = trpc.capture.list.useQuery()

	const deleteCapture = trpc.capture.delete.useMutation({
		onMutate: ({ id }) => setDeletingId(id),
		onSettled: () => {
			setDeletingId(null)
			utils.capture.list.invalidate()
		},
	})

	// Derive suggested tag pills from the library
	const suggestedTags = useMemo(() => {
		if (!captures.length) return []

		if (!query.trim() && activeTags.length === 0) {
			// Default: most frequent first-tags (screen types) from user's library
			const firstTags = captures
				.map((c) => c.tags?.[0])
				.filter(Boolean) as string[]
			const counts = new Map<string, number>()
			for (const tag of firstTags) {
				counts.set(tag, (counts.get(tag) ?? 0) + 1)
			}
			return [...counts.entries()]
				.sort((a, b) => b[1] - a[1])
				.slice(0, 5)
				.map(([tag]) => tag)
		}

		// While typing: find tags that match the current query
		const q = query.toLowerCase()
		const allTags = new Set(captures.flatMap((c) => c.tags ?? []))
		return [...allTags]
			.filter((tag) => tag.includes(q) && !activeTags.includes(tag))
			.slice(0, 6)
	}, [captures, query, activeTags])

	// Client-side filtering — synchronous, no spinner
	const filteredCaptures = useMemo(() => {
		let results = captures

		// AND logic: capture must have ALL active tags
		if (activeTags.length > 0) {
			results = results.filter((c) =>
				activeTags.every((tag) => c.tags?.includes(tag)),
			)
		}

		// Every word in the query must match some tag
		const trimmed = query.trim().toLowerCase()
		if (trimmed) {
			const words = trimmed.split(/\s+/)
			results = results.filter((c) =>
				words.every((word) => c.tags?.some((t) => t.includes(word))),
			)
		}

		return results
	}, [captures, query, activeTags])

	const isFiltering = query.trim().length > 0 || activeTags.length > 0

	// Build groups for CaptureGrid
	const groups: CaptureGroup[] = useMemo(() => {
		if (isFiltering) {
			// Flat list — single group with no label when filtering
			return filteredCaptures.length > 0
				? [{ label: "", captures: filteredCaptures }]
				: []
		}
		return groupCapturesByDate(filteredCaptures)
	}, [isFiltering, filteredCaptures])

	const totalCount = captures.length
	const filteredCount = filteredCaptures.length

	// Count label
	const countLabel = isFiltering
		? `${filteredCount} of ${totalCount} captures`
		: `${totalCount} capture${totalCount === 1 ? "" : "s"}`

	return (
		<>
			{/* Search gateway */}
			<SearchGateway
				onQueryChange={setQuery}
				onActiveTagsChange={setActiveTags}
				suggestedTags={suggestedTags}
			/>

			{/* Loading state — only for initial data fetch */}
			{isLoading && (
				<div className="flex items-center justify-center py-20">
					<div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-whisper border-t-orange" />
				</div>
			)}

			{/* Library grid */}
			{!isLoading && (
				<div className="flex-1 overflow-y-auto px-10 pt-3 pb-10 scrollbar-thin">
					{/* Count label */}
					{totalCount > 0 && (
						<p className="font-mono text-[11px] font-light tracking-[0.06em] text-ink-whisper mb-5">
							{countLabel}
						</p>
					)}

					{/* No matches state — filtering returned nothing but captures exist */}
					{isFiltering && filteredCount === 0 && totalCount > 0 ? (
						<div className="flex flex-col items-center justify-center gap-3 py-20 text-ink-quiet">
							<ImageIcon className="h-10 w-10" />
							<p className="text-sm">No matches</p>
						</div>
					) : (
						<CaptureGrid
							groups={groups}
							onDelete={(id) => deleteCapture.mutate({ id })}
							deletingId={deletingId}
						/>
					)}
				</div>
			)}
		</>
	)
}
