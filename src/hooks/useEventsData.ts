import { t } from '../language';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  createEvent,
  deleteEvent,
  getEventRsvps,
  listEvents,
  setEventRsvp,
  updateEvent,
} from '../auth';
import type { EventSummary } from '../types';
import type { EventForm, RsvpSummary } from '../ui-types';

type UseEventsDataOptions = {
  token: string | null;
  selectedGroupId: number | null;
  setError: (message: string | null) => void;
  setSuccess: (message: string | null) => void;
};

export type EventEditForm = EventForm & {
  status: EventSummary['status'];
};

function toDateTimeLocalValue(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toDateTimeLocalFromIso(value: string | null): string {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return toDateTimeLocalValue(parsed);
}

function getPlanningInput(event: FormEvent) {
  const fields = new FormData(event.currentTarget as HTMLFormElement);
  const reminders = fields.get('reminders');
  return {
    is_public: fields.has('public_control') ? fields.has('is_public') : undefined,
    target_section: fields.has('target_section') ? String(fields.get('target_section')).trim() || null : undefined,
    reminder_hours_before: typeof reminders === 'string'
      ? reminders.split(',').map((value) => value.trim()).filter(Boolean).map(Number)
      : undefined,
  };
}

function getInitialEventForm(): EventForm {
  const start = new Date();
  start.setHours(start.getHours() + 2);

  const end = new Date(start);
  end.setHours(end.getHours() + 2);

  return {
    title: '',
    eventType: 'rehearsal',
    startsAt: toDateTimeLocalValue(start),
    endsAt: toDateTimeLocalValue(end),
    location: '',
    description: '',
  };
}

function getInitialEventEditForm(): EventEditForm {
  return {
    ...getInitialEventForm(),
    status: 'published',
  };
}

export function useEventsData({
  token,
  selectedGroupId,
  setError,
  setSuccess,
}: UseEventsDataOptions) {
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [rsvpSummary, setRsvpSummary] = useState<RsvpSummary | null>(null);

  const [loadingEvents, setLoadingEvents] = useState<boolean>(false);
  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [submittingEvent, setSubmittingEvent] = useState<boolean>(false);
  const [updatingEvent, setUpdatingEvent] = useState<boolean>(false);
  const [deletingEvent, setDeletingEvent] = useState<boolean>(false);
  const [submittingRsvpId, setSubmittingRsvpId] = useState<number | null>(null);

  const [eventForm, setEventForm] = useState<EventForm>(getInitialEventForm());
  const [eventEditForm, setEventEditForm] = useState<EventEditForm>(getInitialEventEditForm());

  const selectedEvent = useMemo(
    () => events.find((eventItem) => eventItem.id === selectedEventId) ?? null,
    [events, selectedEventId]
  );

  async function loadEvents(currentToken: string, groupId: number) {
    setLoadingEvents(true);

    try {
      const response = await listEvents(currentToken, groupId);
      setEvents(response.data);
      setSelectedEventId((previous) => {
        if (previous && response.data.some((eventItem) => eventItem.id === previous)) {
          return previous;
        }

        return response.data[0]?.id ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Nao foi possivel carregar eventos.", "Could not load the events."));
    } finally {
      setLoadingEvents(false);
    }
  }

  async function loadRsvpSummary(currentToken: string, eventId: number) {
    setLoadingSummary(true);

    try {
      const response = await getEventRsvps(currentToken, eventId);
      setRsvpSummary(response.summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Nao foi possivel carregar resumo de RSVP.", "Could not load the RSVP summary."));
      setRsvpSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  }

  useEffect(() => {
    if (!token || !selectedGroupId) {
      setEvents([]);
      setSelectedEventId(null);
      setRsvpSummary(null);
      setEventEditForm(getInitialEventEditForm());
      return;
    }

    // Evita pedidos com evento antigo quando o utilizador muda de banda.
    setSelectedEventId(null);
    setRsvpSummary(null);

    loadEvents(token, selectedGroupId);
  }, [token, selectedGroupId]);

  useEffect(() => {
    if (!token || !selectedEventId) {
      setRsvpSummary(null);
      return;
    }

    loadRsvpSummary(token, selectedEventId);
  }, [token, selectedEventId]);

  useEffect(() => {
    if (!selectedEvent) {
      setEventEditForm(getInitialEventEditForm());
      return;
    }

    setEventEditForm({
      title: selectedEvent.title,
      eventType: selectedEvent.event_type,
      startsAt: toDateTimeLocalFromIso(selectedEvent.starts_at),
      endsAt: toDateTimeLocalFromIso(selectedEvent.ends_at),
      location: selectedEvent.location ?? '',
      description: selectedEvent.description ?? '',
      status: selectedEvent.status,
    });
  }, [selectedEvent]);

  async function handleCreateEventSubmit(event: FormEvent): Promise<boolean> {
    event.preventDefault();

    if (!token || !selectedGroupId) {
      return false;
    }

    setSubmittingEvent(true);
    setError(null);
    setSuccess(null);

    try {
      const recurring = new FormData(event.currentTarget as HTMLFormElement);
      const repeatCount = Number(recurring.get('repeat_count') || 1);
      await createEvent(token, selectedGroupId, {
        ...getPlanningInput(event),
        ...(repeatCount > 1 ? {
          repeat_count: repeatCount,
          repeat_interval_weeks: Number(recurring.get('repeat_interval_weeks') || 1),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        } : {}),
        title: eventForm.title.trim(),
        event_type: eventForm.eventType,
        starts_at: new Date(eventForm.startsAt).toISOString(),
        ends_at: eventForm.endsAt ? new Date(eventForm.endsAt).toISOString() : undefined,
        location: eventForm.location.trim() || undefined,
        description: eventForm.description.trim() || undefined,
      });

      await loadEvents(token, selectedGroupId);
      setEventForm(getInitialEventForm());
      setSuccess(t("Evento criado com sucesso.", "Event created."));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Falha ao criar evento.", "Could not create the event."));
      return false;
    } finally {
      setSubmittingEvent(false);
    }
  }

  async function handleUpdateEventSubmit(event: FormEvent): Promise<boolean> {
    event.preventDefault();

    if (!token || !selectedEventId) {
      return false;
    }

    setUpdatingEvent(true);
    setError(null);
    setSuccess(null);

    try {
      await updateEvent(token, selectedEventId, {
        ...getPlanningInput(event),
        title: eventEditForm.title.trim(),
        event_type: eventEditForm.eventType,
        starts_at: new Date(eventEditForm.startsAt).toISOString(),
        ends_at: eventEditForm.endsAt ? new Date(eventEditForm.endsAt).toISOString() : null,
        location: eventEditForm.location.trim() || undefined,
        description: eventEditForm.description.trim() || undefined,
        status: eventEditForm.status,
      });

      if (selectedGroupId) {
        await loadEvents(token, selectedGroupId);
      }

      setSuccess(t("Evento atualizado com sucesso.", "Event updated."));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Falha ao atualizar evento.", "Could not update the event."));
      return false;
    } finally {
      setUpdatingEvent(false);
    }
  }

  async function handleRsvp(eventId: number, status: 'yes' | 'no' | 'maybe') {
    if (!token) {
      return;
    }

    setSubmittingRsvpId(eventId);
    setError(null);

    try {
      await setEventRsvp(token, eventId, { status });
      await loadRsvpSummary(token, eventId);
      setSuccess(`RSVP atualizado para ${status}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Falha ao atualizar RSVP.", "Could not update the RSVP."));
    } finally {
      setSubmittingRsvpId(null);
    }
  }

  async function handleDeleteSelectedEvent() {
    if (!token || !selectedEvent) {
      return;
    }

    const canContinue =
      typeof window === 'undefined' || window.confirm(`Eliminar o evento "${selectedEvent.title}"?`);

    if (!canContinue) {
      return;
    }

    setDeletingEvent(true);
    setError(null);
    setSuccess(null);

    try {
      await deleteEvent(token, selectedEvent.id);

      if (selectedGroupId) {
        await loadEvents(token, selectedGroupId);
      }

      setSuccess(t("Evento eliminado com sucesso.", "Event deleted."));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Falha ao eliminar evento.", "Could not delete the event."));
    } finally {
      setDeletingEvent(false);
    }
  }

  return {
    events,
    selectedEvent,
    selectedEventId,
    setSelectedEventId,
    rsvpSummary,
    loadingEvents,
    loadingSummary,
    submittingEvent,
    updatingEvent,
    deletingEvent,
    submittingRsvpId,
    eventForm,
    setEventForm,
    eventEditForm,
    setEventEditForm,
    loadEvents,
    loadRsvpSummary,
    handleCreateEventSubmit,
    handleUpdateEventSubmit,
    handleDeleteSelectedEvent,
    handleRsvp,
  };
}
