
import { useState } from 'react';
import { useWorkspaceResource } from '../../hooks/useWorkspaceResource';
import { locale, t } from '../../language';
import type { Paginated } from '../../types/licensing.types';
import { Alerts } from '../common/Alerts';
import { Pagination } from '../common/Pagination';

type Named = { id: number; name: string };
type SocietyEvent = {
  id: number; title: string; description: string | null; location: string | null;
  starts_at: string; ends_at: string | null; capacity: number; price_cents: number;
  is_public: boolean; registration_open: boolean; groups: Named[];
  registered_seats?: number | string | null; received_cents?: number | string | null;
};
type Entry = { id: number; name: string; email: string; reference: string; quantity: number;
  price_cents: number; paid_cents: number; checked_in: number; cancelled_at: string | null };

const currency = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });
const asDate = (value: string) => new Date(value).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
function localDate(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function SocietyEntries({ token, path, onChange }: { token: string; path: string; onChange: () => void }) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { data, saving, loading, error, save } = useWorkspaceResource<Paginated<Entry>>(
    `${path}?page=${page}&search=${encodeURIComponent(search)}`, token
  );

  async function updateEntry(id: number, changes: { paid_cents?: number; checked_in?: number; cancel?: boolean }) {
    if (await save(`${path}/${id}`, 'PATCH', changes)) onChange();
  }

  return (
    <article className="workspace-card detail-list">
      <h3>{t('Inscrições e entradas', 'Registrations and admissions')}</h3>
      <Alerts error={error} success={null} />
      <form className="form" onSubmit={(event) => {
        event.preventDefault();
        setSearch(String(new FormData(event.currentTarget).get('search') ?? '').trim());
        setPage(1);
      }}>
        <label>{t('Pesquisar por nome, email ou referência', 'Search by name, email or reference')}<input name="search" maxLength={160} /></label>
        <button type="submit">{t('Pesquisar', 'Search')}</button>
      </form>
      {loading ? <p role="status">{t('A carregar inscrições…', 'Loading registrations…')}</p> : null}
      {data?.data.length === 0 ? <p>{t('Sem inscrições nesta lista.', 'No registrations in this list.')}</p> : null}
      {data?.data.map((entry) => (
        <div className="entity-card" key={entry.id}>
          <h4>{entry.name}</h4><p>{entry.reference} · {entry.email}</p>
          <p>{t(`${entry.quantity} lugares · ${currency.format(entry.price_cents * entry.quantity / 100)} a pagar`, `${entry.quantity} seats · ${currency.format(entry.price_cents * entry.quantity / 100)} due`)}</p>
          {entry.cancelled_at ? <p>{t('Inscrição cancelada', 'Registration cancelled')}</p> : (
            <form className="form" key={`${entry.id}-${entry.paid_cents}-${entry.checked_in}`} onSubmit={(event) => {
              event.preventDefault();
              const values = new FormData(event.currentTarget);
              void updateEntry(entry.id, {
                paid_cents: Math.round(Number(values.get('payment')) * 100),
                checked_in: Number(values.get('check_in')),
              });
            }}>
              <div className="stage-coordinate-inputs">
                <label>{t('Valor recebido em euros', 'Amount received in euros')}<input type="number" min={0} max={entry.price_cents * entry.quantity / 100} step="0.01" name="payment" defaultValue={entry.paid_cents / 100} required /></label>
                <label>{t('Entradas registadas', 'Admissions recorded')}<input type="number" min={0} max={entry.quantity} name="check_in" defaultValue={entry.checked_in} required /></label>
              </div>
              <div className="summary-row">
                <button type="submit" disabled={saving}>{t('Guardar registo', 'Save entry')}</button>
                {entry.checked_in < entry.quantity ? <button type="button" className="ghost" disabled={saving} onClick={() => void updateEntry(entry.id, { checked_in: entry.checked_in + 1 })}>{t('Registar uma entrada', 'Check in one attendee')}</button> : null}
                {!entry.paid_cents && !entry.checked_in ? <button type="button" className="tiny danger" disabled={saving} onClick={() => {
                  if (window.confirm(t('Cancelar esta inscrição?', 'Cancel this registration?'))) void updateEntry(entry.id, { cancel: true });
                }}>{t('Cancelar inscrição', 'Cancel registration')}</button> : null}
              </div>
            </form>
          )}
        </div>
      ))}
      {data ? <Pagination page={page} lastPage={data.last_page} onChange={setPage} /> : null}
    </article>
  );
}

