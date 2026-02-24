"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

interface SearchGatewayProps {
	onQueryChange: (query: string) => void
	onActiveTagsChange: (tags: string[]) => void
	suggestedTags: string[]
	suggestedApps?: string[]
	allTags?: string[]
	onActiveAppsChange?: (apps: string[]) => void
	className?: string
}

export function SearchGateway({
	onQueryChange,
	onActiveTagsChange,
	suggestedTags,
	suggestedApps = [],
	allTags = [],
	onActiveAppsChange,
	className,
}: SearchGatewayProps) {
	const [inputValue, setInputValue] = useState("")
	const [activeTags, setActiveTags] = useState<string[]>([])
	const [activeApps, setActiveApps] = useState<string[]>([])
	const inputRef = useRef<HTMLInputElement>(null)
	const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

	// Compute autocomplete suggestion from the full tag pool
	const autocompleteSuggestion = useMemo(() => {
		const q = inputValue.trim().toLowerCase()
		if (!q || q.length < 2) return null

		// Find the best prefix match (prioritize starts-with over contains)
		const match = allTags.find(
			(tag) =>
				tag.toLowerCase().startsWith(q) &&
				!activeTags.includes(tag) &&
				!activeApps.includes(tag),
		)
		return match ?? null
	}, [inputValue, allTags, activeTags, activeApps])

	// The ghost completion text (portion after what the user typed)
	const ghostText = useMemo(() => {
		if (!autocompleteSuggestion) return ""
		const q = inputValue.trim()
		// Return the remaining characters preserving the suggestion's casing
		return autocompleteSuggestion.slice(q.length)
	}, [autocompleteSuggestion, inputValue])

	// Accept autocomplete: fill in the word and keep it in search
	const acceptAutocomplete = useCallback(() => {
		if (!autocompleteSuggestion) return false

		setInputValue(autocompleteSuggestion)
		onQueryChange(autocompleteSuggestion)
		return true
	}, [autocompleteSuggestion, onQueryChange])

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

	// Sync active apps to parent
	useEffect(() => {
		onActiveAppsChange?.(activeApps)
	}, [activeApps, onActiveAppsChange])

	// Toggle a tag pill on/off
	const handleTagClick = useCallback((tag: string) => {
		setActiveTags((prev) =>
			prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
		)
	}, [])

	// Toggle an app pill on/off
	const handleAppClick = useCallback((app: string) => {
		setActiveApps((prev) =>
			prev.includes(app) ? prev.filter((a) => a !== app) : [...prev, app],
		)
	}, [])

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Tab" && ghostText) {
				e.preventDefault()
				acceptAutocomplete()
				return
			}
			if (e.key === "Escape") {
				setInputValue("")
				setActiveTags([])
				setActiveApps([])
				onQueryChange("")
				inputRef.current?.blur()
			}
		},
		[onQueryChange, ghostText, acceptAutocomplete],
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

	const isFocusedOrActive = inputValue.length > 0 || activeTags.length > 0 || activeApps.length > 0

	return (
		<div className={cn("px-10 pt-7", className)}>
			<div className="relative w-full">
				{/* Input + ghost text overlay */}
				<div className="relative">
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

					{/* Ghost autocomplete text */}
					{ghostText && (
						<div
							aria-hidden
							className="absolute top-0 left-0 py-2 font-serif font-light tracking-tight pointer-events-none whitespace-nowrap overflow-hidden"
							style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
						>
							<span className="invisible">{inputValue}</span>
							<span className="text-ink-whisper">{ghostText}</span>
						</div>
					)}
				</div>

				{/* Tab hint — shown when autocomplete is available */}
				{ghostText && (
					<div className="absolute right-0 bottom-3.5 flex items-center gap-1 pointer-events-none animate-fade-in-up" style={{ animationDuration: "0.2s" }}>
						<span className="inline-flex items-center justify-center h-[22px] min-w-[22px] px-1.5 bg-surface-cool rounded-[5px] font-mono text-[10.5px] font-normal text-ink-whisper shadow-key-badge">
							Tab
						</span>
					</div>
				)}

				{/* Cmd+K shortcut badge — hidden when query is active or autocomplete showing */}
				{!ghostText && (
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
				)}

				{/* App + Tag pills */}
				{(suggestedTags.length > 0 || suggestedApps.length > 0) && (
					<div className="flex items-center gap-1.5 py-4 flex-wrap">
						{/* App filter pills */}
						{suggestedApps.map((app) => {
							const isActive = activeApps.includes(app)
							return (
								<button
									key={`app-${app}`}
									type="button"
									onClick={() => handleAppClick(app)}
									className={cn(
										"font-mono text-[11.5px] font-normal tracking-[0.04em] px-3.5 py-1.5 rounded-full cursor-pointer transition-all duration-200 border inline-flex items-center gap-1.5",
										isActive
											? "text-dark-text bg-ink border-ink"
											: "text-ink-quiet border-edge bg-transparent hover:text-ink-mid hover:border-shadow-dark hover:bg-black/[0.02]",
									)}
								>
									{app}
									{isActive && <X className="w-3 h-3" />}
								</button>
							)
						})}
						{/* Tag filter pills */}
						{suggestedTags.map((tag) => {
							const isActive = activeTags.includes(tag)
							return (
								<button
									key={tag}
									type="button"
									onClick={() => handleTagClick(tag)}
									className={cn(
										"font-mono text-[11.5px] font-normal tracking-[0.04em] px-3.5 py-1.5 rounded-full cursor-pointer transition-all duration-200 border inline-flex items-center gap-1.5",
										isActive
											? "text-dark-text bg-ink border-ink"
											: "text-ink-quiet border-edge bg-transparent hover:text-ink-mid hover:border-shadow-dark hover:bg-black/[0.02]",
									)}
								>
									{tag}
									{isActive && <X className="w-3 h-3" />}
								</button>
							)
						})}

						{/* Clear all filters */}
						{(activeTags.length > 0 || activeApps.length > 0) && (
							<button
								type="button"
								onClick={() => {
									setActiveTags([])
									setActiveApps([])
								}}
								className="font-mono text-[11.5px] font-normal tracking-[0.04em] px-3.5 py-1.5 text-ink-quiet hover:text-ink-mid cursor-pointer transition-colors duration-200"
							>
								Clear all
							</button>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
