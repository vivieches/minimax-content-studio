export const SUPPORTED_LOCALES = ["pt-BR", "es-ES", "en-US"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "pt-BR";
export const LOCALE_STORAGE_KEY = "open-studio-locale";
export const LEGACY_LOCALE_STORAGE_KEY = "mm-locale";

export const LOCALE_LABELS: Record<Locale, string> = {
  "pt-BR": "Português Brasil",
  "es-ES": "Español España",
  "en-US": "English",
};

export const LOCALE_SHORT_LABELS: Record<Locale, string> = {
  "pt-BR": "Português",
  "es-ES": "Español",
  "en-US": "English",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  "pt-BR": "🇧🇷",
  "es-ES": "🇪🇸",
  "en-US": "🇺🇸",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && SUPPORTED_LOCALES.includes(value as Locale);
}

export function normalizeLocale(value: unknown): Locale {
  if (isLocale(value)) return value;
  const raw = String(value ?? "").trim().toLowerCase().replace("_", "-");

  if (raw === "pt" || raw === "pt-br" || raw === "portuguese" || raw === "português") {
    return "pt-BR";
  }
  if (raw === "es" || raw === "es-es" || raw === "spanish" || raw === "español") {
    return "es-ES";
  }
  if (raw === "en" || raw === "en-us" || raw === "english") {
    return "en-US";
  }

  return DEFAULT_LOCALE;
}

export function localeToGenerationLanguage(locale: Locale): string {
  switch (locale) {
    case "pt-BR":
      return "Portuguese from Brazil (pt-BR)";
    case "es-ES":
      return "Spanish from Spain (es-ES, European Spanish, not Latin American Spanish)";
    case "en-US":
      return "English (en-US)";
  }
}

export function buildTextGenerationLocaleInstruction(locale: Locale): string {
  const language = localeToGenerationLanguage(locale);
  return [
    `Write all user-facing content in ${language}.`,
    "If the source brief is in another language, use it only as source material and answer in the selected language.",
    "Do not mix languages unless the user explicitly provides a brand name, product name, quoted phrase, URL, command, code identifier or proper noun.",
    locale === "es-ES" ? "For Spanish, always use Spanish from Spain vocabulary and phrasing." : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export function buildImageGenerationLocaleInstruction(locale: Locale, visibleText?: string): string {
  const language = localeToGenerationLanguage(locale);
  return [
    "Write this image-generation prompt in English for best provider performance.",
    `Any visible text, lettering, UI labels, captions, headline words, badges or typography inside the image must be in ${language}.`,
    visibleText
      ? `Visible text source meaning: "${visibleText}". If this text is not already in ${language}, adapt its meaning into ${language} before rendering it.`
      : "",
    "Avoid gibberish text, random letters, fake UI text, fake logos, watermarks and unreadable typography.",
  ]
    .filter(Boolean)
    .join(" ");
}

export function prependLocaleInstruction(systemPrompt: string | undefined, locale: Locale): string {
  const instruction = buildTextGenerationLocaleInstruction(locale);
  return systemPrompt ? `${instruction}\n\n${systemPrompt}` : instruction;
}
