import { t } from '../../language';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { apiRequest } from '../../api';
import type { EventSummary, GroupMemberSummary, GroupSummary } from '../../types';
import { Alerts } from '../common/Alerts';
import { AttendanceCheckIn } from './AttendanceCheckIn';

type AttendanceStatus = 'present' | 'absent' | 'excused';

type AttendanceRecord = {
  user_id: number;
  status: AttendanceStatus;
  note: string | null;
};

type AttendanceStatistics = {
  user_id: number;
  name: string;
} & Record<AttendanceStatus, number>;

type AttendanceWorkspaceProps = {
  token: string;
  group: GroupSummary;
  events: EventSummary[];
  members: GroupMemberSummary[];
  canManage: boolean;
  formatDateTime: (value: string) => string;
};

const statusLabels: Record<AttendanceStatus, string> = {
  present: t("Presente", "Present"),
  absent: t("Falta", "Absent"),
  excused: t("Falta justificada", "Excused absence"),
};

export function AttendanceWorkspace({ token, group, events, members, canManage, formatDateTime }: AttendanceWorkspaceProps) {
  const [eventId, setEventId] = useState<number | null>(null);
  const [locationOpen, setLocationOpen] = useState(false);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [statistics, setStatistics] = useState<AttendanceStatistics[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [version, setVersion] = useState(0);

  const selectedEvent = events.find((event) => event.id === eventId) ?? events[0];
  const selectedEventId = selectedEvent?.id;

  useEffect(() => {
    const controller = new AbortController();
    const request = { signal: controller.signal };
    setLoading(true);
    setError(null);
    setRecords([]);

    Promise.all([
      apiRequest<{ data: AttendanceStatistics[] }>(`/groups/${group.id}/attendance`, request, token),
      selectedEventId
        ? apiRequest<{ data: AttendanceRecord[]; location_open: boolean }>(`/events/${selectedEventId}/attendance`, request, token)
        : Promise.resolve({ data: [], location_open: false }),
    ]).then(([totals, attendance]) => {
      if (!controller.signal.aborted) {
        setStatistics(totals.data);
        setRecords(attendance.data);
        setLocationOpen(attendance.location_open);
        setLoading(false);
      }
    }).catch((err: unknown) => {
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err.message : t("Não foi possível carregar as presenças.", "Could not load attendance."));
        setLoading(false);
      }
    });

    return () => controller.abort();
  }, [token, group.id, selectedEventId, version]);

  async function saveAttendance(event: FormEvent<HTMLFormElement>, userId: number) {
    event.preventDefault();
    if (!selectedEventId || saving !== null) {
      return;
    }

    const form = new FormData(event.currentTarget);
    setSaving(userId);
    setError(null);

    try {
      await apiRequest(`/events/${selectedEventId}/attendance/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: form.get('status'), note: form.get('note') }),
      }, token);

      setVersion((previous) => previous + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Não foi possível guardar a presença.", "Could not save the attendance record."));
    } finally {
      setSaving(null);
    }
  }

  const roster = members.filter((member) => (member.status === 'active' || member.user_id === group.owner_user_id)
    && (!selectedEvent?.target_section || member.section === selectedEvent.target_section));

  return (
    <section className="workspace-panel admin-panel">
      <header className="workspace-head admin-head">
        <div>
          <h2>{t("Presenças", "Attendance")}</h2>
          <p className="subtitle">{group.name}</p>
        </div>
        <button type="button" className="ghost" disabled={loading || saving !== null} onClick={() => setVersion((previous) => previous + 1)}>{t("Atualizar", "Refresh")}</button>
      </header>
      <Alerts error={error} success={null} />
      <article className="workspace-card">
        <h3>{t("Chamada por evento", "Attendance by event")}</h3>
        {events.length > 0 ? (
          <div className="form">
            <label>{t("Evento", "Event")}
              <select value={selectedEventId} disabled={saving !== null} onChange={(event) => setEventId(Number(event.target.value))}>
                {events.map((event) => <option key={event.id} value={event.id}>{event.title} · {formatDateTime(event.starts_at)}</option>)}
              </select>
            </label>
          </div>
        ) : <p className="muted">{t("Cria um evento na agenda para registar a presença dos músicos.", "Create an event in the schedule to record attendance.")}</p>}
        {loading ? <p role="status">{t("A carregar presenças...", "Loading attendance…")}</p> : null}
        {!loading && selectedEvent && canManage ? (
          <div className="entity-card-grid">
            {roster.map((member) => {
              const record = records.find((row) => row.user_id === member.user_id);
              return (
                <form className="entity-card form" key={`${selectedEvent.id}-${member.user_id}-${version}`} onSubmit={(event) => saveAttendance(event, member.user_id)}>
                  <h4>{member.user?.name ?? `Membro #${member.user_id}`}</h4>
                  <label>{t("Presença", "Attendance")}
                    <select name="status" defaultValue={record?.status ?? ''} required>
                      <option value="" disabled>{t("Por registar", "Not recorded")}</option>
                      {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </label>
                  <label>{t("Motivo ou observação", "Reason or note")}
                    <input name="note" defaultValue={record?.note ?? ''} maxLength={2000} />
                  </label>
                  <button type="submit" className="tiny" disabled={saving !== null}>{saving === member.user_id ? t("A guardar...", "Saving…") : t("Guardar presença", "Save attendance")}</button>
                </form>
              );
            })}
          </div>
        ) : null}
        {!loading && selectedEvent && !canManage ? (
          <p>{records[0] ? statusLabels[records[0].status] : t("A tua presença ainda não foi registada.", "Your attendance has not been recorded yet.")}</p>
        ) : null}
      </article>
      {selectedEvent ? <AttendanceCheckIn key={selectedEvent.id} token={token} eventId={selectedEvent.id}
        canManage={canManage} locationOpen={locationOpen} onChange={() => setVersion((previous) => previous + 1)} /> : null}
      <article className="workspace-card">
        <h3>{canManage ? t("Estatísticas por músico", "Statistics by musician") : t("As minhas presenças", "My attendance")}</h3>
        {statistics.length === 0 ? <p className="muted">{t("Ainda não há presenças registadas.", "There are no attendance records yet.")}</p> : (
          <div className="table-wrapper entity-table-wrapper">
            <table className="entity-table">
              <thead><tr><th>{t("Músico", "Musician")}</th><th>{t("Presenças", "Attendance")}</th><th>{t("Faltas", "Absences")}</th><th>{t("Justificadas", "Excused")}</th></tr></thead>
              <tbody>
                {statistics.map((row) => (
                  <tr key={row.user_id}><td>{row.name}</td><td>{row.present}</td><td>{row.absent}</td><td>{row.excused}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
