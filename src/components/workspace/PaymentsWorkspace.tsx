import { t } from '../../language';

import { useState } from 'react';
import { useWorkspaceResource } from '../../hooks/useWorkspaceResource';
import type { EventSummary } from '../../types';
import { Alerts } from '../common/Alerts';

type Payment = { id: number; amount_cents: number; paid_at: string | null; user: { name: string } | null };
type PaymentBudget = { budget_cents: number; rate_cents: number; eligibility: 'present' | 'confirmed' };
type PaymentResponse = { budget: PaymentBudget | null; payments: Payment[] };
type PaymentsWorkspaceProps = {
  token: string;
  events: EventSummary[];
  canManage: boolean;
  formatDateTime: (date: string) => string;
};

const euros = new Intl.NumberFormat(document.documentElement.lang, { style: 'currency', currency: 'EUR' });

function EventPayments({ token, event, canManage, formatDateTime }: Omit<PaymentsWorkspaceProps, 'events'> & { event: EventSummary }) {
  const path = `/events/${event.id}/payments`;
  const { data, loading, saving, error, save } = useWorkspaceResource<PaymentResponse>(path, token);

  return (
    <>
      <Alerts error={error} success={null} />
      {loading ? <p role="status">{t("A carregar pagamentos...", "Loading payments…")}</p> : null}
      {canManage && data ? (
        <article className="workspace-card">
          <form className="form" onSubmit={(submitEvent) => {
            submitEvent.preventDefault();
            const values = new FormData(submitEvent.currentTarget);
            if (window.confirm(t("Calcular os valores pendentes segundo este orçamento e regra?", "Calculate pending payments using this budget and rule?"))) {
              void save(path, 'PUT', {
                budget_cents: Math.round(Number(values.get('budget')) * 100),
                rate_cents: Math.round(Number(values.get('rate')) * 100),
                eligibility: values.get('eligibility'),
              });
            }
          }}>
            <h3>{t("Orçamento e cálculo", "Budget and calculation")}</h3>
            <label>{t("Orçamento total em euros", "Total budget in euros")}<input name="budget" type="number" min="0.01" max="999999.99" step="0.01" defaultValue={data.budget ? data.budget.budget_cents / 100 : ''} required /></label>
            <label>{t("Valor por músico em euros", "Amount per musician in euros")}<input name="rate" type="number" min="0.01" max="999999.99" step="0.01" defaultValue={data.budget ? data.budget.rate_cents / 100 : ''} required /></label>
            <label>{t("Músicos elegíveis", "Eligible musicians")}
              <select name="eligibility" defaultValue={data.budget?.eligibility ?? 'present'}>
                <option value="present">{t("Com presença registada", "Marked as present")}</option>
                <option value="confirmed">{t("Com presença confirmada na convocatória", "Who confirmed their attendance")}</option>
              </select>
            </label>
            <button type="submit" disabled={saving || loading}>{t("Calcular pagamentos", "Calculate payments")}</button>
          </form>
        </article>
      ) : null}
      {data ? (
        <article className="workspace-card">
          <h3>{canManage ? t("Pagamentos por músico", "Payments by musician") : t("Os meus pagamentos", "My payments")}</h3>
          {data.payments.length === 0 ? <p className="muted">{t("Sem pagamentos registados.", "No payments recorded.")}</p> : (
            <>
              {canManage ? <p>{t("Total calculado", "Calculated total")} {euros.format(data.payments.reduce((total, row) => total + row.amount_cents, 0) / 100)}</p> : null}
              <div className="table-wrapper entity-table-wrapper">
                <table className="entity-table">
                  <thead><tr><th>{t("Músico", "Musician")}</th><th>{t("Valor", "Amount")}</th><th>{t("Estado", t("Status", "Status"))}</th>{canManage ? <th>{t("Ação", "Action")}</th> : null}</tr></thead>
                  <tbody>
                    {data.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.user?.name ?? '—'}</td>
                        <td>{euros.format(payment.amount_cents / 100)}</td>
                        <td>{payment.paid_at ? `Pago em ${formatDateTime(payment.paid_at)}` : t("Pendente", "Pending")}</td>
                        {canManage ? <td>{!payment.paid_at ? (
                          <button type="button" className="tiny" disabled={saving || loading} onClick={() => {
                            if (window.confirm(t("Confirmas que já efetuaste o pagamento fora da plataforma?", "Confirm that you have already paid the musician?"))) {
                              void save(`${path}/${payment.id}/paid`, 'PATCH');
                            }
                          }}>{t("Marcar como pago", "Mark as paid")}</button>
                        ) : '—'}</td> : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </article>
      ) : null}
    </>
  );
}

export function PaymentsWorkspace({ token, events, canManage, formatDateTime }: PaymentsWorkspaceProps) {
  const [eventId, setEventId] = useState<number | null>(null);
  const event = events.find((entry) => entry.id === eventId) ?? events[0];

  return (
    <section className="workspace-panel admin-panel">
      <header className="workspace-head admin-head"><h2>{t("Pagamentos a músicos", "Musician payments")}</h2></header>
      {event ? (
        <>
          <article className="workspace-card form">
            <label>{t("Evento", "Event")}
              <select value={event.id} onChange={(selection) => setEventId(Number(selection.target.value))}>
                {events.map((entry) => <option value={entry.id} key={entry.id}>{entry.title} · {formatDateTime(entry.starts_at)}</option>)}
              </select>
            </label>
          </article>
          <EventPayments key={event.id} token={token} event={event} canManage={canManage} formatDateTime={formatDateTime} />
        </>
      ) : <p className="workspace-card">{t("Ainda não há eventos nesta banda.", "There are no events for this ensemble yet.")}</p>}
    </section>
  );
}
