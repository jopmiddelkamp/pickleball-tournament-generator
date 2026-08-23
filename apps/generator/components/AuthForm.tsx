"use client";

import Link from "next/link";
import { useActionState } from "react";
import { INITIAL_AUTH_STATE, type AuthFormState } from "../lib/actions/authState";
import { LIMITS } from "../lib/config";
import { useLocale } from "../lib/i18n/useLocale";
import { LanguageSelect } from "./LanguageSelect";
import { Notice } from "./ui";

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "sign-up";
  action: (prev: AuthFormState, formData: FormData) => Promise<AuthFormState>;
}) {
  const { t } = useLocale();
  const [state, formAction, pending] = useActionState(action, INITIAL_AUTH_STATE);

  return (
    <main className="app">
      <header className="app__header">
        <h1 className="app__title">
          {t.title[0]} <span>{t.title[1]}</span>
        </h1>
        <LanguageSelect className="app__language" />
      </header>
      <div className="app__main">
        <h2 className="screen__heading">{mode === "login" ? t.auth.loginHeading : t.auth.signUpHeading}</h2>
        <p className="screen__lede">{t.auth.lede}</p>
        {state.error ? <Notice tone="warn">{t.auth.errors[state.error]}</Notice> : null}
        {state.confirmEmail ? <Notice>{t.auth.confirmEmail}</Notice> : null}
        <form className="card stack" action={formAction}>
          <div>
            <label className="label" htmlFor="email">{t.auth.email}</label>
            <input id="email" name="email" className="input" type="email" autoComplete="email" required />
          </div>
          <div>
            <label className="label" htmlFor="password">{t.auth.password}</label>
            <input
              id="password"
              name="password"
              className="input"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={LIMITS.minPassword}
              maxLength={LIMITS.maxPassword}
              required
            />
            {mode === "sign-up" ? <p className="standings__detail">{t.auth.passwordHint(LIMITS.minPassword)}</p> : null}
          </div>
          <button type="submit" className="button button--accent button--full" disabled={pending}>
            {mode === "login" ? t.auth.login : t.auth.signUp}
          </button>
        </form>
        <p className="standings__detail" style={{ marginTop: 16 }}>
          <Link href={mode === "login" ? "/organiser/sign-up" : "/organiser/login"}>
            {mode === "login" ? t.auth.toSignUp : t.auth.toLogin}
          </Link>
        </p>
      </div>
    </main>
  );
}
