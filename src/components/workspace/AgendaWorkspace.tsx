import { t } from '../../language';
import { useMemo, useState } from 'react';
import type { EventSummary, GroupSummary } from '../../types';
import { UiIcon } from '../common/UiIcon';

type AgendaWorkspaceProps = {
  groups: GroupSummary[];
  selectedGroupId: number | null;
  setSelectedGroupId: (groupId: number | null) => void;
  events: EventSummary[];
  loadingEvents: boolean;
  onRefresh: () => void;
  onOpenEvent: (eventId: number) => void;
  onGoToEvents: () => void;
};

const weekDays = [t("Seg", "Mon"), t("Ter", "Tue"), t("Qua", "Wed"), t("Qui", "Thu"), t("Sex", "Fri"), t("Sab", "Sat"), t("Dom", "Sun")];

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toLocalDateKeyFromIso(value: string): string | null {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return toDateKey(parsed);
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('pt-PT', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function AgendaWorkspace({
  groups,
  selectedGroupId,
  setSelectedGroupId,
  events,
  loadingEvents,
  onRefresh,
  onOpenEvent,
  onGoToEvents,
}: AgendaWorkspaceProps) {
  const [monthCursor, setMonthCursor] = useState<Date>(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const monthLabel = monthCursor.toLocaleDateString('pt-PT', {
    month: 'long',
    year: 'numeric',
  });

  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventSummary[]>();

    events.forEach((eventItem) => {
      const dateKey = toLocalDateKeyFromIso(eventItem.starts_at);

      if (!dateKey) {
        return;
      }

      const current = map.get(dateKey) ?? [];
      current.push(eventItem);
      map.set(dateKey, current);
    });

    map.forEach((items) => {
      items.sort(
        (first, second) =>
          new Date(first.starts_at).getTime() - new Date(second.starts_at).getTime()
      );
    });

    return map;
  }, [events]);

  const calendarCells = useMemo(() => {
    const firstDayIndex = (new Date(
      monthCursor.getFullYear(),
      monthCursor.getMonth(),
      1
    ).getDay() + 6) % 7;
    const gridStart = new Date(
      monthCursor.getFullYear(),
      monthCursor.getMonth(),
      1 - firstDayIndex
    );

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);

      return {
        key: toDateKey(date),
        date,
        isCurrentMonth: date.getMonth() === monthCursor.getMonth(),
      };
    });
  }, [monthCursor]);

  const upcomingList = useMemo(() => {
    const nowTime = Date.now();
    return [...events]
      .filter((eventItem) => new Date(eventItem.starts_at).getTime() >= nowTime)
      .sort(
        (first, second) =>
          new Date(first.starts_at).getTime() - new Date(second.starts_at).getTime()
      )
      .slice(0, 6);
  }, [events]);

  return (
    <section className="workspace-panel admin-panel">
      <header className="workspace-head admin-head">
        <div>
          <h2>{t("Agenda", "Schedule")}</h2>
          <p className="subtitle">{t("Calendario mensal dos eventos do grupo selecionado.", "Monthly calendar for the selected ensemble.")}</p>
        </div>

        <div className="summary-row">
          <select
            value={selectedGroupId ?? ''}
            onChange={(event) =>
              setSelectedGroupId(event.target.value ? Number(event.target.value) : null)
            }
          >
            {groups.length === 0 ? (
              <option value="">{t("Sem grupos", "No ensembles")}</option>
            ) : (
              groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))
            )}
          </select>
          <button
            className="ghost icon-action"
            type="button"
            onClick={onRefresh}
            disabled={!selectedGroupId}
          >
            <UiIcon name="refresh" />
            <span>{loadingEvents ? t("A atualizar...", "Refreshing…") : t("Atualizar", "Refresh")}</span>
          </button>
          <button className="ghost icon-action" type="button" onClick={onGoToEvents}>
            <UiIcon name="events" />
            <span>{t("Ir para Eventos", "Go to events")}</span>
          </button>
        </div>
      </header>

      {!selectedGroupId ? (
        <article className="workspace-card">
          <p className="muted">{t("Seleciona um grupo para visualizar o calendario da agenda.", "Select an ensemble to view its calendar.")}</p>
        </article>
      ) : (
        <section className="agenda-layout">
          <article className="workspace-card">
            <div className="agenda-head">
              <div className="agenda-nav">
                <button
                  type="button"
                  className="tiny icon-action"
                  onClick={() =>
                    setMonthCursor(
                      (previous) =>
                        new Date(previous.getFullYear(), previous.getMonth() - 1, 1)
                    )
                  }
                >
                  <UiIcon name="arrow-left" />
                  <span>{t("Mes anterior", "Previous month")}</span>
                </button>
                <strong>{monthLabel}</strong>
                <button
                  type="button"
                  className="tiny icon-action"
                  onClick={() =>
                    setMonthCursor(
                      (previous) =>
                        new Date(previous.getFullYear(), previous.getMonth() + 1, 1)
                    )
                  }
                >
                  <UiIcon name="arrow-right" />
                  <span>{t("Proximo mes", "Next month")}</span>
                </button>
              </div>

              <button
                type="button"
                className="ghost icon-action"
                onClick={() => {
                  const today = new Date();
                  setMonthCursor(new Date(today.getFullYear(), today.getMonth(), 1));
                }}
              >
                <UiIcon name="agenda" />
                <span>{t("Hoje", "Today")}</span>
              </button>
            </div>

            <div className="calendar-grid">
              {weekDays.map((day) => (
                <div key={day} className="calendar-weekday">
                  {day}
                </div>
              ))}

              {calendarCells.map((cell) => {
                const dayEvents = eventsByDate.get(cell.key) ?? [];

                return (
                  <div
                    key={cell.key}
                    className={`calendar-cell${cell.isCurrentMonth ? '' : ' muted-cell'}`}
                  >
                    <div className="calendar-date">{cell.date.getDate()}</div>

                    <div className="calendar-events">
                      {dayEvents.slice(0, 2).map((eventItem) => (
                        <button
                          key={eventItem.id}
                          type="button"
                          className="calendar-event-pill"
                          onClick={() => onOpenEvent(eventItem.id)}
                        >
                          <span>{eventItem.title}</span>
                          <small>
                            {new Date(eventItem.starts_at).toLocaleTimeString('pt-PT', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </small>
                        </button>
                      ))}

                      {dayEvents.length > 2 ? (
                        <span className="calendar-more">+{dayEvents.length - 2} {t("mais", "more")}</span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>

          <aside className="workspace-card agenda-side">
            <h3>{t("Proximos eventos", "Upcoming events")}</h3>

            {upcomingList.length === 0 ? (
              <p className="muted">{t("Sem eventos futuros registados.", "No upcoming events.")}</p>
            ) : (
              <ul className="agenda-upcoming-list">
                {upcomingList.map((eventItem) => (
                  <li key={eventItem.id} className="agenda-upcoming-item">
                    <div>
                      <strong>{eventItem.title}</strong>
                      <p>{eventItem.event_type}</p>
                      <p>{formatDateTime(eventItem.starts_at)}</p>
                    </div>
                    <button
                      type="button"
                      className="tiny icon-action"
                      onClick={() => onOpenEvent(eventItem.id)}
                    >
                      <UiIcon name="eye" />
                      <span>{t("Abrir", "Open")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </section>
      )}
    </section>
  );
}
