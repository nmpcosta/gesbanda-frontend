
import { useState } from 'react';
import { useWorkspaceResource } from './hooks/useWorkspaceResource';
import type { Paginated } from './types/licensing.types';
import { locale, language, t } from './language';
import { legalUrl } from './LegalPages';
import { Alerts } from './components/common/Alerts';
import { Pagination } from './components/common/Pagination';
import { apiRequest } from './api';

type PublicEvent = {
  id: number; title: string; location: string | null; description?: string | null;
  starts_at: string; price_cents: number; registration_open: boolean;
  society: { name: string }; groups: { name: string }[];
};
type Confirmation = {
  data: { reference: string; quantity: number; price_cents: number };
  transfer_instructions: string | null;
};

const euros = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });
const date = (value: string) => new Date(value).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });

function EventRegistration({ eventId }: { eventId: number }) {
  const path = `/public/society-events/${eventId}`;
  const { data, loading, error } = useWorkspaceResource<{ data: PublicEvent; remaining: number }>(path, '');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  return (
    <article className="workspace-panel detail-list">
      <a href={`?lang=${language}`}>GesBanda</a>
      <Alerts error={error ?? registrationError} success={null} />
      {loading ? <p role="status">{t('A carregar evento…', 'Loading event…')}</p> : null}
      {data ? (
        <>
          <h1>{data.data.title}</h1>
          <div className="workspace-card detail-list">
            <strong>{data.data.society.name}</strong>
            <p>{date(data.data.starts_at)}{data.data.location ? ` · ${data.data.location}` : ''}</p>
            {data.data.description ? <p>{data.data.description}</p> : null}
            {data.data.groups.length ? <p>{data.data.groups.map((group) => group.name).join(' · ')}</p> : null}
            <p>{data.data.price_cents ? `${euros.format(data.data.price_cents / 100)} · ${t('por lugar', 'per seat')}` : t('Entrada gratuita', 'Free admission')}</p>
          </div>
          {confirmation ? (
            <div className="workspace-card detail-list" role="status">
              <h2>{t('Inscrição registada', 'Registration recorded')}</h2>
              <p>{t('Guarda esta referência para a entrada e, se aplicável, para o pagamento.', 'Keep this reference for admission and payment, where applicable.')}</p>
              <strong>{confirmation.data.reference}</strong>
              <p>{t(`${confirmation.data.quantity} lugares`, `${confirmation.data.quantity} seats`)} · {euros.format(confirmation.data.price_cents * confirmation.data.quantity / 100)}</p>
              {confirmation.transfer_instructions ? <p style={{ whiteSpace: 'pre-wrap' }}>{confirmation.transfer_instructions}</p>
                : confirmation.data.price_cents ? <p>{t('Consulta as indicações da sociedade sobre o pagamento.', 'Check the society’s instructions for payment.')}</p> : null}
            </div>
          ) : data.data.registration_open && data.remaining > 0 ? (
            <form className="workspace-card form" onSubmit={async (event) => {
              event.preventDefault();
              const values = new FormData(event.currentTarget);
              setSubmitting(true);
              setRegistrationError(null);
              try {
                const result = await apiRequest<Confirmation>(`${path}/registrations`, {
                  method: 'POST',
                  body: JSON.stringify({ name: values.get('name'), email: values.get('email'), quantity, price_cents: data.data.price_cents }),
                });
                setConfirmation(result);
              } catch (err) {
                setRegistrationError(err instanceof Error ? err.message : t('Não foi possível registar a inscrição.', 'Could not register for this event.'));
              } finally {
                setSubmitting(false);
              }
            }}>
              <h2>{t('Inscrição', 'Registration')}</h2>
              <label>{t('Nome', 'Name')}<input name="name" autoComplete="name" maxLength={160} required /></label>
              <label>Email<input name="email" type="email" autoComplete="email" maxLength={255} required /></label>
              <label>{t('Lugares', 'Seats')}<input type="number" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))}
                min={1} max={Math.min(100, data.remaining)} required /></label>
              <p>{t('Total', 'Total')} · <strong>{euros.format(data.data.price_cents * quantity / 100)}</strong></p>
              <p><a href={legalUrl('privacy', language)} target="_blank" rel="noreferrer">{t('Tratamento dos dados da inscrição', 'How registration data is used')}</a></p>
              <button type="submit" disabled={submitting}>{data.data.price_cents ? t('Inscrever com obrigação de pagamento', 'Register with an obligation to pay') : t('Confirmar inscrição', 'Confirm registration')}</button>
            </form>
          ) : <p className="workspace-card">{t('Inscrições fechadas ou lotação esgotada.', 'Registration is closed or the event is sold out.')}</p>}
        </>
      ) : null}
    </article>
  );
}

export function PublicSocietyEvents({ eventId }: { eventId?: number }) {
  if (eventId) {
    return <EventRegistration eventId={eventId} />;
  }

  return <SocietyEventList />;
}

function SocietyEventList() {
  const [page, setPage] = useState(1);
  const { data, error, loading } = useWorkspaceResource<Paginated<PublicEvent>>(`/public/society-events?page=${page}`, '');

  return (
    <section className="workspace-panel">
      <h1>{t('Eventos públicos', 'Public events')}</h1>
      <Alerts error={error} success={null} />
      {loading ? <p role="status">{t('A carregar eventos…', 'Loading events…')}</p> : null}
      {data?.data.length === 0 ? <p>{t('Ainda não há eventos públicos anunciados.', 'There are no upcoming public events.')}</p> : null}
      {data?.data.map((event) => (
        <article className="workspace-card detail-list" key={event.id}>
          <h2><a href={`?society-event=${event.id}&lang=${language}`}>{event.title}</a></h2>
          <p>{event.society.name} · {date(event.starts_at)}{event.location ? ` · ${event.location}` : ''}</p>
          <p>{event.price_cents ? euros.format(event.price_cents / 100) : t('Entrada gratuita', 'Free admission')}</p>
        </article>
      ))}
      {data ? <Pagination page={page} lastPage={data.last_page} onChange={setPage} /> : null}
    </section>
  );
}
