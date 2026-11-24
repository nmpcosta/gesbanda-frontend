import { t } from '../../language';

import { useState } from 'react';
import QRCode from 'qrcode';
import { apiRequest } from '../../api';
import { Alerts } from '../common/Alerts';

type CheckInSession = {
  data: { method: 'qr' | 'location'; expires_at: string };
  code: string | null;
};

function getCoordinates(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error(t("Este navegador não disponibiliza a localização.", "Your browser cannot provide your location.")));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      () => reject(new Error(t("Não foi possível obter a tua localização. Confirma a permissão do navegador.", "Could not get your location. Check the browser permissions."))),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
}

type CheckInProps = {
  token: string;
  eventId: number;
  canManage: boolean;
  locationOpen: boolean;
  onChange: () => void;
};

export function AttendanceCheckIn({ token, eventId, canManage, locationOpen, onChange }: CheckInProps) {
  const [method, setMethod] = useState<'qr' | 'location'>('qr');
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<CheckInSession['data'] | null>(null);
  const [qr, setQr] = useState<{ image: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const path = `/events/${eventId}/attendance`;

  async function run(action: () => Promise<void>) {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Não foi possível registar a chamada.", "Could not record the check-in."));
    } finally {
      setSaving(false);
    }
  }

  if (!canManage && !locationOpen && !success) {
    return null;
  }

  return (
    <article className="workspace-card">
      <h3>{t("Chamada por QR ou localização", "QR or location check-in")}</h3>
      <Alerts error={error} success={success} />
      {canManage ? (
        <form className="form" onSubmit={(event) => {
          event.preventDefault();
          const fields = new FormData(event.currentTarget);
          void run(async () => {
            const coordinates = method === 'location' ? await getCoordinates() : null;
            const response = await apiRequest<CheckInSession>(`${path}/session`, {
              method: 'PUT',
              body: JSON.stringify({
                method,
                minutes: Number(fields.get('minutes')),
                latitude: coordinates?.latitude,
                longitude: coordinates?.longitude,
                radius_meters: method === 'location' ? Number(fields.get('radius')) : undefined,
              }),
            }, token);

            setSession(response.data);
            setQr(null);
            if (response.code) {
              const url = new URL(window.location.href);
              url.searchParams.delete('mode');
              url.searchParams.set('app', '1');
              url.hash = new URLSearchParams({ 'check-in': response.code }).toString();
              setQr({ url: url.href, image: await QRCode.toDataURL(url.href, { width: 280, margin: 3 }) });
            }
            setSuccess(t("Chamada aberta.", "Check-in opened."));
          });
        }}>
          <label>{t("Método", "Method")}
            <select value={method} onChange={(event) => setMethod(event.target.value === 'location' ? 'location' : 'qr')}>
              <option value="qr">{t("Código QR", "QR code")}</option><option value="location">{t("Localização atual", "Current location")}</option>
            </select>
          </label>
          <label>{t("Validade em minutos", "Duration in minutes")}<input name="minutes" type="number" min={1} max={180} defaultValue={30} required /></label>
          {method === 'location' ? <label>{t("Raio em metros", "Radius in metres")}<input name="radius" type="number" min={25} max={1000} defaultValue={100} required /></label> : null}
          <div className="summary-row">
            <button type="submit" disabled={saving}>{t("Abrir chamada", "Open check-in")}</button>
            <button type="button" className="ghost" disabled={saving} onClick={() => run(async () => {
              await apiRequest(`${path}/session`, { method: 'DELETE' }, token);
              setSession(null);
              setQr(null);
              setSuccess(t("Chamada fechada.", "Check-in closed."));
            })}>{t("Fechar chamada", "Close check-in")}</button>
          </div>
          {session ? <p>{t("Chamada aberta até", "Check-in is open until")} {new Date(session.expires_at).toLocaleString(document.documentElement.lang)}</p> : null}
          {qr ? <div><img src={qr.image} width={280} height={280} alt={t("Código QR para registar a presença", "QR code for attendance check-in")} /><p><a href={qr.url}>{t("Abrir ligação da chamada", "Open check-in link")}</a></p></div> : null}
        </form>
      ) : null}
      {locationOpen ? <button type="button" disabled={saving} onClick={() => run(async () => {
        const { latitude, longitude, accuracy } = await getCoordinates();
        await apiRequest(`${path}/check-in/location`, {
          method: 'POST',
          body: JSON.stringify({ latitude, longitude, accuracy }),
        }, token);
        setSuccess(t("Presença registada.", "Attendance recorded."));
        onChange();
      })}>{t("Registar presença pela localização", "Check in with location")}</button> : null}
    </article>
  );
}

export function QrAttendance({ token, code, onClose }: { token: string; code: string; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <section className="workspace-card">
      <h2>{t("Registar presença", "Check in")}</h2>
      <Alerts error={error} success={success} />
      <div className="summary-row">
        <button type="button" disabled={saving || Boolean(success)} onClick={async () => {
          setSaving(true);
          setError(null);
          try {
            const result = await apiRequest<{ event_title: string }>('/attendance/check-in/qr', {
              method: 'POST',
              body: JSON.stringify({ code }),
            }, token);
            setSuccess(`Presença registada em «${result.event_title}».`);
          } catch (err) {
            setError(err instanceof Error ? err.message : t("Não foi possível registar a presença.", "Could not record your attendance."));
          } finally {
            setSaving(false);
          }
        }}>{t("Confirmar presença", "Confirm attendance")}</button>
        <button type="button" className="ghost" onClick={onClose}>{t("Fechar", "Close")}</button>
      </div>
    </section>
  );
}
