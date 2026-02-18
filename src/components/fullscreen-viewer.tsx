"use client";

import { useRef, useEffect } from "react";
import { X } from "lucide-react";

interface FullscreenViewerProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
}

export function FullscreenViewer({
  imageUrl,
  isOpen,
  onClose,
}: FullscreenViewerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Sync React isOpen state with native dialog open/close
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Listen for native close event (Escape key) to sync React state
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => onClose();
    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, [onClose]);

  // Close when clicking backdrop (dialog element itself, not children)
  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClick={handleBackdropClick}
      className="fullscreen-dialog fixed inset-0 m-0 h-screen w-screen max-h-none max-w-none bg-transparent p-0"
    >
      <div className="flex h-full w-full items-center justify-center p-4 sm:p-8">
        <button
          onClick={() => dialogRef.current?.close()}
          className="absolute top-4 right-4 z-10 rounded-full p-2 text-white/80 transition-opacity hover:text-white"
          aria-label="Close fullscreen view"
        >
          <X size={28} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt="Generated image fullscreen"
          className="max-h-full max-w-full object-contain"
        />
      </div>
    </dialog>
  );
}
