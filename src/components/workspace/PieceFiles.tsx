import { useEffect, useRef, useState } from 'react';
import { apiRequest, downloadApiFile, fetchApiFile } from '../../api';
import { uploadGroupAsset } from '../../auth';
import { t } from '../../language';
import { instrumentGroups, memberInstruments, musicLabel } from '../../musicCatalog';
import type { GroupAssetSummary, GroupMemberSummary } from '../../types';

type QueuedFile = { id: number; file: File; instrument: string; error?: string };

type PieceFilesProps = {
  initialPartId?: number;
  onPartChange?: (assetId: number) => void;
  loading: boolean;
  pieceId: number;
  groupId: number;
  token: string;
  assets: GroupAssetSummary[];
} & ({ canManage: boolean; members: GroupMemberSummary[]; onRefresh: () => Promise<void> }
  | { canManage: false; members?: never; onRefresh?: never });

function ScorePreview({ path, token, title }: { path: string; token: string; title: string }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    let previewUrl = '';
    async function load() {
      try {
        const response = await fetchApiFile(path, token, controller.signal);
        const blob = await response.blob();
        if (!(await blob.slice(0, 1024).text()).includes('%PDF-')) {
          throw new Error(t('O ficheiro não contém um PDF válido.', 'The file does not contain a valid PDF.'));
        }
        if (controller.signal.aborted) return;
        previewUrl = URL.createObjectURL(blob.slice(0, blob.size, 'application/pdf'));
        setUrl(previewUrl);
      } catch (err) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : t('Falha ao abrir o PDF.', 'Could not open the PDF.'));
      }
    }
    void load();
    return () => {
      controller.abort();
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [path, token]);
  if (error) return <p role="alert">{error}</p>;
  return url ? <iframe title={title} src={url} style={{ width: '100%', height: '70vh', border: 0 }} />
    : <p role="status">{t('A abrir a pauta…', 'Opening the score…')}</p>;
}

