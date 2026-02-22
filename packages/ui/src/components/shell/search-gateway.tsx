"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "../../lib/utils";

interface SearchGatewayProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filter: string) => void;
  className?: string;
}

const filters = ["All", "Components", "Flows", "Pages"] as const;

export function SearchGateway({ onSearch, onFilterChange, className }: SearchGatewayProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleBlur = useCallback(() => {
    // Small delay so clicking a filter pill doesn't dismiss
    setTimeout(() => {
      if (document.activeElement?.closest("[data-filter-pill]")) return;
      setIsFocused(false);
    }, 150);
  }, []);

  const handleOverlayClick = useCallback(() => {
    inputRef.current?.blur();
    setIsFocused(false);
  }, []);

  const handleFilterClick = useCallback((filter: string) => {
    setActiveFilter(filter);
    onFilterChange?.(filter);
    inputRef.current?.focus();
  }, [onFilterChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      inputRef.current?.blur();
      setIsFocused(false);
    }
  }, []);

  // Cmd+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Submit on Enter
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query.trim());
  }, [query, onSearch]);

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-ink/[0.08] backdrop-blur-[2px] z-[5] transition-opacity duration-300",
          isFocused ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={handleOverlayClick}
      />

      {/* Search container */}
      <div className={cn("px-10 pt-7 relative", isFocused && "z-20", className)}>
        <form onSubmit={handleSubmit} className="relative w-full">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Search your library..."
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent border-0 border-b-[1.5px] border-shadow-dark py-2 font-serif font-light tracking-tight text-ink outline-none transition-all duration-200 placeholder:text-ink-whisper placeholder:font-light placeholder:italic focus:border-shadow-dark"
            style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
          />

          {/* Cmd+K shortcut badge */}
          <div
            className={cn(
              "absolute right-0 bottom-3.5 flex items-center gap-1 pointer-events-none transition-opacity duration-200",
              isFocused && "opacity-0"
            )}
          >
            <span className="inline-flex items-center justify-center h-[22px] min-w-[22px] px-1.5 bg-surface-cool rounded-[5px] font-mono text-[10.5px] font-normal text-ink-whisper shadow-key-badge">
              ⌘
            </span>
            <span className="inline-flex items-center justify-center h-[22px] min-w-[22px] px-1.5 bg-surface-cool rounded-[5px] font-mono text-[10.5px] font-normal text-ink-whisper shadow-key-badge">
              K
            </span>
          </div>

          {/* Filter pills */}
          <div
            className={cn(
              "flex items-center gap-1.5 pt-4 flex-wrap transition-all duration-[250ms]",
              isFocused
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-1 pointer-events-none"
            )}
          >
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                data-filter-pill
                onClick={() => handleFilterClick(filter)}
                className={cn(
                  "font-mono text-[11.5px] font-normal tracking-[0.04em] px-3.5 py-1.5 rounded-full cursor-pointer transition-all duration-200 border",
                  activeFilter === filter
                    ? "text-ink border-ink bg-black/[0.03]"
                    : "text-ink-quiet border-edge bg-transparent hover:text-ink-mid hover:border-shadow-dark hover:bg-black/[0.02]"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </form>
      </div>
    </>
  );
}
