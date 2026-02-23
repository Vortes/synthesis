"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "../../lib/utils"

interface SearchGatewayProps {
	onQueryChange: (query: string) => void
	onActiveTagsChange: (tags: string[]) => void
	suggestedTags: string[]
	className?: string
}

export function SearchGateway({
	onQueryChange,
	onActiveTagsChange,
	suggestedTags,
	className,
}: SearchGatewayProps) {
	const [inputValue, setInputValue] = useState("")
	const [activeTags, setActiveTags] = useState<string[]>([])
	const inputRef = useRef<HTMLInputElement>(null)
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	// Debounced query change
	const handleInputChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value
			setInputValue(value)

			if (debounceRef.current) clearTimeout(debounceRef.current)
			debounceRef.current = setTimeout(() => {
				onQueryChange(value)
			}, 150)
		},
		[onQueryChange],
	)

	// Sync active tags to parent via effect (avoids setState-during-render)
	useEffect(() => {
		onActiveTagsChange(activeTags)
	}, [activeTags, onActiveTagsChange])

	// Toggle a tag pill on/off
	const handleTagClick = useCallback((tag: string) => {
		setActiveTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
		)
	}, [])

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Escape") {
				setInputValue("")
				setActiveTags([])
				onQueryChange("")
				inputRef.current?.blur()
			}
		},
		[onQueryChange],
	)

	// Cmd+K global shortcut
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if ((e.metaKey || e.ctrlKey) && e.key === "k") {
				e.preventDefault()
				inputRef.current?.focus()
			}
		}
		document.addEventListener("keydown", handler)
		return () => document.removeEventListener("keydown", handler)
	}, [])

	// Cleanup debounce on unmount
	useEffect(() => {
		return () => {
			if (debounceRef.current) clearTimeout(debounceRef.current)
		}
	}, [])

	const isFocusedOrActive = inputValue.length > 0 || activeTags.length > 0

	return (
		<div className={cn("px-10 pt-7", className)}>
			<div className="relative w-full">
				<input
					ref={inputRef}
					type="text"
					value={inputValue}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					placeholder="Search your library..."
					autoComplete="off"
					spellCheck={false}
					className="w-full bg-transparent border-0 border-b-[1.5px] border-shadow-dark py-2 font-serif font-light tracking-tight text-ink outline-none transition-all duration-200 placeholder:text-ink-whisper placeholder:font-light placeholder:italic focus:border-shadow-dark"
					style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
				/>

				{/* Cmd+K shortcut badge — hidden when query is active */}
				<div
					className={cn(
						"absolute right-0 bottom-3.5 flex items-center gap-1 pointer-events-none transition-opacity duration-200",
						isFocusedOrActive && "opacity-0",
					)}
				>
					<span className="inline-flex items-center justify-center h-[22px] min-w-[22px] px-1.5 bg-surface-cool rounded-[5px] font-mono text-[10.5px] font-normal text-ink-whisper shadow-key-badge">
						⌘
					</span>
					<span className="inline-flex items-center justify-center h-[22px] min-w-[22px] px-1.5 bg-surface-cool rounded-[5px] font-mono text-[10.5px] font-normal text-ink-whisper shadow-key-badge">
						K
					</span>
				</div>

				{/* Tag pills */}
				{suggestedTags.length > 0 && (
					<div className="flex items-center gap-1.5 py-4 flex-wrap">
						{suggestedTags.map((tag) => {
							const isActive = activeTags.includes(tag)
							return (
								<button
									key={tag}
									type="button"
									onClick={() => handleTagClick(tag)}
									className={cn(
										"font-mono text-[11.5px] font-normal tracking-[0.04em] px-3.5 py-1.5 rounded-full cursor-pointer transition-all duration-200 border",
										isActive
											? "text-paper bg-ink border-ink"
											: "text-ink-quiet border-edge bg-transparent hover:text-ink-mid hover:border-shadow-dark hover:bg-black/[0.02]",
									)}
								>
									{tag}
								</button>
							)
						})}
					</div>
				)}
			</div>
		</div>
	)
}
