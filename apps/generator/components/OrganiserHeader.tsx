"use client";

import Link from "next/link";
import { useLocale } from "../lib/i18n/useLocale";
import { LanguageSelect } from "./LanguageSelect";

export function OrganiserHeader({ logoutAction }: { logoutAction: () => Promise<void> }) {
  const { t } = useLocale();
  return (
    <header className="app__header">
      <Link href="/organiser" className="app__title">
        {t.title[0]} <span>{t.title[1]}</span>
      </Link>
      <div className="app__side">
        <LanguageSelect className="app__language" />
        <form action={logoutAction}>
          <button type="submit" className="button button--quiet button--small">{t.auth.logout}</button>
        </form>
      </div>
    </header>
  );
}
