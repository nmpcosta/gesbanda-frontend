import { t } from '../../language';
import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { UiIcon } from '../common/UiIcon';
import { ViewModeToggle, type ListingViewMode } from '../common/ViewModeToggle';
import type { EventSummary, GroupSummary } from '../../types';
import type { EventForm, RsvpSummary } from '../../ui-types';
import type { EventEditForm } from '../../hooks/useEventsData';

type EventsWorkspaceMode = 'list' | 'detail' | 'edit' | 'create';

type EventsWorkspaceProps = {
  repertoire: React.ReactNode;
  groups: GroupSummary[];
  sections: string[];
  openDetail: boolean;
  canManage: boolean;
  selectedGroupId: number | null;
  setSelectedGroupId: (groupId: number | null) => void;
  events: EventSummary[];
  selectedEvent: EventSummary | null;
  selectedEventId: number | null;
  setSelectedEventId: (eventId: number) => void;
  formatDateTime: (value: string) => string;
  loadingEvents: boolean;
  loadingSummary: boolean;
  submittingRsvpId: number | null;
  rsvpSummary: RsvpSummary | null;
  eventForm: EventForm;
  eventEditForm: EventEditForm;
  submittingEvent: boolean;
  updatingEvent: boolean;
  deletingEvent: boolean;
  setEventForm: (updater: (previous: EventForm) => EventForm) => void;
  setEventEditForm: (updater: (previous: EventEditForm) => EventEditForm) => void;
  onRefresh: () => void;
  onCreateSubmit: (event: FormEvent) => Promise<boolean>;
  onUpdateSubmit: (event: FormEvent) => Promise<boolean>;
  onDeleteSelected: () => void | Promise<void>;
  onRsvp: (eventId: number, status: 'yes' | 'no' | 'maybe') => void;
};

