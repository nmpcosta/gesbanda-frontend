
import { useState } from 'react';
import { apiRequest } from '../../api';
import { useWorkspaceResource } from '../../hooks/useWorkspaceResource';
import { t } from '../../language';
import { Alerts } from '../common/Alerts';

type ScoreInstrumentProps = {
  file: File;
  token: string;
  groupId: number;
  onSelect: (instrument: string) => void;
};

export function ScoreInstrumentSuggestion({ file, token, groupId, onSelect }: ScoreInstrumentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const path = `/groups/${groupId}/assistant`;
  const { data } = useWorkspaceResource<{ enabled: boolean }>(path, token);

  if (!data?.enabled || file.size > 5 * 1024 * 1024 || !file.name.toLowerCase().endsWith('.pdf')) {
    return null;
  }

  return (
    <div className="detail-list">
      <button type="button" className="ghost" disabled={loading} onClick={async () => {
        if (!window.confirm(t('Enviar este PDF ao serviço de IA para sugerir o instrumento ou voz?', 'Send this PDF to the AI service to suggest an instrument or voice?'))) {
          return;
        }

        const form = new FormData();
        form.set('score', file);
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
          const response = await apiRequest<{ data: { instrument: string | null } }>(`${path}/score`, { method: 'POST', body: form }, token);
          const instrument = response.data.instrument;
          if (instrument) {
            onSelect(instrument);
            setSuccess(t('Sugestão preenchida. Confirma o instrumento ou voz antes de guardar.', 'Suggestion applied. Check the instrument or voice before saving.'));
          } else {
            setSuccess(t('Não foi possível identificar um instrumento ou voz específico.', 'A specific instrument or voice could not be identified.'));
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : t('Falha ao analisar a partitura.', 'Could not analyse the score.'));
        } finally {
          setLoading(false);
        }
      }}>{loading ? t('A analisar…', 'Analysing…') : t('Sugerir instrumento com IA', 'Suggest instrument with AI')}</button>
      <Alerts error={error} success={success} />
    </div>
  );
}