export function PieceFiles({ pieceId, groupId, token, assets, members, onRefresh, canManage, loading, initialPartId, onPartChange }: PieceFilesProps) {
  const [reading, setReading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(initialPartId ?? null);
  const [downloading, setDownloading] = useState(false);
  const [queue, setQueue] = useState<QueuedFile[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const nextId = useRef(0);
  const scores = assets.filter(asset => asset.group_id === groupId && asset.repertoire_piece_id === pieceId);
  const parts = scores.filter(asset => asset.asset_type === 'score' || asset.meta?.mime === 'application/pdf' ||
    /\.pdf$/i.test(asset.meta?.original_name ?? asset.title));
  const selected = parts.find(asset => asset.id === selectedId) ?? parts[0];
  const catalogue = instrumentGroups.flatMap(group => group.options.map(([value]) => value));
  const extra = [...new Set([...(members ?? []).flatMap(memberInstruments), ...scores.map(asset => asset.instrument)])]
    .filter((value): value is string => Boolean(value) && !catalogue.includes(value!));

  function instrumentSelect(name: string, value: string, onChange: (value: string) => void) {
    return <select disabled={busy} value={value} aria-label={t('Instrumento de ', 'Instrument for ') + name}
      onChange={event => onChange(event.target.value)}>
      <option value="">{t('Geral (toda a banda)', 'General (whole band)')}</option>
      {extra.map(option => <option key={option} value={option}>{musicLabel(option)}</option>)}
      {instrumentGroups.map(group => <optgroup key={group.title[0]} label={t(...group.title)}>
        {group.options.map(option => <option key={option[0]} value={option[0]}>{t(...option)}</option>)}
      </optgroup>)}
    </select>;
  }

  async function sendFiles() {
    setBusy(true);
    setMessage('');
    const pending = [...queue];
    let uploaded = 0;
    async function worker() {
      let item: QueuedFile | undefined;
      while ((item = pending.shift())) {
        const { file, instrument, id } = item;
        try {
          if (file.size > 20 * 1024 * 1024) throw new Error(t('Excede o limite de 20 MiB.', 'Exceeds the 20 MiB limit.'));
          const data = new FormData();
          data.set('file', file);
          data.set('title', (file.name.replace(/\.[^.]+$/, '').trim() || file.name).slice(0, 200));
          data.set('asset_type', 'score');
          data.set('repertoire_piece_id', String(pieceId));
          if (instrument) data.set('instrument', instrument);
          await uploadGroupAsset(token, groupId, data);
          uploaded++;
          setQueue(rows => rows.filter(row => row.id !== id));
        } catch (err) {
          const error = err instanceof Error ? err.message : t('Falha no envio.', 'Upload failed.');
          setQueue(rows => rows.map(row => row.id === id ? { ...row, error } : row));
        }
      }
    }
    try {
      await Promise.all(Array.from({ length: Math.min(3, pending.length) }, worker));
      if (uploaded) await onRefresh?.();
      setMessage(t(`${uploaded} de ${queue.length} ficheiros enviados.`, `${uploaded} of ${queue.length} files uploaded.`));
    } finally {
      setBusy(false);
    }
  }

  async function assign(asset: GroupAssetSummary, instrument: string) {
    setBusy(true);
    setMessage('');
    try {
      await apiRequest(`/groups/${groupId}/assets/${asset.id}`, {
        method: 'PATCH', body: JSON.stringify({ instrument: instrument || null }),
      }, token);
      await onRefresh?.();
      setMessage(t('Instrumento atualizado.', 'Instrument updated.'));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : t('Falha ao guardar.', 'Could not save.'));
    } finally {
      setBusy(false);
    }
  }

  return <section className="summary-card form score-panel">
    <h4>{t('Pautas da obra', 'Scores for this piece')}</h4>
    {selected ? <>
      <label>{t('Escolher pauta', 'Choose a score')}
        <select value={selected.id} onChange={event => {
          const assetId = Number(event.target.value);
          setSelectedId(assetId);
          onPartChange?.(assetId);
        }}>
          {parts.map(asset => <option key={asset.id} value={asset.id}>
            {asset.title}{asset.meta?.original_name && asset.meta.original_name !== asset.title && asset.meta.original_name.replace(/\.[^.]+$/, '') !== asset.title ? ` (${asset.meta.original_name})` : ''} · {asset.instrument ? musicLabel(asset.instrument) : t('Geral', 'General')}
          </option>)}
        </select>
      </label>
      {(selected.meta?.mime === 'application/pdf' || /\.pdf$/i.test(selected.meta?.original_name ?? selected.title)) && <>
        <button className="workspace-primary" type="button" aria-expanded={reading} onClick={() => setReading(open => !open)}>
          {reading ? t('Fechar leitura', 'Close reader') : t('Ler pauta', 'Read score')}
        </button>
        {reading && <ScorePreview key={selected.id} path={`/groups/${groupId}/assets/${selected.id}/download`} token={token} title={selected.title} />}
      </>}
      <button type="button" className="ghost" disabled={downloading} onClick={async () => {
        setDownloading(true);
        setMessage('');
        try {
          await downloadApiFile(`/groups/${groupId}/assets/${selected.id}/download`, token, selected.meta?.original_name || selected.title, true);
        } catch (err) {
          setMessage(err instanceof Error ? err.message : t('Falha ao descarregar a pauta.', 'Could not download the score.'));
        } finally {
          setDownloading(false);
        }
      }}>{downloading ? t('A descarregar…', 'Downloading…') : t('Descarregar pauta', 'Download score')}</button>
    </> : <p className="muted">{loading ? t('A carregar pautas…', 'Loading scores…') : t('Sem pautas disponíveis para esta obra.', 'No scores available for this piece.')}</p>}
    <span role="status">{message}</span>
    {canManage && <>
    <label>{t('Adicionar ficheiros', 'Add files')}
      <input type="file" multiple disabled={busy} onChange={event => {
        const selected = Array.from(event.target.files ?? [], file => ({ id: nextId.current++, file, instrument: '' }));
        setQueue(rows => [...rows, ...selected]);
        setMessage('');
        event.target.value = '';
      }} />
    </label>
    <p className="muted">{t('Até 20 MiB por ficheiro. As pautas gerais ficam disponíveis para toda a banda. Podes escolher o instrumento antes ou depois do envio.',
      'Up to 20 MiB per file. General scores are available to the whole band. Choose the instrument before or after uploading.')}</p>
    {queue.map(item => <div className="summary-card" key={item.id}>
      <strong style={{ overflowWrap: 'anywhere' }}>{item.file.name}</strong>
      {instrumentSelect(item.file.name, item.instrument, instrument =>
        setQueue(rows => rows.map(row => row.id === item.id ? { ...row, instrument } : row)))}
      <button type="button" className="ghost tiny" disabled={busy} onClick={() => setQueue(rows => rows.filter(row => row.id !== item.id))}>
        {t('Retirar', 'Remove')}
      </button>
      {item.error && <p role="alert">{item.error}</p>}
    </div>)}
    {queue.length > 0 && <button type="button" disabled={busy} onClick={sendFiles}>
      {busy ? t('A processar…', 'Processing…') : t(`Enviar ficheiros (${queue.length})`, `Upload files (${queue.length})`)}
    </button>}
    {scores.map(asset => <label key={asset.id} style={{ overflowWrap: 'anywhere' }}>
      {asset.meta?.original_name || asset.title}
      {instrumentSelect(asset.title, asset.instrument ?? '', instrument => void assign(asset, instrument))}
    </label>)}
    </>}
  </section>;
}
