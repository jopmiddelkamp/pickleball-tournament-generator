"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "../lib/i18n/useLocale";
import { LanguageSelect } from "./LanguageSelect";

function BurgerIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M2 4.5h14M2 9h14M2 13.5h14" />
    </svg>
  );
}

export function OrganiserHeader({ logoutAction }: { logoutAction: () => Promise<void> }) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  return (
    <header
      className="app__header app__header--menu"
      onKeyDown={(e) => {
        if (e.key === "Escape") setOpen(false);
      }}
    >
      <Link href="/organiser/event" className="app__title">
        {t.title[0]} <span>{t.title[1]}</span>
      </Link>
      <div className="app__side">
        <LanguageSelect />
        <button type="button" className="chip" aria-label={t.menu} aria-expanded={open} onClick={() => setOpen(!open)}>
          <BurgerIcon />
        </button>
      </div>
      {open ? (
        <>
          <button type="button" className="menu__backdrop" aria-label={t.dismiss} onClick={() => setOpen(false)} />
          <nav className="menu">
            <Link href="/organiser/event" className="menu__item" onClick={() => setOpen(false)}>
              {t.organiser.heading}
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="menu__item menu__item--full">
                {t.auth.logout}
              </button>
            </form>
          </nav>
        </>
      ) : null}
    </header>
  );
}
