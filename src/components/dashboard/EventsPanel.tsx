import { t } from '../../language';
﻿import type { EventSummary, GroupSummary } from '../../types';
import type { RsvpSummary } from '../../ui-types';

type EventsPanelProps = {
  groups: GroupSummary[];
  selectedGroupId: number | null;
  onSelectGroupId: (groupId: number | null) => void;
  loadingAny: boolean;
  hasSelectedGroup: boolean;
  events: EventSummary[];
  selectedEventId: number | null;
  onSelectEventId: (eventId: number) => void;
  submittingRsvpId: number | null;
  onRsvp: (eventId: number, status: 'yes' | 'no' | 'maybe') => void;
  onRefresh: () => void;
  formatDateTime: (value: string) => string;
  loadingSummary: boolean;
  rsvpSummary: RsvpSummary | null;
};

export function EventsPanel({
  groups,
  selectedGroupId,
  onSelectGroupId,
  loadingAny,
  hasSelectedGroup,
  events,
  selectedEventId,
  onSelectEventId,
  submittingRsvpId,
  onRsvp,
  onRefresh,
  formatDateTime,
  loadingSummary,
  rsvpSummary,
}: EventsPanelProps) {
  return (
    <article className="module-panel full-width events-panel">
      <div className="groups-header">
        <h2>{t("Eventos", "Events")}</h2>
        <div className="inline-controls">
          <select
            value={selectedGroupId ?? ''}
            onChange={(event) =>
              onSelectGroupId(event.target.value ? Number(event.target.value) : null)
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
          <button className="ghost" type="button" onClick={onRefresh} disabled={!hasSelectedGroup}>
            {loadingAny ? t("A atualizar...", "Refreshing…") : t("Atualizar", "Refresh")}
          </button>
        </div>
      </div>

      {!hasSelectedGroup ? (
        <p className="muted">{t("Seleciona um grupo para gerir eventos.", "Select an ensemble to manage its events.")}</p>
      ) : events.length === 0 ? (
        <p className="muted">{t("Sem eventos para este grupo.", "No events for this ensemble.")}</p>
      ) : (
        <ul className="events-list">
          {events.map((eventItem) => (
            <li
              key={eventItem.id}
              className={`event-item${selectedEventId === eventItem.id ? ' selected' : ''}`}
              onClick={() => onSelectEventId(eventItem.id)}
            >
              <div>
                <strong>{eventItem.title}</strong>
                <p className="event-meta">
                  {eventItem.event_type} • {formatDateTime(eventItem.starts_at)}
                  {eventItem.location ? ` • ${eventItem.location}` : ''}
                </p>
                {eventItem.description && <p>{eventItem.description}</p>}
              </div>

              <div className="rsvp-row">
                <button
                  className="tiny"
                  type="button"
                  disabled={submittingRsvpId === eventItem.id}
                  onClick={() => onRsvp(eventItem.id, 'yes')}
                >
                  {t("Sim", "Yes")}
                </button>
                <button
                  className="tiny"
                  type="button"
                  disabled={submittingRsvpId === eventItem.id}
                  onClick={() => onRsvp(eventItem.id, 'no')}
                >
                  {t("Nao", "No")}
                </button>
                <button
                  className="tiny"
                  type="button"
                  disabled={submittingRsvpId === eventItem.id}
                  onClick={() => onRsvp(eventItem.id, 'maybe')}
                >
                  {t("Talvez", "Maybe")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {selectedEventId ? (
        <div className="summary-card">
          <h3>{t("Resumo RSVP", "RSVP summary")}</h3>
          {loadingSummary ? (
            <p className="muted">{t("A carregar resumo...", "Loading summary…")}</p>
          ) : rsvpSummary ? (
            <div className="summary-row">
              <span className="summary-pill">{t("Sim:", "Yes:")} {rsvpSummary.yes}</span>
              <span className="summary-pill">{t("Nao:", "No:")} {rsvpSummary.no}</span>
              <span className="summary-pill">{t("Talvez:", "Maybe:")} {rsvpSummary.maybe}</span>
            </div>
          ) : (
            <p className="muted">{t("Sem dados de RSVP.", "No RSVP data.")}</p>
          )}
        </div>
      ) : null}
    </article>
  );
}
