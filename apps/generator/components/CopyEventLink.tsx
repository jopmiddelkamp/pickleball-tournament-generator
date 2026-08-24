"use client";

import { useLocale } from "../lib/i18n/useLocale";
import { CopyButton } from "./CopyButton";

/** Copies a ready-to-paste group-chat invite carrying the public /event/<slug> link. */
export function CopyEventLink({ slug, name, startsAt, location }: { slug: string; name: string; startsAt: string; location: string | null }) {
  const { t, locale } = useLocale();
  return (
    <CopyButton
      label={t.organiser.copyLink}
      copiedLabel={t.organiser.copied}
      buildText={() => {
        const when = new Date(startsAt).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
        const invite = t.organiser.inviteMessage(name, when, `${window.location.origin}/event/${slug}`);
        return location ? `${invite}\n\u{1F4CD} ${location}` : invite;
      }}
    />
  );
}
