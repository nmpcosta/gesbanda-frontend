import { t } from '../../language';

import { useState } from 'react';
import { useWorkspaceResource } from '../../hooks/useWorkspaceResource';
import type { EventSummary, GroupSummary } from '../../types';
import type { Paginated } from '../../types/licensing.types';
import { Alerts } from '../common/Alerts';
import { Pagination } from '../common/Pagination';

type ApplicationStatus = 'pending' | 'accepted' | 'rejected';
type Application = {
  id: number;
  message: string;
  status: ApplicationStatus;
  user: { name: string; email: string } | null;
  title?: string;
  group_name?: string;
};
type Vacancy = {
  id: number;
  title: string;
  instrument: string;
  location: string;
  description: string;
  is_open: boolean;
  event_id: number | null;
  group?: { name: string; group_type: string };
  applications?: Application[];
};
type Filters = { instrument: string; location: string; group_type: string };
type SavedAlert = Filters & { id: number; matches: number };
const initialFilters: Filters = { instrument: '', location: '', group_type: '' };
const types: Record<string, string> = { band: t("Banda", "Band"), choir: t("Coro", "Choir"), orchestra: t("Orquestra", "Orchestra"), ensemble: 'Ensemble', other: t("Outro", "Other") };
const statuses: Record<ApplicationStatus, string> = { pending: t("Pendente", "Pending"), accepted: t("Aceite", "Accepted"), rejected: t("Rejeitada", "Rejected") };

function SavedVacancyAlerts({ token, filters, onSearch }: { token: string; filters: Filters; onSearch: (filters: Filters) => void }) {
  const { data, saving, error, save } = useWorkspaceResource<{ data: SavedAlert[] }>('/vacancy-alerts', token);

  return (
    <article className="workspace-card detail-list">
      <h3>{t("Alertas de vagas", "Vacancy alerts")}</h3>
      <Alerts error={error} success={null} />
      <button type="button" className="ghost" disabled={saving || !Object.values(filters).some(Boolean)}
        onClick={() => save('/vacancy-alerts', 'POST', filters)}>{t("Guardar alerta para esta pesquisa", "Save an alert for this search")}</button>
      {data?.data.map((alert) => {
        const label = [alert.instrument, alert.location, types[alert.group_type]].filter(Boolean).join(' · ');

        return (
          <div className="summary-row" key={alert.id}>
            <button type="button" className="tiny ghost" onClick={() => onSearch({
              instrument: alert.instrument ?? '', location: alert.location ?? '', group_type: alert.group_type ?? '',
            })}>{label} · {alert.matches} {t("novas", "new")}</button>
            <button type="button" className="tiny danger" disabled={saving} onClick={() => save(`/vacancy-alerts/${alert.id}`, 'DELETE')}>{t("Remover", "Remove")}</button>
          </div>
        );
      })}
    </article>
  );
}

function MyApplications({ token }: { token: string }) {
  const [page, setPage] = useState(1);
  const { data, error, loading } = useWorkspaceResource<Paginated<Application>>(`/vacancy-applications?page=${page}`, token);

  return (
    <article className="workspace-card detail-list">
      <h3>{t("As minhas candidaturas", "My applications")}</h3>
      <Alerts error={error} success={null} />
      {loading ? <p role="status">{t("A carregar candidaturas...", "Loading applications…")}</p> : null}
      {data?.data.length === 0 ? <p>{t("Ainda não enviaste candidaturas.", "You have not submitted any applications yet.")}</p> : null}
      {data?.data.map((application) => <p key={application.id}><strong>{application.title}</strong> · {application.group_name} · {statuses[application.status]}</p>)}
      {data ? <Pagination page={page} lastPage={data.last_page} onChange={setPage} /> : null}
    </article>
  );
}

