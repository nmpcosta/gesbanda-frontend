
import { useState } from 'react';
import { useWorkspaceResource } from './hooks/useWorkspaceResource';
import type { Paginated } from './types/licensing.types';
import { Alerts } from './components/common/Alerts';
import { Pagination } from './components/common/Pagination';

type Profile = { name: string; slug: string; location: string | null; group_type: string; description?: string | null };
type ProfileDetails = {
  group: Profile;
  events: { title: string; starts_at: string; location: string | null }[];
  vacancies: { id: number; title: string; instrument: string; location: string; description: string }[];
};

const names = {
  pt: { band: 'Banda', choir: 'Coro', orchestra: 'Orquestra', ensemble: 'Ensemble', other: 'Outro' },
  en: { band: 'Band', choir: 'Choir', orchestra: 'Orchestra', ensemble: 'Ensemble', other: 'Other' },
};

export function PublicDirectory({ language, slug }: { language: 'pt' | 'en'; slug?: string }) {
  const [page, setPage] = useState(1);
  const [location, setLocation] = useState('');
  const [groupType, setGroupType] = useState('');
  const [filters, setFilters] = useState({ location: '', group_type: '' });
  const query = new URLSearchParams({ ...filters, page: String(page) });
  const { data, error, loading } = useWorkspaceResource<Paginated<Profile> | ProfileDetails>(
    slug ? `/public/groups/${encodeURIComponent(slug)}` : `/public/groups?${query}`, ''
  );
  const en = language === 'en';
  const types: Record<string, string> = names[language];

  return (
    <section className="workspace-panel admin-panel">
      <header className="workspace-head admin-head">
        <h2>{data && 'group' in data ? data.group.name : en ? 'Find an ensemble' : 'Encontrar formações'}</h2>
        {slug ? <a href={`?lang=${language}`}>GesBanda</a> : null}
      </header>
      <Alerts error={error} success={null} />
      {loading ? <p role="status">{en ? 'Loading…' : 'A carregar…'}</p> : null}
      {!slug ? (
        <form className="workspace-card form" onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setFilters({ location, group_type: groupType });
        }}>
          <label>{en ? 'Location' : 'Localidade'}<input value={location} onChange={(event) => setLocation(event.target.value)} maxLength={160} /></label>
          <label>{en ? 'Ensemble type' : 'Tipo de formação'}
            <select value={groupType} onChange={(event) => setGroupType(event.target.value)}>
              <option value="">{en ? 'All' : 'Todos'}</option>
              {Object.entries(types).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <button type="submit">{en ? 'Search' : 'Pesquisar'}</button>
        </form>
      ) : null}
      {data && 'group' in data ? (
        <>
          <article className="workspace-card detail-list">
            <p>{types[data.group.group_type]} {data.group.location ? `· ${data.group.location}` : ''}</p>
            {data.group.description ? <p style={{ whiteSpace: 'pre-wrap' }}>{data.group.description}</p> : null}
          </article>
          <article className="workspace-card detail-list">
            <h3>{en ? 'Upcoming events' : 'Próximas atuações'}</h3>
            {data.events.map((event) => (
              <p key={`${event.title}-${event.starts_at}`}><strong>{event.title}</strong> · {new Date(event.starts_at).toLocaleString(en ? 'en-GB' : 'pt-PT')}{event.location ? ` · ${event.location}` : ''}</p>
            ))}
            {!data.events.length ? <p>{en ? 'No public events are scheduled.' : 'Sem eventos públicos agendados.'}</p> : null}
          </article>
          <article className="workspace-card detail-list">
            <h3>{en ? 'Vacancies' : 'Vagas'}</h3>
            {data.vacancies.map((vacancy) => <div key={vacancy.id}><h4>{vacancy.title}</h4><p>{vacancy.instrument} · {vacancy.location}</p><p>{vacancy.description}</p></div>)}
            {data.vacancies.length ? <a href={`?app=1&view=vacancies&lang=${language}`}>{en ? 'Sign in to apply' : 'Entrar para enviar candidatura'}</a> : <p>{en ? 'No vacancies are open.' : 'Sem vagas abertas.'}</p>}
          </article>
        </>
      ) : null}
      {data && 'data' in data ? (
        <>
          {data.data.length ? <div className="entity-card-grid">
            {data.data.map((entry) => (
              <article className="entity-card" key={entry.slug}>
                <h3><a href={`?band=${encodeURIComponent(entry.slug)}&lang=${language}`}>{entry.name}</a></h3>
                <p>{types[entry.group_type]} {entry.location ? `· ${entry.location}` : ''}</p>
              </article>
            ))}
          </div> : <p>{en ? 'No ensembles match this search.' : 'Sem formações para esta pesquisa.'}</p>}
          <Pagination page={page} lastPage={data.last_page} onChange={setPage} />
        </>
      ) : null}
    </section>
  );
}
