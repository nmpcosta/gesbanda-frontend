import { t } from '../../language';
﻿import type { FormEvent } from 'react';
import type { EventForm } from '../../ui-types';

type CreateEventPanelProps = {
  eventForm: EventForm;
  submittingEvent: boolean;
  canCreate: boolean;
  setEventForm: (updater: (previous: EventForm) => EventForm) => void;
  onSubmit: (event: FormEvent) => void;
};

export function CreateEventPanel({
  eventForm,
  submittingEvent,
  canCreate,
  setEventForm,
  onSubmit,
}: CreateEventPanelProps) {
  return (
    <article className="module-panel full-width">
      <h2>{t("Criar evento", "Create event")}</h2>
      <form className="form" onSubmit={onSubmit}>
        <label>
          {t("Titulo", "Title")}
          <input
            type="text"
            required
            value={eventForm.title}
            onChange={(event) =>
              setEventForm((previous) => ({ ...previous, title: event.target.value }))
            }
          />
        </label>

        <label>
          {t("Tipo de evento", "Event type")}
          <select
            value={eventForm.eventType}
            onChange={(event) =>
              setEventForm((previous) => ({
                ...previous,
                eventType: event.target.value as EventForm['eventType'],
              }))
            }
          >
            <option value="rehearsal">{t("Ensaio", "Rehearsal")}</option>
            <option value="concert">{t("Concerto", "Concert")}</option>
            <option value="activity">{t("Atividade", "Activity")}</option>
            <option value="meeting">{t("Reuniao", "Meeting")}</option>
            <option value="internal">{t("Interno", "Internal")}</option>
          </select>
        </label>

        <label>
          {t("Inicio", "Start")}
          <input
            type="datetime-local"
            required
            value={eventForm.startsAt}
            onChange={(event) =>
              setEventForm((previous) => ({
                ...previous,
                startsAt: event.target.value,
              }))
            }
          />
        </label>

        <label>
          {t("Fim", "End")}
          <input
            type="datetime-local"
            value={eventForm.endsAt}
            onChange={(event) =>
              setEventForm((previous) => ({
                ...previous,
                endsAt: event.target.value,
              }))
            }
          />
        </label>

        <label>
          {t("Localizacao", "Location")}
          <input
            type="text"
            value={eventForm.location}
            onChange={(event) =>
              setEventForm((previous) => ({
                ...previous,
                location: event.target.value,
              }))
            }
          />
        </label>

        <label>
          {t("Descricao", "Description")}
          <textarea
            rows={3}
            value={eventForm.description}
            onChange={(event) =>
              setEventForm((previous) => ({
                ...previous,
                description: event.target.value,
              }))
            }
          />
        </label>

        <button type="submit" disabled={submittingEvent || !canCreate}>
          {submittingEvent ? t("A criar evento...", "Creating event…") : t("Criar evento", "Create event")}
        </button>
      </form>
    </article>
  );
}
