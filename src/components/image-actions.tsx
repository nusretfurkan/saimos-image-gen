"use client";

import { useState, useEffect } from "react";
import { Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import {
  downloadImage,
  copyImageToClipboard,
  isClipboardImageSupported,
} from "@/lib/image-utils";

interface ImageActionsProps {
  imageUrl: string;
}

export function ImageActions({ imageUrl }: ImageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [clipboardSupported, setClipboardSupported] = useState(false);

  // Check clipboard support on mount (SSR-safe)
  useEffect(() => {
    setClipboardSupported(isClipboardImageSupported());
  }, []);

  const handleDownload = () => {
    downloadImage(imageUrl);
    toast.success("Download started");
  };

  const handleCopy = async () => {
    const success = await copyImageToClipboard(imageUrl);
    if (success) {
      toast.success("Copied to clipboard");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error("Failed to copy image");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDownload}
        className="inline-flex items-center gap-2 rounded-md bg-sage-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sage-600 active:bg-sage-700"
      >
        <Download size={16} />
        Download
      </button>

      {clipboardSupported && (
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-2 rounded-md border border-sage-200 bg-cream-100 px-4 py-2.5 text-sm font-medium text-ink-900 transition-colors hover:bg-cream-200 active:bg-sage-100"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied" : "Copy"}
        </button>
      )}
    </div>
  );
}
