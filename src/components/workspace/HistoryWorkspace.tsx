import { t } from '../../language';
import { useEffect, useState } from 'react';
import { apiRequest } from '../../api';
import type { GroupSummary } from '../../types';
import type { Paginated, PlatformActivity } from '../../types/licensing.types';
import { Alerts } from '../common/Alerts';
import { Pagination } from '../common/Pagination';

type HistoryWorkspaceProps = {
  token: string;
  groups: GroupSummary[];
  formatDateTime: (value: string) => string;
};

export function HistoryWorkspace({ token, groups, formatDateTime }: HistoryWorkspaceProps) {
  const [groupId, setGroupId] = useState('');
  const [page, setPage] = useState(1);
  const [history, setHistory] = useState<Paginated<PlatformActivity> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page) });
    if (groupId) {
      params.set('group_id', groupId);
    }

    setHistory(null);
    setError(null);
    apiRequest<Paginated<PlatformActivity>>(`/admin/history?${params}`, { signal: controller.signal }, token)
      .then((response) => {
        if (!controller.signal.aborted) {
          setHistory(response);
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : t("Não foi possível carregar o histórico.", "Could not load the activity log."));
        }
      });

    return () => controller.abort();
  }, [groupId, page, token]);

  return (
    <section className="workspace-panel admin-panel">
      <header className="workspace-head admin-head">
        <h2>{t("Histórico da plataforma", "Platform activity")}</h2>
      </header>
      <article className="workspace-card">
        <div className="form">
          <label>
            {t("Banda", "Band")}
            <select value={groupId} onChange={(event) => { setGroupId(event.target.value); setPage(1); }}>
              <option value="">{t("Toda a plataforma", "Whole platform")}</option>
              {groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}
            </select>
          </label>
        </div>
        <Alerts error={error} success={null} />
        {!history && !error ? <p role="status">{t("A carregar o histórico...", "Loading activity…")}</p> : null}
        {history ? (
          <>
            {history.data.length === 0 ? <p className="muted">{t("Sem atividade registada.", "No activity has been recorded.")}</p> : (
              <div className="table-wrapper entity-table-wrapper">
                <table className="entity-table">
                  <thead><tr><th>{t("Data", "Date")}</th><th>{t("Banda", "Band")}</th><th>{t("Utilizador", "User")}</th><th>{t("Ação", "Action")}</th></tr></thead>
                  <tbody>
                    {history.data.map((activity) => (
                      <tr key={activity.id}>
                        <td>{formatDateTime(activity.created_at)}</td>
                        <td>{activity.group_name ?? '—'}</td>
                        <td>{activity.actor?.name ?? '—'}</td>
                        <td>{activity.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={history.current_page} lastPage={history.last_page} onChange={setPage} />
          </>
        ) : null}
      </article>
    </section>
  );
}
