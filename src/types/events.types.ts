export type EventSummary = {
  id: number;
  group_id: number;
  target_section?: string | null;
  series_id?: string | null;
  is_public?: boolean;
  created_by_user_id: number | null;
  title: string;
  event_type: 'rehearsal' | 'concert' | 'activity' | 'meeting' | 'internal';
  starts_at: string;
  ends_at: string | null;
  location: string | null;
  description: string | null;
  reminder_hours_before: number[] | null;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
};

export type EventsResponse = {
  data: EventSummary[];
};

export type EventResponse = {
  data: EventSummary;
};

export type EventRsvpResponse = {
  data: {
    id: number;
    event_id: number;
    user_id: number;
    status: 'yes' | 'no' | 'maybe';
    note: string | null;
    responded_at: string | null;
  };
};

export type EventRsvpsResponse = {
  data: {
    id: number;
    event_id: number;
    user_id: number;
    status: 'yes' | 'no' | 'maybe';
    note: string | null;
    responded_at: string | null;
  }[];
  summary: {
    yes: number;
    no: number;
    maybe: number;
  };
};

export type CreateEventInput = {
  title: string;
  event_type: 'rehearsal' | 'concert' | 'activity' | 'meeting' | 'internal';
  starts_at: string;
  ends_at?: string | null;
  location?: string;
  description?: string;
  target_section?: string | null;
  reminder_hours_before?: number[];
  is_public?: boolean;
  repeat_count?: number;
  repeat_interval_weeks?: number;
  timezone?: string;
};

export type UpdateEventInput = Partial<CreateEventInput> & {
  status?: EventSummary['status'];
};

export type EventRsvpInput = {
  status: 'yes' | 'no' | 'maybe';
  note?: string;
};