export function VacanciesWorkspace({ token = '' }: { token?: string }) {
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [search, setSearch] = useState<Filters>(initialFilters);
  const [page, setPage] = useState(1);
  const [applying, setApplying] = useState<number | null>(null);
  const [applicationsVersion, setApplicationsVersion] = useState(0);
  const params = new URLSearchParams({ ...search, page: String(page) });
  const { data, loading, saving, error, save } = useWorkspaceResource<Paginated<Vacancy>>(`/vacancies?${params}`, token);

  function searchWith(values: Filters) {
    setFilters(values);
    setSearch(values);
    setPage(1);
    setApplying(null);
  }

  return (
    <section className="workspace-panel admin-panel">
      <header className="workspace-head admin-head"><h2>{t("Bolsa de músicos", "Musician vacancies")}</h2></header>
      <article className="workspace-card">
        <form className="form" onSubmit={(event) => { event.preventDefault(); searchWith(filters); }}>
          <label>{t("Instrumento ou voz", "Instrument or voice")}<input value={filters.instrument} onChange={(event) => setFilters({ ...filters, instrument: event.target.value })} maxLength={120} /></label>
          <label>{t("Localidade", "Location")}<input value={filters.location} onChange={(event) => setFilters({ ...filters, location: event.target.value })} maxLength={160} /></label>
          <label>{t("Tipo de formação", "Ensemble type")}
            <select value={filters.group_type} onChange={(event) => setFilters({ ...filters, group_type: event.target.value })}>
              <option value="">{t("Todos", "All")}</option>
              {Object.entries(types).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <button type="submit">{t("Pesquisar vagas", "Search vacancies")}</button>
        </form>
      </article>
      {token ? <SavedVacancyAlerts token={token} filters={search} onSearch={searchWith} /> : null}
      <Alerts error={error} success={null} />
      {loading ? <p role="status">{t("A carregar vagas...", "Loading vacancies…")}</p> : null}
      {data?.data.length === 0 && !loading ? <p className="workspace-card">{t("Sem vagas para esta pesquisa.", "No vacancies match this search.")}</p> : null}
      {data?.data.map((vacancy) => (
        <article className="workspace-card detail-list" key={vacancy.id}>
          <h3>{vacancy.title}</h3>
          <p>{vacancy.group?.name} · {vacancy.instrument} · {vacancy.location}</p>
          <p style={{ whiteSpace: 'pre-wrap' }}>{vacancy.description}</p>
          {token ? (
            <button type="button" className="tiny ghost" onClick={() => setApplying(applying === vacancy.id ? null : vacancy.id)}>{t("Candidatar-me", "Apply")}</button>
          ) : <a href={`?app=1&view=vacancies&lang=${document.documentElement.lang === 'en' ? 'en' : 'pt'}`}>{t("Entrar para enviar uma candidatura", "Sign in to apply")}</a>}
          {applying === vacancy.id ? (
            <form className="form" onSubmit={async (event) => {
              event.preventDefault();
              const values = new FormData(event.currentTarget);
              if (await save(`/vacancies/${vacancy.id}/applications`, 'POST', { message: values.get('message') })) {
                setApplying(null);
                setApplicationsVersion((previous) => previous + 1);
              }
            }}>
              <label>{t("Mensagem de candidatura", "Application message")}<textarea name="message" required maxLength={5000} /></label>
              <button type="submit" disabled={saving}>{t("Enviar candidatura", "Submit application")}</button>
            </form>
          ) : null}
        </article>
      ))}
      {data ? <Pagination page={page} lastPage={data.last_page} onChange={(nextPage) => { setPage(nextPage); setApplying(null); }} /> : null}
      {token ? <MyApplications key={applicationsVersion} token={token} /> : null}
    </section>
  );
}

export function ManageVacanciesWorkspace({ token, group, events }: { token: string; group: GroupSummary; events: EventSummary[] }) {
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(false);
  const [editing, setEditing] = useState<Vacancy | null>(null);
  const path = `/groups/${group.id}/vacancies`;
  const { data, loading, error, saving, save } = useWorkspaceResource<Paginated<Vacancy>>(`${path}?page=${page}`, token);

  return (
    <section className="workspace-panel admin-panel">
      <header className="workspace-head admin-head">
        <div><h2>{t("Vagas da banda", "Ensemble vacancies")}</h2><p className="subtitle">{group.name}</p></div>
        <button type="button" onClick={() => { setEditing(null); setForm(true); }}>{t("Publicar vaga", "Post vacancy")}</button>
      </header>
      <Alerts error={error} success={null} />
      {loading ? <p role="status">{t("A carregar vagas...", "Loading vacancies…")}</p> : null}
      {form ? (
        <article className="workspace-card">
          <form className="form" key={editing?.id ?? 'new'} onSubmit={async (event) => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            if (await save(editing ? `${path}/${editing.id}` : path, editing ? 'PUT' : 'POST', {
              title: values.get('title'),
              instrument: values.get('instrument'),
              location: values.get('location'),
              description: values.get('description'),
              event_id: Number(values.get('event_id')) || null,
              is_open: values.has('is_open'),
            })) {
              setForm(false);
            }
          }}>
            <label>{t("Título", "Title")}<input name="title" defaultValue={editing?.title} required maxLength={160} /></label>
            <label>{t("Instrumento ou voz", "Instrument or voice")}<input name="instrument" defaultValue={editing?.instrument} required maxLength={120} /></label>
            <label>{t("Localidade", "Location")}<input name="location" defaultValue={editing?.location ?? group.location ?? ''} required maxLength={160} /></label>
            <label>{t("Descrição", "Description")}<textarea name="description" defaultValue={editing?.description} required maxLength={10000} /></label>
            <label>{t("Evento", "Event")}<select name="event_id" defaultValue={editing?.event_id ?? ''}>
              <option value="">{t("Vaga para a banda", "Ensemble vacancy")}</option>
              {events.map((event) => <option key={event.id} value={event.id}>{event.title}</option>)}
            </select></label>
            <label className="checkbox-row"><input type="checkbox" name="is_open" defaultChecked={editing?.is_open ?? true} />{t("Aceitar candidaturas", "Accept applications")}</label>
            <div className="summary-row"><button type="submit" disabled={saving}>{t("Guardar vaga", "Save vacancy")}</button><button type="button" className="ghost" onClick={() => setForm(false)}>{t("Cancelar", "Cancel")}</button></div>
          </form>
        </article>
      ) : null}
      {data?.data.length === 0 && !loading ? <p className="workspace-card">{t("Ainda não publicaste vagas.", "You have not published any vacancies yet.")}</p> : null}
      {data?.data.map((vacancy) => (
        <article className="workspace-card detail-list" key={vacancy.id}>
          <div className="listing-head">
            <div><h3>{vacancy.title}</h3><p>{vacancy.instrument} · {vacancy.location} · {vacancy.is_open ? t("Aberta", "Open") : t("Fechada", "Closed")}</p></div>
            <button type="button" className="tiny ghost" onClick={() => { setEditing(vacancy); setForm(true); }}>{t("Editar vaga", "Edit vacancy")}</button>
          </div>
          <h4>{t("Candidaturas", "Applications")}</h4>
          {vacancy.applications?.length ? vacancy.applications.map((application) => (
            <div key={application.id} className="detail-list">
              <p><strong>{application.user?.name}</strong> · {application.user?.email} · {statuses[application.status]}</p>
              <p style={{ whiteSpace: 'pre-wrap' }}>{application.message}</p>
              {application.status === 'pending' ? (
                <div className="summary-row">
                  {(['accepted', 'rejected'] as const).map((status) => <button className="tiny" type="button" key={status} disabled={saving} onClick={() => {
                    if (window.confirm(status === 'accepted' ? t("Selecionar este músico e fechar a vaga?", "Select this musician and close the vacancy?") : t("Rejeitar esta candidatura?", "Reject this application?"))) {
                      void save(`${path}/${vacancy.id}/applications/${application.id}`, 'PATCH', { status });
                    }
                  }}>{status === 'accepted' ? t("Aceitar", "Accept") : t("Rejeitar", "Reject")}</button>)}
                </div>
              ) : null}
            </div>
          )) : <p className="muted">{t("Sem candidaturas.", "No applications.")}</p>}
        </article>
      ))}
      {data ? <Pagination page={page} lastPage={data.last_page} onChange={setPage} /> : null}
    </section>
  );
}
