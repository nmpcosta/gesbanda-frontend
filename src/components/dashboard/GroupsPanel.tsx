import { t } from '../../language';
﻿import type { GroupSummary } from '../../types';

type GroupsPanelProps = {
  groups: GroupSummary[];
  loadingGroups: boolean;
  onRefresh: () => void;
};

export function GroupsPanel({ groups, loadingGroups, onRefresh }: GroupsPanelProps) {
  return (
    <article className="module-panel full-width">
      <div className="groups-header">
        <h2>{t("Grupos", "Ensembles")}</h2>
        <button className="ghost" type="button" onClick={onRefresh} disabled={loadingGroups}>
          {loadingGroups ? t("A atualizar...", "Refreshing…") : t("Atualizar", "Refresh")}
        </button>
      </div>

      {groups.length === 0 ? (
        <p className="muted">{t("Ainda nao tens grupos criados ou associados.", "You have not created or joined an ensemble yet.")}</p>
      ) : (
        <ul className="groups-list">
          {groups.map((group) => (
            <li key={group.id} className="group-item">
              <div>
                <strong>{group.name}</strong>
                <p>
                  {group.group_type}
                  {group.location ? ` • ${group.location}` : ''}
                </p>
              </div>
              <span className="badge">{group.plan_tier}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
