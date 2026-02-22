"use client";

import { useState, useCallback } from "react";
import { SearchGateway, CaptureGrid } from "@synthesis/ui";
import type { CaptureCardData } from "@synthesis/ui";
import { trpc } from "@/trpc/client";
import { UploadCaptureButton } from "@/components/upload-capture-button";

function groupCapturesByDate(captures: CaptureCardData[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Record<string, CaptureCardData[]> = {};
  const groupOrder: string[] = [];

  for (const capture of captures) {
    const date = new Date(capture.createdAt);
    const captureDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    let label: string;
    if (captureDay.getTime() === today.getTime()) {
      label = "Today";
    } else if (captureDay.getTime() === yesterday.getTime()) {
      label = "Yesterday";
    } else {
      label = captureDay.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }

    if (!groups[label]) {
      groups[label] = [];
      groupOrder.push(label);
    }
    groups[label].push(capture);
  }

  return groupOrder.map((label) => ({ label, captures: groups[label] }));
}

export default function LibraryPage() {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeSearch, setActiveSearch] = useState("");
  const utils = trpc.useUtils();

  const { data: captures = [], isLoading } = trpc.capture.list.useQuery(
    undefined,
    { enabled: !activeSearch }
  );

  const { data: searchResults = [], isFetching: isSearching } =
    trpc.capture.search.useQuery(
      { query: activeSearch },
      { enabled: !!activeSearch }
    );

  const deleteCapture = trpc.capture.delete.useMutation({
    onMutate: ({ id }) => setDeletingId(id),
    onSettled: () => {
      setDeletingId(null);
      utils.capture.list.invalidate();
    },
  });

  const handleSearch = useCallback((query: string) => {
    setActiveSearch(query);
  }, []);

  const displayCaptures = activeSearch ? searchResults : captures;
  const groups = activeSearch
    ? [{ label: "Results", captures: displayCaptures }]
    : groupCapturesByDate(displayCaptures);

  return (
    <>
      {/* Search gateway */}
      <SearchGateway onSearch={handleSearch} />

      {/* Toolbar */}
      <div className="flex items-center justify-between px-10 pt-2">
        <p className="font-mono text-[11px] font-light text-ink-whisper">
          {activeSearch
            ? `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""}`
            : `${captures.length} capture${captures.length !== 1 ? "s" : ""}`}
        </p>
        <UploadCaptureButton />
      </div>

      {/* Loading state */}
      {isLoading && !activeSearch && (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-whisper border-t-orange" />
        </div>
      )}

      {/* Searching state */}
      {isSearching && (
        <div className="flex items-center justify-center py-20">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-ink-whisper border-t-orange" />
          <span className="ml-2 text-sm text-ink-quiet">Searching...</span>
        </div>
      )}

      {/* Library grid */}
      {!isLoading && !isSearching && (
        <div className="flex-1 overflow-y-auto px-10 pt-3 pb-10 scrollbar-thin">
          <CaptureGrid
            groups={groups}
            onDelete={(id) => deleteCapture.mutate({ id })}
            deletingId={deletingId}
          />
        </div>
      )}
    </>
  );
}