export function EventsWorkspace({
  repertoire,
  groups,
  sections,
  openDetail,
  canManage,
  selectedGroupId,
  setSelectedGroupId,
  events,
  selectedEvent,
  selectedEventId,
  setSelectedEventId,
  formatDateTime,
  loadingEvents,
  loadingSummary,
  submittingRsvpId,
  rsvpSummary,
  eventForm,
  eventEditForm,
  submittingEvent,
  updatingEvent,
  deletingEvent,
  setEventForm,
  setEventEditForm,
  onRefresh,
  onCreateSubmit,
  onUpdateSubmit,
  onDeleteSelected,
  onRsvp,
}: EventsWorkspaceProps) {
  const [mode, setMode] = useState<EventsWorkspaceMode>(openDetail ? 'detail' : 'list');
  const [listingView, setListingView] = useState<ListingViewMode>('table');

  useEffect(() => {
    if (!selectedEvent && mode !== 'create' && mode !== 'list') {
      setMode('list');
    }
  }, [mode, selectedEvent]);

  return (
    <section className="workspace-panel admin-panel">
      <header className="workspace-head admin-head">
        <div>
          <h2>{t("Eventos", "Events")}</h2>
          <p className="subtitle">{t("Listagem por grupo com detalhe, RSVP e manutencao do registo.", "Browse events and track RSVPs.")}</p>
        </div>

        <div className="summary-row">
          {mode === 'list' ? (
            <>
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
              <button
                className="ghost icon-action"
                type="button"
                onClick={() => setMode('create')}
                disabled={!selectedGroupId || !canManage}
              >
                <UiIcon name="plus" />
                <span>{t("Novo evento", "New event")}</span>
              </button>
            </>
          ) : mode === 'detail' ? (
            <>
              <button className="ghost icon-action" type="button" onClick={() => setMode('list')}>
                <UiIcon name="arrow-left" />
                <span>{t("Voltar a lista", "Back to list")}</span>
              </button>
              <button
                className="ghost icon-action"
                type="button"
                onClick={() => setMode('edit')}
                disabled={!selectedEvent || !canManage}
              >
                <UiIcon name="edit" />
                <span>{t("Editar", "Edit")}</span>
              </button>
              <button
                type="button"
                className="tiny danger icon-action"
                onClick={() => onDeleteSelected()}
                disabled={!selectedEvent || deletingEvent || !canManage}
              >
                <UiIcon name="trash" />
                <span>{deletingEvent ? t("A eliminar...", "Deleting…") : t("Eliminar", "Delete")}</span>
              </button>
            </>
          ) : mode === 'edit' ? (
            <button className="ghost icon-action" type="button" onClick={() => setMode('detail')}>
              <UiIcon name="arrow-left" />
              <span>{t("Voltar ao detalhe", "Back to details")}</span>
            </button>
          ) : (
            <button className="ghost icon-action" type="button" onClick={() => setMode('list')}>
              <UiIcon name="arrow-left" />
              <span>{t("Voltar a lista", "Back to list")}</span>
            </button>
          )}
        </div>
      </header>

      {mode === 'list' ? (
        !selectedGroupId ? (
          <article className="workspace-card">
            <p className="muted">{t("Seleciona um grupo para listar eventos.", "Select an ensemble to view its events.")}</p>
          </article>
        ) : events.length === 0 ? (
          <article className="workspace-card">
            <p className="muted">{t("Sem eventos neste grupo.", "No events for this ensemble.")}</p>
          </article>
        ) : (
          <article className="workspace-card listing-shell">
            <div className="listing-head">
              <h3>{t("Listagem", "List")}</h3>
              <ViewModeToggle value={listingView} onChange={setListingView} />
            </div>

            {listingView === 'table' ? (
              <div className="table-wrapper entity-table-wrapper">
                <table className="entity-table">
                  <thead>
                    <tr>
                      <th>{t("Título", "Title")}</th>
                      <th>{t("Tipo", "Type")}</th>
                      <th>{t("Data", "Date")}</th>
                      <th>{t("Status", "Status")}</th>
                      <th>{t("Acoes", "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((eventItem) => (
                      <tr key={eventItem.id} className={selectedEventId === eventItem.id ? 'selected' : ''}>
                        <td>
                          <div className="table-primary">
                            <strong>{eventItem.title}</strong>
                            <small>{eventItem.location ?? t('Sem localização', 'No location')}</small>
                          </div>
                        </td>
                        <td>{eventItem.event_type}</td>
                        <td>{formatDateTime(eventItem.starts_at)}</td>
                        <td>
                          <span className={`status-chip ${eventItem.status === 'cancelled' ? 'warn' : 'ok'}`}>
                            {eventItem.status}
                          </span>
                        </td>
                        <td className="cell-actions">
                          <button
                            type="button"
                            className="tiny icon-only"
                            onClick={() => {
                              setSelectedEventId(eventItem.id);
                              setMode('detail');
                            }}
                            aria-label={`Ver detalhe do evento ${eventItem.title}`}
                          >
                            <UiIcon name="eye" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="entity-card-grid">
                {events.map((eventItem) => (
                  <article
                    key={eventItem.id}
                    className={`entity-card${selectedEventId === eventItem.id ? ' selected' : ''}`}
                  >
                    <div>
                      <h4>{eventItem.title}</h4>
                      <p>{eventItem.event_type}</p>
                      <p>{formatDateTime(eventItem.starts_at)}</p>
                    </div>
                    <div className="entity-card-actions">
                      <span className={`status-chip ${eventItem.status === 'cancelled' ? 'warn' : 'ok'}`}>
                        {eventItem.status}
                      </span>
                      <button
                        type="button"
                        className="tiny icon-action"
                        onClick={() => {
                          setSelectedEventId(eventItem.id);
                          setMode('detail');
                        }}
                      >
                        <UiIcon name="eye" />
                        <span>{t("Detalhe", "Details")}</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        )
      ) : null}

      {mode === 'detail' ? (
        <article className="workspace-card">
          {!selectedEvent ? (
            <p className="muted">{t("Seleciona um evento na listagem.", "Select an event from the list.")}</p>
          ) : (
            <div className="detail-list">
              <p>
                <strong>{t("Título:", "Title:")}</strong> {selectedEvent.title}
              </p>
              <p>
                <strong>{t("Tipo:", "Type:")}</strong> {selectedEvent.event_type}
              </p>
              <p>
                <strong>{t("Início:", "Start:")}</strong> {formatDateTime(selectedEvent.starts_at)}
              </p>
              <p>
                <strong>{t("Fim:", "End:")}</strong>{' '}
                {selectedEvent.ends_at ? formatDateTime(selectedEvent.ends_at) : t("Sem fim definido", "No end time")}
              </p>
              <p>
                <strong>{t("Localização:", "Location:")}</strong> {selectedEvent.location ?? t('Sem localização', 'No location')}
              </p>
              <p>
                <strong>{t("Descrição:", "Description:")}</strong> {selectedEvent.description ?? t('Sem descrição', 'No description')}
              </p>
              <p>
                <strong>{t("Status:", "Status:")}</strong> {selectedEvent.status}
              </p>
              {repertoire}

              <div className="summary-card">
                <h4>RSVP</h4>
                <div className="summary-row">
                  <button
                    className="tiny icon-action"
                    type="button"
                    disabled={submittingRsvpId === selectedEvent.id}
                    onClick={() => onRsvp(selectedEvent.id, 'yes')}
                  >
                    <UiIcon name="check" />
                    <span>{t("Confirmar", "Confirm")}</span>
                  </button>
                  <button
                    className="tiny icon-action"
                    type="button"
                    disabled={submittingRsvpId === selectedEvent.id}
                    onClick={() => onRsvp(selectedEvent.id, 'no')}
                  >
                    <UiIcon name="x" />
                    <span>{t("Recusar", "Decline")}</span>
                  </button>
                  <button
                    className="tiny icon-action"
                    type="button"
                    disabled={submittingRsvpId === selectedEvent.id}
                    onClick={() => onRsvp(selectedEvent.id, 'maybe')}
                  >
                    <UiIcon name="help" />
                    <span>{t("Talvez", "Maybe")}</span>
                  </button>
                </div>

                {loadingSummary ? (
                  <p className="muted">{t("A carregar resumo...", "Loading summary…")}</p>
                ) : rsvpSummary ? (
                  <div className="summary-row">
                    <span className="summary-pill">{t("Sim:", "Yes:")} {rsvpSummary.yes}</span>
                    <span className="summary-pill">{t("Não:", "No:")} {rsvpSummary.no}</span>
                    <span className="summary-pill">{t("Talvez:", "Maybe:")} {rsvpSummary.maybe}</span>
                  </div>
                ) : (
                  <p className="muted">{t("Sem dados de RSVP.", "No RSVP data.")}</p>
                )}
              </div>
            </div>
          )}
        </article>
      ) : null}

      {mode === 'edit' && canManage ? (
        <article className="workspace-card">
          <form
            className="form"
            onSubmit={async (event) => {
              const saved = await onUpdateSubmit(event);
              if (saved) {
                setMode('detail');
              }
            }}
          >
            <h3>{t("Editar evento", "Edit event")}</h3>
            <label>
              {t("Título", "Title")}
              <input
                type="text"
                required
                value={eventEditForm.title}
                onChange={(event) =>
                  setEventEditForm((previous) => ({ ...previous, title: event.target.value }))
                }
                disabled={!selectedEvent}
              />
            </label>

            <label>
              {t("Tipo", "Type")}
              <select
                value={eventEditForm.eventType}
                onChange={(event) =>
                  setEventEditForm((previous) => ({
                    ...previous,
                    eventType: event.target.value as EventForm['eventType'],
                  }))
                }
                disabled={!selectedEvent}
              >
                <option value="rehearsal">{t("Ensaio", "Rehearsal")}</option>
                <option value="concert">{t("Concerto", "Concert")}</option>
                <option value="activity">{t("Atividade", "Activity")}</option>
                <option value="meeting">{t("Reuniao", "Meeting")}</option>
                <option value="internal">{t("Interno", "Internal")}</option>
              </select>
            </label>

            <label>
              {t("Início", "Start")}
              <input
                type="datetime-local"
                required
                value={eventEditForm.startsAt}
                onChange={(event) =>
                  setEventEditForm((previous) => ({ ...previous, startsAt: event.target.value }))
                }
                disabled={!selectedEvent}
              />
            </label>

            <label>
              {t("Fim", "End")}
              <input
                type="datetime-local"
                value={eventEditForm.endsAt}
                onChange={(event) =>
                  setEventEditForm((previous) => ({ ...previous, endsAt: event.target.value }))
                }
                disabled={!selectedEvent}
              />
            </label>

            <label>
              {t("Localização", "Location")}
              <input
                type="text"
                value={eventEditForm.location}
                onChange={(event) =>
                  setEventEditForm((previous) => ({ ...previous, location: event.target.value }))
                }
                disabled={!selectedEvent}
              />
            </label>

            <label>
              {t("Descrição", "Description")}
              <textarea
                rows={3}
                value={eventEditForm.description}
                onChange={(event) =>
                  setEventEditForm((previous) => ({ ...previous, description: event.target.value }))
                }
                disabled={!selectedEvent}
              />
            </label>

            <label>
              {t("Status", "Status")}
              <select
                value={eventEditForm.status}
                onChange={(event) =>
                  setEventEditForm((previous) => ({
                    ...previous,
                    status: event.target.value as EventEditForm['status'],
                  }))
                }
                disabled={!selectedEvent}
              >
                <option value="draft">{t("Rascunho", "Draft")}</option>
                <option value="published">{t("Publicado", "Published")}</option>
                <option value="cancelled">{t("Cancelado", "Cancelled")}</option>
                <option value="completed">{t("Concluido", "Completed")}</option>
              </select>
            </label>

            <label>
              {t("Naipe convocado", "Invited section")}
              <select name="target_section" defaultValue={selectedEvent?.target_section ?? ''} key={selectedEvent?.id} >
                <option value="">{t("Toda a banda", "Whole ensemble")}</option>
                {sections.map((section) => <option value={section} key={section}>{section}</option>)}
              </select>
            </label>
            <label>
              {t("Lembretes (horas antes, separadas por vírgulas)", "Reminders (hours before, separated by commas)")}
              <input name="reminders" defaultValue={selectedEvent?.id ? (selectedEvent?.reminder_hours_before ?? []).join(', ') : '24, 3'} key={selectedEvent?.id} />
            </label>

            <input type="hidden" name="public_control" value="1" />
            <label className="checkbox-row">
              <input type="checkbox" name="is_public" key={selectedEvent?.id} defaultChecked={selectedEvent?.is_public} />
              {t("Mostrar na página pública da banda", "Show on the ensemble’s public page")}
            </label>

            <button type="submit" className="icon-action" disabled={updatingEvent || !selectedEvent}>
              <UiIcon name="check" />
              <span>{updatingEvent ? t("A guardar...", "Saving…") : t("Guardar alteracoes", "Save changes")}</span>
            </button>
          </form>
        </article>
      ) : null}

      {mode === 'create' && canManage ? (
        <article className="workspace-card">
          <form
            className="form"
            onSubmit={async (event) => {
              const created = await onCreateSubmit(event);
              if (created) {
                setMode('list');
              }
            }}
          >
            <h3>{t("Novo evento", "New event")}</h3>
            <label>
              {t("Título", "Title")}
              <input
                type="text"
                required
                value={eventForm.title}
                onChange={(event) =>
                  setEventForm((previous) => ({ ...previous, title: event.target.value }))
                }
                disabled={!selectedGroupId}
              />
            </label>

            <label>
              {t("Tipo", "Type")}
              <select
                value={eventForm.eventType}
                onChange={(event) =>
                  setEventForm((previous) => ({
                    ...previous,
                    eventType: event.target.value as EventForm['eventType'],
                  }))
                }
                disabled={!selectedGroupId}
              >
                <option value="rehearsal">{t("Ensaio", "Rehearsal")}</option>
                <option value="concert">{t("Concerto", "Concert")}</option>
                <option value="activity">{t("Atividade", "Activity")}</option>
                <option value="meeting">{t("Reuniao", "Meeting")}</option>
                <option value="internal">{t("Interno", "Internal")}</option>
              </select>
            </label>

            <label>
              {t("Início", "Start")}
              <input
                type="datetime-local"
                required
                value={eventForm.startsAt}
                onChange={(event) =>
                  setEventForm((previous) => ({ ...previous, startsAt: event.target.value }))
                }
                disabled={!selectedGroupId}
              />
            </label>

            <label>
              {t("Fim", "End")}
              <input
                type="datetime-local"
                value={eventForm.endsAt}
                onChange={(event) =>
                  setEventForm((previous) => ({ ...previous, endsAt: event.target.value }))
                }
                disabled={!selectedGroupId}
              />
            </label>

            <label>
              {t("Localização", "Location")}
              <input
                type="text"
                value={eventForm.location}
                onChange={(event) =>
                  setEventForm((previous) => ({ ...previous, location: event.target.value }))
                }
                disabled={!selectedGroupId}
              />
            </label>

            <label>
              {t("Descrição", "Description")}
              <textarea
                rows={3}
                value={eventForm.description}
                onChange={(event) =>
                  setEventForm((previous) => ({ ...previous, description: event.target.value }))
                }
                disabled={!selectedGroupId}
              />
            </label>

            <label>
              {t("Naipe convocado", "Invited section")}
              <select name="target_section" defaultValue={''}  >
                <option value="">{t("Toda a banda", "Whole ensemble")}</option>
                {sections.map((section) => <option value={section} key={section}>{section}</option>)}
              </select>
            </label>
            <label>
              {t("Lembretes (horas antes, separadas por vírgulas)", "Reminders (hours before, separated by commas)")}
              <input name="reminders" defaultValue="24, 3"  />
            </label>

            <label>
              {t("Número de ocorrências (incluindo a primeira)", "Number of occurrences, including the first")}
              <input name="repeat_count" type="number" min={1} max={52} defaultValue={1} required />
            </label>
            <label>
              {t("Intervalo em semanas", "Interval in weeks")}
              <input name="repeat_interval_weeks" type="number" min={1} max={12} defaultValue={1} required />
            </label>

            <input type="hidden" name="public_control" value="1" />
            <label className="checkbox-row">
              <input type="checkbox" name="is_public" defaultChecked={false} />
              {t("Mostrar na página pública da banda", "Show on the ensemble’s public page")}
            </label>

            <button type="submit" className="icon-action" disabled={submittingEvent || !selectedGroupId}>
              <UiIcon name="plus" />
              <span>{submittingEvent ? t("A criar...", "Creating…") : t("Criar evento", "Create event")}</span>
            </button>
          </form>
        </article>
      ) : null}
    </section>
  );
}
