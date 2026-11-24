import { locale, t } from '../../language';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { apiRequest } from '../../api';
import type { GroupSummary } from '../../types';
import type { GroupLicense, LicensePlan, LicensePlanInput, LicenseStatus, LicensingResponse } from '../../types/licensing.types';
import { Alerts } from '../common/Alerts';
import { Pagination } from '../common/Pagination';

type LicensingWorkspaceProps = {
  token: string;
  group?: GroupSummary;
  formatDateTime: (value: string) => string;
  onLicenseChange: () => void;
};

const statuses: Record<LicenseStatus, string> = {
  pending: t("A aguardar pagamento", "Awaiting payment"),
  approved: t("Confirmada", "Confirmed"),
  rejected: t("Rejeitada", "Rejected"),
  revoked: t("Revogada", "Revoked"),
};

const reviewLabels: Record<Exclude<LicenseStatus, 'pending'>, string> = {
  approved: t("Confirmar pagamento", "Confirm payment"),
  rejected: t("Rejeitar pedido", "Reject order"),
  revoked: t("Revogar licença", "Revoke licence"),
};

const emptyPlan: LicensePlanInput = { name: '', price_cents: 0, duration_days: 365, is_active: true };
const euros = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' });

function licenseStatus(license: GroupLicense): string {
  if (license.status === 'approved') {
    if (license.expires_at && new Date(license.expires_at).getTime() <= Date.now()) {
      return t("Expirada", "Expired");
    }

    return license.starts_at && new Date(license.starts_at).getTime() > Date.now() ? t("Agendada", "Scheduled") : t("Ativa", "Active");
  }

  return statuses[license.status];
}

