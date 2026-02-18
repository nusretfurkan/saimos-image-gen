"use client";

import { useState, useEffect } from "react";
import { Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
      <Button onClick={handleDownload} className="gap-2">
        <Download size={16} />
        Download
      </Button>

      {clipboardSupported && (
        <Button variant="outline" onClick={handleCopy} className="gap-2">
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? "Copied" : "Copy"}
        </Button>
      )}
    </div>
  );
}