export function SocietyEvents({ token, societyPath, canManage }: { token: string; societyPath: string; canManage: boolean }) {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<SocietyEvent | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const path = `${societyPath}/events`;
  const { data, loading, error, saving, save, refresh } = useWorkspaceResource<{ events: Paginated<SocietyEvent>; groups: Named[] }>(
    `${path}?page=${page}`, token
  );

  return (
    <section className="workspace-panel">
      <header className="workspace-head"><h2>{t('Eventos da sociedade', 'Society events')}</h2>
        {canManage ? <button type="button" className="workspace-primary" onClick={() => { setEditing(null); setShowForm(true); }}>{t('Novo evento', 'New event')}</button> : null}
      </header>
      <Alerts error={error} success={null} />
      {loading ? <p role="status">{t('A carregar eventos…', 'Loading events…')}</p> : null}
      {showForm && canManage ? (
        <article className="workspace-card">
          <form className="form" key={editing?.id ?? 'new'} onSubmit={async (event) => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            if (await save(editing ? `${path}/${editing.id}` : path, editing ? 'PUT' : 'POST', {
              title: values.get('title'), description: values.get('description'), location: values.get('location'),
              starts_at: new Date(String(values.get('starts_at'))).toISOString(),
              ends_at: values.get('ends_at') ? new Date(String(values.get('ends_at'))).toISOString() : null,
              capacity: Number(values.get('capacity')), price_cents: Math.round(Number(values.get('price')) * 100),
              is_public: values.has('is_public'), registration_open: values.has('registration_open'),
              group_ids: values.getAll('groups').map(Number),
            })) setShowForm(false);
          }}>
            <label>{t('Título', 'Title')}<input name="title" required maxLength={180} defaultValue={editing?.title} /></label>
            <label>{t('Descrição', 'Description')}<textarea name="description" maxLength={10000} defaultValue={editing?.description ?? ''} /></label>
            <label>{t('Localização', 'Venue')}<input name="location" maxLength={255} defaultValue={editing?.location ?? ''} /></label>
            <label>{t('Início', 'Start')}<input type="datetime-local" name="starts_at" required defaultValue={localDate(editing?.starts_at)} /></label>
            <label>{t('Fim', 'End')}<input type="datetime-local" name="ends_at" defaultValue={localDate(editing?.ends_at)} /></label>
            <div className="stage-coordinate-inputs">
              <label>{t('Lotação', 'Capacity')}<input type="number" name="capacity" min={1} max={100000} defaultValue={editing?.capacity ?? 100} required /></label>
              <label>{t('Preço por lugar em euros', 'Price per seat in euros')}<input type="number" name="price" min={0} max={9999.99} step="0.01" defaultValue={(editing?.price_cents ?? 0) / 100} required /></label>
            </div>
            <fieldset>
              <legend>{t('Bandas participantes', 'Participating ensembles')}</legend>
              {data?.groups.length ? data.groups.map((group) => (
                <label className="checkbox-row" key={group.id}><input type="checkbox" name="groups" value={group.id} defaultChecked={editing?.groups.some((entry) => entry.id === group.id)} />{group.name}</label>
              )) : <p>{t('Liga primeiro as bandas no separador Formações.', 'First link the ensembles on the Ensembles tab.')}</p>}
            </fieldset>
            <label className="checkbox-row"><input type="checkbox" name="is_public" defaultChecked={editing?.is_public} />{t('Publicar no site', 'Publish on the website')}</label>
            <label className="checkbox-row"><input type="checkbox" name="registration_open" defaultChecked={editing?.registration_open} />{t('Abrir inscrições ao público', 'Open public registration')}</label>
            <div className="summary-row"><button type="submit" disabled={saving}>{t('Guardar evento', 'Save event')}</button>
              <button type="button" className="ghost" onClick={() => setShowForm(false)}>{t('Cancelar', 'Cancel')}</button></div>
          </form>
        </article>
      ) : null}
      {data?.events.data.length === 0 ? <p className="workspace-card">{t('Ainda não há eventos registados.', 'There are no events yet.')}</p> : null}
      {data?.events.data.map((event) => (
        <article className="workspace-card detail-list" key={event.id}>
          <div className="listing-head">
            <div><h3>{event.title}</h3><p>{asDate(event.starts_at)}{event.location ? ` · ${event.location}` : ''}</p></div>
            {canManage ? <button type="button" className="ghost tiny" onClick={() => { setEditing(event); setShowForm(true); }}>{t('Editar evento', 'Edit event')}</button> : null}
          </div>
          {event.description ? <p>{event.description}</p> : null}
          {event.groups.length ? <p>{event.groups.map((group) => group.name).join(' · ')}</p> : null}
          <p>{t(`${event.registered_seats ?? 0} de ${event.capacity} lugares reservados`, `${event.registered_seats ?? 0} of ${event.capacity} seats reserved`)}{canManage ? ` · ${currency.format(Number(event.received_cents ?? 0) / 100)}` : ''}</p>
          {event.is_public ? <a href={`?society-event=${event.id}&lang=${locale === 'en-GB' ? 'en' : 'pt'}`} target="_blank" rel="noreferrer">{t('Ver página pública', 'View public page')}</a> : null}
          {canManage ? <div className="summary-row"><button type="button" className="workspace-primary" onClick={() => setSelected(selected === event.id ? null : event.id)}>{t('Gerir inscrições e entradas', 'Manage registrations and admissions')}</button></div> : null}
          {canManage && selected === event.id ? <SocietyEntries token={token} path={`${path}/${event.id}/registrations`} onChange={refresh} /> : null}
        </article>
      ))}
      {data ? <Pagination page={page} lastPage={data.events.last_page} onChange={setPage} /> : null}
    </section>
  );
}
