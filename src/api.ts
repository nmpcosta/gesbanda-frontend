import { language, t } from './language';
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';

type ApiErrorPayload = {
  message?: string;
  errors?: Record<string, string[]>;
};

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback;
  }

  const data = payload as ApiErrorPayload;

  if (data.message) {
    return data.message;
  }

  if (data.errors) {
    const firstField = Object.values(data.errors)[0];
    if (firstField && firstField.length > 0) {
      return firstField[0];
    }
  }

  return fallback;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Accept-Language', language === 'en' ? 'en' : 'pt-PT');
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  const isFormDataBody =
    typeof FormData !== 'undefined' && options.body instanceof FormData;

  if (!headers.has('Content-Type') && options.body && !isFormDataBody) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(payload, `Pedido falhou com HTTP ${response.status}`)
    );
  }

  return payload as T;
}

export async function fetchApiFile(path: string, token: string, signal?: AbortSignal): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    signal,
    headers: { Accept: 'application/json', 'Accept-Language': language, Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(extractErrorMessage(payload, t("Não foi possível descarregar o ficheiro.", "Could not download the file.")));
  }

  return response;
}

export async function downloadApiFile(path: string, token: string, filename: string, useServerFilename = false): Promise<void> {
  const response = await fetchApiFile(path, token);
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  const disposition = useServerFilename ? response.headers.get('Content-Disposition') : null;
  const encodedFilename = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const standardFilename = disposition?.match(/filename=(?:"([^"]+)"|([^;]+))/i);
  link.download = encodedFilename ? decodeURIComponent(encodedFilename) : standardFilename?.[1] ?? standardFilename?.[2] ?? filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
