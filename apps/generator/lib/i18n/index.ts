import { en, type Messages } from "./en";
import { es } from "./es";
import { ja } from "./ja";
import { ko } from "./ko";
import { vi } from "./vi";
import { zh } from "./zh";
import type { Locale } from "./locale";

export const MESSAGES: Readonly<Record<Locale, Messages>> = { en, zh, vi, ja, ko, es };

export type { Messages };
export { DEFAULT_LOCALE, LOCALES, LOCALE_NAMES, isLocale, pickLocale, type Locale } from "./locale";
