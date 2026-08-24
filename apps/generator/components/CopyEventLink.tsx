"use client";

import { useState } from "react";
import { useLocale } from "../lib/i18n/useLocale";

/** Copies the event's public /event/<slug> link; the one way that URL is handed out. */
export function CopyEventLink({ slug }: { slug: string }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);

  async function copy(): Promise<void> {
    const url = `${window.location.origin}/event/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      window.prompt(t.organiser.copyLink, url);
    }
  }

  return (
    <button type="button" className="button button--quiet button--small" onClick={copy}>
      {copied ? t.organiser.copied : t.organiser.copyLink}
    </button>
  );
}
