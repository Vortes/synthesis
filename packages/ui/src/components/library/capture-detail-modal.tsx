"use client";

import { useState } from "react";
import { Trash2, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import type { CaptureCardData } from "./capture-card";

interface CaptureDetailModalProps {
  capture: CaptureCardData | null; // null = modal closed
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function CaptureDetailModal({
  capture,
  onClose,
  onDelete,
}: CaptureDetailModalProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const truncateUrl = (url: string, maxLength = 48) => {
    if (url.length <= maxLength) return url;
    return url.slice(0, maxLength) + "\u2026";
  };

  const formattedDate = capture
    ? new Date(capture.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const hasSource = capture && (capture.sourceApp || capture.sourceUrl);
  const hasTags = capture && capture.tags && capture.tags.length > 0;

  const handleClose = () => {
    setConfirmingDelete(false);
    onClose();
  };

  return (
    <Dialog
      open={capture !== null}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent
        className="max-w-5xl w-[95vw] p-0 overflow-hidden rounded-xl bg-surface"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">Capture detail</DialogTitle>

        {capture && (
          <div className="flex flex-row">
            {/* Left panel — image */}
            <div className="w-[60%] bg-dark-bg flex items-center justify-center p-6 min-h-[50vh] animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
              <img
                src={capture.imageUrl}
                alt="UI capture"
                className="max-h-[80vh] max-w-full object-contain rounded-lg"
              />
            </div>

            {/* Right panel — metadata */}
            <div className="w-[40%] p-8 flex flex-col overflow-y-auto max-h-[90vh] animate-fade-in-up" style={{ animationDelay: "0.12s" }}>
              {/* Source section */}
              {hasSource && (
                <div className="mb-6">
                  <p className="font-mono text-[11px] font-light tracking-[0.06em] text-ink-whisper mb-1.5">
                    SOURCE
                  </p>
                  {capture.sourceApp && (
                    <p className="text-sm text-ink-mid font-light">
                      {capture.sourceApp}
                    </p>
                  )}
                  {capture.sourceUrl && (
                    <a
                      href={capture.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-ink-mid hover:text-ink truncate block transition-colors duration-200"
                    >
                      {truncateUrl(capture.sourceUrl)}
                      <ExternalLink className="inline w-3 h-3 ml-1 opacity-50" />
                    </a>
                  )}
                </div>
              )}

              {/* Tags section */}
              {hasTags && (
                <div className="mb-6">
                  <p className="font-mono text-[11px] font-light tracking-[0.06em] text-ink-whisper mb-1.5">
                    TAGS
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {capture.tags!.map((tag) => (
                      <span
                        key={tag}
                        className="font-mono text-[11.5px] tracking-[0.04em] px-3.5 py-1.5 rounded-full border border-edge text-ink-quiet bg-transparent"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Captured date section */}
              <div className="mb-6">
                <p className="font-mono text-[11px] font-light tracking-[0.06em] text-ink-whisper mb-1.5">
                  CAPTURED
                </p>
                <p className="text-sm text-ink-mid font-light">
                  {formattedDate}
                </p>
              </div>

              {/* Delete — inline confirmation */}
              {onDelete && (
                <div className="mt-auto pt-6">
                  {!confirmingDelete ? (
                    <button
                      onClick={() => setConfirmingDelete(true)}
                      className="flex items-center gap-2 font-mono text-[11.5px] tracking-[0.04em] text-ink-quiet hover:text-ink cursor-pointer transition-colors duration-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete capture
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <p className="font-mono text-[11px] font-light tracking-[0.06em] text-ink-whisper">
                        This will permanently delete the capture and its image.
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            onDelete(capture.id);
                            handleClose();
                          }}
                          className="font-mono text-[11.5px] tracking-[0.04em] px-3.5 py-1.5 rounded-full border border-edge text-ink-quiet bg-transparent cursor-pointer transition-all duration-200 hover:text-ink hover:border-shadow-dark hover:bg-black/[0.02]"
                        >
                          Confirm delete
                        </button>
                        <button
                          onClick={() => setConfirmingDelete(false)}
                          className="font-mono text-[11.5px] tracking-[0.04em] text-ink-quiet hover:text-ink cursor-pointer transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
