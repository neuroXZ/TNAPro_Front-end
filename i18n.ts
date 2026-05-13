import { getRequestConfig } from 'next-intl/server';

const SUPPORTED_LOCALES = ['en', 'ms'] as const;
const DEFAULT_LOCALE: (typeof SUPPORTED_LOCALES)[number] = 'en';

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = SUPPORTED_LOCALES.includes(locale as (typeof SUPPORTED_LOCALES)[number])
    ? (locale as (typeof SUPPORTED_LOCALES)[number])
    : DEFAULT_LOCALE;

  return {
    locale: resolvedLocale,
    messages: (await import(`./messages/${resolvedLocale}.json`)).default
  };
});
