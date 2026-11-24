import { t } from '../language';

import { useEffect, useState } from 'react';
import { apiRequest } from '../api';

export function useWorkspaceResource<T>(path: string, token: string | null) {
  const [result, setData] = useState<{ path: string; token: string; data: T } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (token === null) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    apiRequest<T>(path, { signal: controller.signal }, token)
      .then((response) => {
        if (!controller.signal.aborted) {
          setData({ path, token, data: response });
        }
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          setData(null);
          setError(err instanceof Error ? err.message : t("Não foi possível carregar os dados.", "Could not load the data."));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [path, token, version]);

  function refresh() {
    setLoading(true);
    setVersion((previous) => previous + 1);
  }

  async function save(url: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', input?: object): Promise<boolean> {
    if (token === null) return false;

    setSaving(true);
    setError(null);

    try {
      await apiRequest(url, { method, body: input instanceof FormData ? input : input ? JSON.stringify(input) : undefined }, token);
      refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Não foi possível guardar a alteração.", "Could not save the change."));
      return false;
    } finally {
      setSaving(false);
    }
  }

  const data = result?.path === path && result.token === token ? result.data : null;
  return { data, loading, saving, error, save, refresh };
}
