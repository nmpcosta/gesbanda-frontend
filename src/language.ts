
const query = new URLSearchParams(window.location.search);

export const language = query.get('lang') === 'en' ? 'en' : 'pt';
export const locale = language === 'en' ? 'en-GB' : 'pt-PT';

export function t(portuguese: string, english: string): string {
  return language === 'en' ? english : portuguese;
}

export function languageUrl(nextLanguage: 'pt' | 'en'): string {
  const next = new URL(window.location.href);
  next.searchParams.set('lang', nextLanguage);
  return next.href;
}
