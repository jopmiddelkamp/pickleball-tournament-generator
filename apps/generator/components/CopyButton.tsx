"use client";

import { useState } from "react";

/** Copies text built at click time (it may need window.location); prompt fallback when the clipboard is unavailable. */
export function CopyButton({ buildText, label, copiedLabel, className }: {
  buildText: () => string;
  label: string;
  copiedLabel: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy(): Promise<void> {
    const text = buildText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      window.prompt(label, text);
    }
  }

  return (
    <button type="button" className={className ?? "button button--quiet button--small"} onClick={copy}>
      {copied ? copiedLabel : label}
    </button>
  );
}
