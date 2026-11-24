import { t } from '../../language';

import { useWorkspaceResource } from '../../hooks/useWorkspaceResource';
import { Alerts } from '../common/Alerts';

type EventReminder = {
  id: number;
  event_id: number;
  group_id: number;
  title: string;
  starts_at: string;
  group_name: string;
  read_at: string | null;
};

type RemindersWorkspaceProps = {
  token: string;
  formatDateTime: (value: string) => string;
  onOpenGroup: (groupId: number) => void;
};

export function RemindersWorkspace({ token, formatDateTime, onOpenGroup }: RemindersWorkspaceProps) {
  const { data, loading, error, saving, save } = useWorkspaceResource<{ data: EventReminder[] }>('/reminders', token);

  return (
    <section className="workspace-panel admin-panel">
      <header className="workspace-head admin-head">
        <h2>{t("Lembretes", "Reminders")}</h2>
        <button className="ghost" type="button" disabled={saving || !data?.data.some((reminder) => !reminder.read_at)}
          onClick={() => save('/reminders/read', 'PATCH')}>{t("Marcar todos como lidos", "Mark all as read")}</button>
      </header>
      <Alerts error={error} success={null} />
      {loading ? <p role="status">{t("A carregar lembretes...", "Loading reminders…")}</p> : null}
      {data?.data.length === 0 ? <p className="workspace-card">{t("Não tens lembretes de eventos por responder.", "You have no reminders for events waiting for your response.")}</p> : null}
      {data?.data.map((reminder) => (
        <article className="workspace-card detail-list" key={reminder.id}>
          <h3>{reminder.title}</h3>
          <p>{reminder.group_name} · {formatDateTime(reminder.starts_at)}</p>
          <div className="summary-row">
            {!reminder.read_at ? <span className="status-chip">{t("Por ler", "Unread")}</span> : null}
            <button className="tiny ghost" type="button" onClick={() => onOpenGroup(reminder.group_id)}>{t("Ver eventos da banda", "View ensemble events")}</button>
          </div>
        </article>
      ))}
    </section>
  );
}
