import { useCallback, useEffect, useState } from "react";
import { SearchGateway, CaptureGrid } from "@synthesis/ui";
import type { CaptureCardData } from "@synthesis/ui";
import { Upload } from "lucide-react";
import { trpc } from "./trpc";

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

export function LibraryView() {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeSearch, setActiveSearch] = useState("");
  const utils = trpc.useUtils();

  const { data: captures = [], isLoading } = trpc.capture.list.useQuery();

  const deleteCapture = trpc.capture.delete.useMutation({
    onMutate: ({ id }) => setDeletingId(id),
    onSettled: () => {
      setDeletingId(null);
      utils.capture.list.invalidate();
    },
  });

  // Listen for capture completion from main process
  useEffect(() => {
    const cleanup = window.electronAPI.onCaptureComplete(() => {
      utils.capture.list.invalidate();
    });
    return cleanup;
  }, [utils]);

  const handleSearch = useCallback((query: string) => {
    setActiveSearch(query);
  }, []);

  const groups = activeSearch
    ? [{ label: "Results", captures }]
    : groupCapturesByDate(captures);

  return (
    <>
      {/* Search gateway */}
      <SearchGateway onSearch={handleSearch} />

      {/* Toolbar */}
      <div className="flex items-center justify-between px-10 pt-2">
        <p className="font-mono text-[11px] font-light text-ink-whisper">
          {captures.length} capture{captures.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-ink-whisper border-t-orange" />
        </div>
      )}

      {/* Library grid */}
      {!isLoading && (
        <div className="flex-1 overflow-y-auto px-10 pt-3 pb-10 scrollbar-thin">
          <CaptureGrid
            groups={groups}
            onDelete={(id) => deleteCapture.mutate({ id })}
            deletingId={deletingId}
          />

          {captures.length === 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-surface-warm px-4 py-3 text-sm text-ink-quiet shadow-card">
              <Upload className="h-4 w-4 shrink-0" />
              <span>
                Press{" "}
                <kbd className="rounded border border-edge bg-surface-cool px-1.5 py-0.5 text-xs font-mono">
                  Cmd+Shift+S
                </kbd>{" "}
                to capture a screen region, or use the web app to upload
              </span>
            </div>
          )}
        </div>
      )}
    </>
  );
}
