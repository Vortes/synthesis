"use client";

import { ImageIcon } from "lucide-react";
import { CaptureCard, type CaptureCardData } from "./capture-card";

export interface CaptureGroup {
  label: string;
  captures: CaptureCardData[];
}

interface CaptureGridProps {
  groups: CaptureGroup[];
  onDelete?: (id: string) => void;
  onBookmark?: (id: string) => void;
  deletingId?: string | null;
}

export function CaptureGrid({ groups, onDelete, onBookmark, deletingId }: CaptureGridProps) {
  const totalCaptures = groups.reduce((sum, g) => sum + g.captures.length, 0);

  if (totalCaptures === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-ink-quiet">
        <ImageIcon className="h-10 w-10" />
        <p className="text-sm">No captures yet</p>
      </div>
    );
  }

  return (
    <div>
      {groups.map((group, groupIndex) => (
        <div key={group.label} className="mb-8">
          <div className="font-mono text-[11px] font-light tracking-[0.06em] text-ink-whisper mb-3.5">
            {group.label}
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
            {group.captures.map((capture, cardIndex) => (
              <CaptureCard
                key={capture.id}
                capture={capture}
                onDelete={onDelete}
                onBookmark={onBookmark}
                isDeleting={deletingId === capture.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${cardIndex * 40 + groupIndex * 200}ms` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
