"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { CaptureGrid } from "@synthesis/ui";
import { trpc } from "@/trpc/client";
import { UploadCaptureButton } from "@/components/upload-capture-button";

export default function LibraryPage() {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
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

  const displayCaptures = activeSearch ? searchResults : captures;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery.trim());
  };

  const clearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
  };

  if (isLoading && !activeSearch) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {activeSearch
            ? `${searchResults.length} result${searchResults.length !== 1 ? "s" : ""}`
            : `${captures.length} capture${captures.length !== 1 ? "s" : ""}`}
        </p>
        <UploadCaptureButton />
      </div>

      <form onSubmit={handleSearch} className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder='Search captures... (e.g. "dark login page")'
          className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {(searchQuery || activeSearch) && (
          <button
            type="button"
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {isSearching && (
        <div className="flex items-center justify-center py-10">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
        </div>
      )}

      {!isSearching && (
        <CaptureGrid
          captures={displayCaptures}
          onDelete={(id) => deleteCapture.mutate({ id })}
          deletingId={deletingId}
        />
      )}
    </div>
  );
}