export function LicensingWorkspace({ token, group, formatDateTime, onLicenseChange }: LicensingWorkspaceProps) {
  const platform = !group;
  const path = group ? `/groups/${group.id}/licenses` : '/admin/licenses';
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<LicenseStatus | ''>('');
  const [version, setVersion] = useState(0);
  const [data, setData] = useState<LicensingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<LicensePlan | null>(null);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planPrice, setPlanPrice] = useState('');
  const [planForm, setPlanForm] = useState<LicensePlanInput>(emptyPlan);
  const [selectedLicense, setSelectedLicense] = useState<GroupLicense | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page) });
    if (filter) {
      params.set('status', filter);
    }

    setLoading(true);
    apiRequest<LicensingResponse>(`${path}?${params}`, { signal: controller.signal }, token)
      .then((response) => {
        if (!controller.signal.aborted) {
          setData(response);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setData(null);
          setError(err instanceof Error ? err.message : t("Não foi possível carregar o licenciamento.", "Could not load licences."));
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [path, page, filter, token, version]);

  async function save(action: () => Promise<unknown>, message: string) {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await action();
      setSuccess(message);
      setLoading(true);
      setVersion((previous) => previous + 1);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Não foi possível guardar a alteração.", "Could not save the change."));
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function requestLicense(plan: LicensePlan) {
    const price = euros.format(plan.price_cents / 100);
    if (!window.confirm(t(`Pedir a licença «${plan.name}» por ${price}?`, `Order the “${plan.name}” licence for ${price}?`))) {
      return;
    }

    await save(async () => {
      const response = await apiRequest<{ data: GroupLicense }>(path, {
        method: 'POST',
        body: JSON.stringify({ license_plan_id: plan.id, price_cents: plan.price_cents, duration_days: plan.duration_days }),
      }, token);
      setPage(1);
      setSelectedLicense(response.data);
    }, t("Pedido criado. Usa os dados abaixo para efetuar a transferência.", "Order created. Use the details below to make the transfer."));
  }

  function openPlan(plan: LicensePlan | null) {
    setEditingPlan(plan);
    setPlanForm(plan ?? emptyPlan);
    setPlanPrice(plan ? (plan.price_cents / 100).toFixed(2) : '');
    setShowPlanForm(true);
  }

  async function savePlan(event: FormEvent) {
    event.preventDefault();

    const saved = await save(
      () => apiRequest(editingPlan ? `/admin/license-plans/${editingPlan.id}` : '/admin/license-plans', {
        method: editingPlan ? 'PUT' : 'POST',
        body: JSON.stringify({ ...planForm, price_cents: Math.round(Number(planPrice) * 100) }),
      }, token),
      t("Plano guardado.", "Plan saved.")
    );

    if (saved) {
      setShowPlanForm(false);
    }
  }

  async function review(license: GroupLicense, status: Exclude<LicenseStatus, 'pending'>) {
    if (!window.confirm(`${reviewLabels[status]} ${t('para', 'for')} «${license.group_name}» (${euros.format(license.price_cents / 100)})?`)) {
      return;
    }

    const saved = await save(
      () => apiRequest(`/admin/licenses/${license.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }, token),
      t("Estado da licença atualizado.", "Licence status updated.")
    );

    if (saved) {
      setSelectedLicense(null);
      onLicenseChange();
    }
  }

  return (
    <section className="workspace-panel admin-panel">
      <header className="workspace-head admin-head">
        <div>
          <h2>{group ? `Licenças · ${group.name}` : t("Licenciamento da plataforma", "Platform licensing")}</h2>
          {group ? <p className="subtitle">{t("Plano atual:", "Current plan:")} {group.current_license?.plan_name ?? group.plan_tier}</p> : null}
        </div>
        <button type="button" className="ghost" disabled={loading || saving} onClick={() => {
          setError(null);
          setLoading(true);
          setVersion((previous) => previous + 1);
        }}>{t("Atualizar", "Refresh")}</button>
      </header>

      <Alerts error={error} success={success} />
      {loading ? <p role="status">{t("A carregar o licenciamento...", "Loading licences…")}</p> : null}

      {data ? (
        <>
          <article className="workspace-card">
            <div className="listing-head">
              <h3>{platform ? t("Planos de licença", "Licence plans") : t("Comprar licença", "Buy a licence")}</h3>
              {platform ? <button type="button" onClick={() => openPlan(null)}>{t("Novo plano", "New plan")}</button> : null}
            </div>
            {!data.payments_enabled ? <p className="muted">{t("O pagamento por transferência está indisponível.", "Bank transfer payments are unavailable.")}</p> : null}
            {group && data.has_pending_request ? <p className="muted">{t('Já existe um pedido pendente. Consulta os dados de pagamento no histórico abaixo.', 'There is already a pending order. Find the payment details in the history below.')}</p> : null}
            {group && !group.is_active ? <p className="muted">{t("Ativa a banda antes de pedir uma licença.", "Activate the ensemble before requesting a licence.")}</p> : null}
            {data.plans.length === 0 ? <p className="muted">{t("Nenhum plano disponível.", "No plans available.")}</p> : null}
            <div className="entity-card-grid">
              {data.plans.map((plan) => (
                <article className="entity-card" key={plan.id}>
                  <div>
                    <h4>{plan.name}</h4>
                    <p>{euros.format(plan.price_cents / 100)} · {plan.duration_days} {t("dias", "days")}</p>
                    {platform ? <p>{plan.is_active ? t("Disponível", "Available") : t("Indisponível", "Unavailable")}</p> : null}
                  </div>
                  {platform ? (
                    <button className="tiny" type="button" onClick={() => openPlan(plan)}>{t("Editar plano", "Edit plan")}</button>
                  ) : (
                    <button className="tiny" type="button" disabled={loading || saving || !data.payments_enabled || !group?.is_active || data.has_pending_request} onClick={() => requestLicense(plan)}>
                      {t("Pedir licença", "Request licence")}
                    </button>
                  )}
                </article>
              ))}
            </div>
            {platform && showPlanForm ? (
              <form className="form" onSubmit={savePlan}>
                <h3>{editingPlan ? t("Editar plano", "Edit plan") : t("Novo plano", "New plan")}</h3>
                <label>{t("Nome", "Name")}<input required maxLength={120} value={planForm.name} onChange={(event) => setPlanForm({ ...planForm, name: event.target.value })} /></label>
                <label>{t("Preço em euros", "Price in euros")}<input type="number" min="0.01" max="999999.99" step="0.01" required value={planPrice} onChange={(event) => setPlanPrice(event.target.value)} /></label>
                <label>{t("Duração em dias", "Duration in days")}<input type="number" min="1" max="3650" required value={planForm.duration_days || ''} onChange={(event) => setPlanForm({ ...planForm, duration_days: Number(event.target.value) })} /></label>
                <label className="checkbox-row"><input type="checkbox" checked={planForm.is_active} onChange={(event) => setPlanForm({ ...planForm, is_active: event.target.checked })} />{t("Disponível para compra", "Available to buy")}</label>
                <div className="summary-row">
                  <button type="submit" disabled={saving}>{t("Guardar plano", "Save plan")}</button>
                  <button type="button" className="ghost" onClick={() => setShowPlanForm(false)}>{t("Cancelar", "Cancel")}</button>
                </div>
              </form>
            ) : null}
          </article>

          <article className="workspace-card">
            <h3>{platform ? t("Pedidos e licenças", "Orders and licences") : t("Histórico de licenças", "Licence history")}</h3>
            {platform ? (
              <div className="form">
                <label>{t("Estado", t("Status", "Status"))}
                  <select value={filter} onChange={(event) => {
                    setFilter(event.target.value as LicenseStatus | '');
                    setPage(1);
                    setSelectedLicense(null);
                  }}>
                    <option value="">{t("Todos", "All")}</option>
                    {Object.entries(statuses).map(([status, label]) => <option key={status} value={status}>{label}</option>)}
                  </select>
                </label>
              </div>
            ) : null}
            {selectedLicense ? (
              <div className="detail-list">
                <p><strong>{t("Referência", "Reference")}</strong> {selectedLicense.reference}</p>
                <p><strong>{t("Valor", "Amount")}</strong> {euros.format(selectedLicense.price_cents / 100)}</p>
                {selectedLicense.status === 'pending' ? (
                  <>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{selectedLicense.payment_instructions}</p>
                    <p>{t("Inclui a referência no descritivo da transferência.", "Include the reference in the bank transfer description.")}</p>
                  </>
                ) : null}
                <button className="ghost" type="button" onClick={() => setSelectedLicense(null)}>{t("Fechar detalhe", "Close details")}</button>
              </div>
            ) : null}
            {data.licenses.data.length === 0 ? <p className="muted">{t("Sem licenças ou pedidos.", "No licences or orders.")}</p> : (
              <div className="table-wrapper entity-table-wrapper">
                <table className="entity-table">
                  <thead><tr>{platform ? <th>{t("Banda", "Band")}</th> : null}<th>{t("Plano", "Plan")}</th><th>{t("Valor", "Amount")}</th><th>{t("Estado", t("Status", "Status"))}</th><th>{t("Início", "Start")}</th><th>{t("Fim", "End")}</th><th>{t("Ações", "Actions")}</th></tr></thead>
                  <tbody>
                    {data.licenses.data.map((license) => (
                      <tr key={license.id}>
                        {platform ? <td>{license.group_name}</td> : null}
                        <td>{license.plan_name}</td>
                        <td>{euros.format(license.price_cents / 100)}</td>
                        <td>{licenseStatus(license)}</td>
                        <td>{license.starts_at ? formatDateTime(license.starts_at) : '—'}</td>
                        <td>{license.expires_at ? formatDateTime(license.expires_at) : '—'}</td>
                        <td className="cell-actions">
                          <button className="tiny" type="button" onClick={() => setSelectedLicense(license)}>{t("Ver detalhe", "View details")}</button>
                          {platform && license.status === 'pending' ? (
                            <>
                              <button className="tiny" type="button" disabled={loading || saving} onClick={() => review(license, 'approved')}>{t("Confirmar pagamento", "Confirm payment")}</button>
                              <button className="tiny danger" type="button" disabled={loading || saving} onClick={() => review(license, 'rejected')}>{t("Rejeitar", "Reject")}</button>
                            </>
                          ) : null}
                          {platform && license.status === 'approved' && license.expires_at && new Date(license.expires_at).getTime() > Date.now() ? (
                            <button className="tiny danger" type="button" disabled={loading || saving} onClick={() => review(license, 'revoked')}>{t("Revogar", "Revoke")}</button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={data.licenses.current_page} lastPage={data.licenses.last_page} onChange={(nextPage) => {
              setSelectedLicense(null);
              setPage(nextPage);
            }} />
          </article>
        </>
      ) : null}
    </section>
  );
}
