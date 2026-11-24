import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { language } from './language';
import './reserved.css';

const query = new URLSearchParams(window.location.search);
const isApp = query.get('app') === '1';
document.documentElement.lang = language === 'en' ? 'en' : 'pt-PT';

async function start() {
  const root = createRoot(document.getElementById('root')!);
  if (isApp) {
    const { default: App } = await import('./App');
    root.render(<StrictMode><App /></StrictMode>);
  } else if (query.get('band')) {
    const { PublicDirectory } = await import('./PublicDirectory');
    root.render(<StrictMode><main className="public-wrap public-section"><PublicDirectory language={language} slug={query.get('band')!} /></main></StrictMode>);
  } else if (/^[1-9]\d*$/.test(query.get('society-event') ?? '')) {
    const { PublicSocietyEvents } = await import('./PublicSocietyEvents');
    root.render(<StrictMode><main className="public-wrap public-section"><PublicSocietyEvents eventId={Number(query.get('society-event'))} /></main></StrictMode>);
  } else {
    const { InstitutionalSite } = await import('./InstitutionalSite');
    root.render(<StrictMode><InstitutionalSite language={language} legal={query.get('legal')} /></StrictMode>);
  }
}

void start();
