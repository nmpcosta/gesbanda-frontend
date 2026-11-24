
import { useEffect, useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { apiRequest } from '../../api';
import { useWorkspaceResource } from '../../hooks/useWorkspaceResource';
import { memberInstruments, memberSections, musicLabel } from '../../musicCatalog';
import { t } from '../../language';
import type { EventSummary, GroupMemberSummary, GroupSummary } from '../../types';
import { Alerts } from '../common/Alerts';
import { UiIcon } from '../common/UiIcon';
import './stage-plans.css';

type Position = { label: string; x: number; y: number; member_id?: number | null; section?: string | null };
type Musician = { id: number; name: string; sections: string[]; instruments: string[] };
type StagePlan = {
  id: number;
  title: string;
  event_id: number | null;
  layout_type: 'auditorium' | 'parade';
  positions: Position[];
};
type StagePlansWorkspaceProps = {
  token: string;
  group: GroupSummary;
  members: GroupMemberSummary[];
  events: EventSummary[];
  canManage: boolean;
};

const emptyPlan: StagePlan = { id: 0, title: '', event_id: null, layout_type: 'auditorium', positions: [] };
const limit = 500;

function coordinate(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function StagePlansWorkspace({ token, group, members, events, canManage }: StagePlansWorkspaceProps) {
  const [proposing, setProposing] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState<StagePlan | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedPosition, setSelectedPosition] = useState(0);
  const [dragging, setDragging] = useState<number | null>(null);
  const [sectionToAdd, setSectionToAdd] = useState('');
  const [confirmed, setConfirmed] = useState<{ eventId: number; musicians: Musician[] } | null>(null);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const surface = useRef<HTMLDivElement>(null);
  const drag = useRef<{ index: number; pointer: number; dx: number; dy: number } | null>(null);
  const path = `/groups/${group.id}/stage-plans`;
  const { data, saving, loading, error, save } = useWorkspaceResource<{ data: StagePlan[]; ai_enabled: boolean }>(path, token);
  const selected = data?.data.find((plan) => plan.id === selectedId) ?? data?.data[0];
  const preview = draft ?? selected;
  const isDirty = draft !== null && draft !== selected;
  const active = draft?.positions[selectedPosition];
  const musicians = members.filter((member) => member.status === 'active').map((member) => ({
    id: member.id,
    name: member.user?.name ?? t(`Músico #${member.id}`, `Musician #${member.id}`),
    sections: memberSections(member),
    instruments: memberInstruments(member),
  })).sort((a, b) => a.name.localeCompare(b.name));
  const sections = [...new Set(musicians.flatMap((musician) => musician.sections.length ? musician.sections : musician.instruments))].sort();
  const eventId = draft?.event_id ?? null;
  const eventRoster = confirmed?.eventId === eventId && !rosterError ? confirmed?.musicians : undefined;

  useEffect(() => {
    if (!eventId || !canManage) return;
    const controller = new AbortController();
    setRosterError(null);
    apiRequest<{ data: Musician[] }>(`/groups/${group.id}/stage-roster/${eventId}`, { signal: controller.signal }, token)
      .then((response) => {
        if (!controller.signal.aborted) setConfirmed({ eventId, musicians: response.data });
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setRosterError(err instanceof Error ? err.message : t('Falha ao carregar as presenças confirmadas.', 'Could not load confirmed musicians.'));
      });
    return () => controller.abort();
  }, [eventId, group.id, canManage, token]);

  function startDraft(plan: StagePlan | null) {
    if (isDirty && !window.confirm(t('Descartar as alterações à planta?', 'Discard changes to this stage plan?'))) {
      return;
    }

    setMessage(null);
    setProposalError(null);
    setDraft(plan);
    setSelectedPosition(0);
    setSectionToAdd('');
  }

  function setPositions(positions: Position[]) {
    setDraft((previous) => previous ? { ...previous, positions } : null);
  }

  function updatePosition(index: number, changes: Partial<Position>) {
    setDraft((previous) => previous ? {
      ...previous,
      positions: previous.positions.map((position, current) => current === index ? { ...position, ...changes } : position),
    } : null);
  }

  function addPosition() {
    if (!draft || draft.positions.length >= limit) {
      return;
    }

    setSelectedPosition(draft.positions.length);
    const offset = Math.min(draft.positions.length % 7 * 4, 24);
    setPositions([...draft.positions, {
      label: sectionToAdd || t('Nova posição', 'New position'),
      section: sectionToAdd || null,
      x: 50 + offset,
      y: 50 + offset,
    }]);
    setSectionToAdd('');
  }

  function suggest() {
    if (!draft) return;
    const eligible = eventId ? eventRoster : musicians;
    if (!eligible?.length) return;
    if (eligible.length > limit) {
      setProposalError(t('A lista ultrapassa as 500 posições por planta.', 'This roster exceeds the 500 positions supported per stage plan.'));
      return;
    }
    if (draft.positions.length && !window.confirm(t('Substituir as posições atuais pela distribuição de músicos por naipe?', 'Replace the current positions with musicians arranged by section?'))) return;

    const grouped = new Map<string, Musician[]>();
    for (const musician of eligible) {
      const section = musician.sections[0] ?? musician.instruments[0] ?? '';
      grouped.set(section, [...(grouped.get(section) ?? []), musician]);
    }
    const maxColumns = draft.layout_type === 'parade' ? 2 : 8;
    const formation = Array.from(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([section, entries]) => {
      const columns = Math.min(maxColumns, entries.length);
      return { section, entries, columns, rows: Math.ceil(entries.length / columns) };
    });
    const totalRows = formation.reduce((total, group) => total + group.rows + 0.45, 0) - 0.45;
    let startRow = 0;
    const positions = formation.flatMap((group) => {
      const result = group.entries.map((musician, index) => ({
        label: musician.name,
        member_id: musician.id,
        section: group.section || null,
        x: coordinate(100 * ((index % group.columns + 0.5) / group.columns)),
        y: coordinate(100 * ((startRow + Math.floor(index / group.columns) + 0.5) / totalRows)),
      }));
      startRow += group.rows + 0.45;
      return result;
    });
    setPositions(positions);
    setSelectedPosition(0);
    setProposalError(null);
  }

  function linkMusician(id: number | null) {
    const musician = musicians.find((entry) => entry.id === id);
    if (!musician) {
      updatePosition(selectedPosition, { member_id: null });
      return;
    }
    const scheduled = eventRoster?.find((entry) => entry.id === id);
    updatePosition(selectedPosition, {
      member_id: musician.id,
      label: musician.name,
      section: scheduled?.sections[0] ?? musician.sections[0] ?? active?.section ?? musician.instruments[0] ?? null,
    });
  }

  async function suggestWithAi() {
    if (!draft || (draft.positions.length && !window.confirm(t('Substituir as posições pela proposta da IA?', 'Replace the current positions with the AI suggestion?')))) return;
    setProposing(true);
    setProposalError(null);
    try {
      const response = await apiRequest<{ data: Position[] }>(`/groups/${group.id}/assistant/stage`, {
        method: 'POST', body: JSON.stringify({ layout_type: draft.layout_type }),
      }, token);
      setDraft((current) => current === draft ? { ...draft, positions: response.data } : current);
      setSelectedPosition(0);
    } catch (err) {
      setProposalError(err instanceof Error ? err.message : t('Falha ao sugerir a planta.', 'Could not suggest a stage plan.'));
    } finally {
      setProposing(false);
    }
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>, index: number, position: Position) {
    if (event.button !== 0 || !surface.current || saving) return;
    const rect = surface.current.getBoundingClientRect();
    setSelectedPosition(index);
    drag.current = {
      index, pointer: event.pointerId,
      dx: event.clientX - (rect.left + (position.x / 100) * rect.width),
      dy: event.clientY - (rect.top + (position.y / 100) * rect.height),
    };
    setDragging(index);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const movement = drag.current;
    const rect = surface.current?.getBoundingClientRect();
    if (!movement || movement.pointer !== event.pointerId || !rect) return;
    updatePosition(movement.index, {
      x: coordinate((event.clientX - rect.left - movement.dx) / rect.width * 100),
      y: coordinate((event.clientY - rect.top - movement.dy) / rect.height * 100),
    });
  }

  function finishDrag(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.pointer !== event.pointerId) return;
    drag.current = null;
    setDragging(null);
  }

  function moveByKey(event: KeyboardEvent<HTMLButtonElement>, index: number, position: Position) {
    const steps: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const direction = steps[event.key];
    if (!direction || saving) return;
    event.preventDefault();
    setSelectedPosition(index);
    const step = event.shiftKey ? 10 : 2;
    updatePosition(index, { x: coordinate(position.x + direction[0] * step), y: coordinate(position.y + direction[1] * step) });
  }

  const orientation = preview?.layout_type === 'parade' ? t('Sentido de marcha', 'Direction of travel') : t('Frente do palco', 'Front of stage');

  return (
    <section className="workspace-panel admin-panel">
      <header className="workspace-head admin-head">
        <div><h2>{t('Plantas de palco', 'Stage plans')}</h2><p className="subtitle">{group.name}</p></div>
        {canManage ? (
          <button type="button" className="workspace-primary icon-action" disabled={saving} onClick={() => startDraft(emptyPlan)}>
            <UiIcon name="plus" size={18} />{t('Nova planta', 'New stage plan')}
          </button>
        ) : null}
      </header>
      <Alerts error={error ?? rosterError ?? proposalError} success={message} />
      {loading ? <p role="status">{t('A carregar plantas…', 'Loading stage plans…')}</p> : null}

      {data?.data.length ? (
        <article className="workspace-card stage-toolbar">
          <label className="stage-plan-select">{t('Planta guardada', 'Saved stage plan')}
            <select value={selected?.id} disabled={saving} onChange={(event) => {
              if (isDirty && !window.confirm(t('Descartar as alterações à planta?', 'Discard changes to this stage plan?'))) return;
              setSelectedId(Number(event.target.value));
              setDraft(null);
              setSelectedPosition(0);
            }}>
              {data.data.map((plan) => <option key={plan.id} value={plan.id}>{plan.title}</option>)}
            </select>
          </label>
          {canManage && selected && !draft ? <div className="summary-row">
            <button type="button" className="workspace-primary icon-action" onClick={() => startDraft(selected)}><UiIcon name="edit" size={17} />{t('Editar planta', 'Edit stage plan')}</button>
            <button type="button" className="ghost" onClick={() => startDraft({ ...selected, id: 0, title: '', event_id: null })}>{t('Reutilizar planta', 'Reuse stage plan')}</button>
            <button type="button" className="tiny danger icon-action" disabled={saving} onClick={() => {
              if (window.confirm(t('Eliminar esta planta?', 'Delete this stage plan?'))) {
                void save(`${path}/${selected.id}`, 'DELETE');
              }
            }}><UiIcon name="trash" size={17} />{t('Eliminar', 'Delete')}</button>
          </div> : null}
        </article>
      ) : !loading && !draft ? <p className="workspace-card">{t('Ainda não há plantas guardadas.', 'There are no saved stage plans yet.')}</p> : null}

      {draft && canManage ? (
        <form className="workspace-card form stage-metadata" onSubmit={async (event) => {
          event.preventDefault();
          if (!draft.positions.every((position) => position.label.trim())) {
            setProposalError(t('Preenche o nome de todas as posições.', 'Enter a name for each position.'));
            return;
          }

          const payload = { ...draft, title: draft.title.trim(), positions: draft.positions.map((position) => ({ ...position, label: position.label.trim() })) };
          if (await save(draft.id ? `${path}/${draft.id}` : path, draft.id ? 'PUT' : 'POST', payload)) {
            setSelectedId(draft.id || null);
            setDraft(null);
            setMessage(t('Planta guardada.', 'Stage plan saved.'));
          }
        }}>
          <div className="stage-metadata-grid">
            <label>{t('Nome da planta', 'Stage plan name')}<input required maxLength={160} value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></label>
            <label>{t('Formato', 'Format')}
              <select value={draft.layout_type} onChange={(event) => setDraft({ ...draft, layout_type: event.target.value === 'parade' ? 'parade' : 'auditorium' })}>
                <option value="auditorium">{t('Auditório', 'Auditorium')}</option><option value="parade">{t('Desfile', 'Parade')}</option>
              </select>
            </label>
            <label>{t('Evento', 'Event')}
              <select value={draft.event_id ?? ''} onChange={(event) => setDraft({ ...draft, event_id: Number(event.target.value) || null })}>
                <option value="">{t('Planta geral', 'General stage plan')}</option>
                {events.map((entry) => <option key={entry.id} value={entry.id}>{entry.title}</option>)}
              </select>
            </label>
          </div>
          <div className="summary-row stage-save">
            <button type="submit" className="icon-action" disabled={saving || !draft.positions.length}><UiIcon name="check" size={18} />{saving ? t('A guardar…', 'Saving…') : t('Guardar planta', 'Save stage plan')}</button>
            <button type="button" className="ghost" disabled={saving} onClick={() => startDraft(null)}>{t('Cancelar', 'Cancel')}</button>
          </div>
        </form>
      ) : null}

      {preview ? (
        <div className={`stage-editor${draft ? ' editing' : ''}`}>
          <article className="workspace-card stage-canvas-card">
            <div className="listing-head">
              <h3>{preview.title || t('Planta sem título', 'Untitled stage plan')}</h3>
              <span className="status-chip mute">{preview.layout_type === 'parade' ? t('Desfile', 'Parade') : t('Auditório', 'Auditorium')}</span>
            </div>
            {draft ? <p id="stage-editor-instructions">{t('Arrasta uma posição ou usa as teclas de seta para a mover. Usa o painel lateral para ajustar o nome e as coordenadas.', 'Drag a position or use the arrow keys to move it. Use the position panel to edit the name and coordinates.')}</p> : null}
            {preview.layout_type === 'parade' ? <p className="stage-orientation"><span aria-hidden="true">↑</span> {orientation}</p> : null}
            <div className={`stage-canvas stage-canvas-${preview.layout_type}`} role="group" aria-label={t('Mapa de posições', 'Position map')} aria-describedby={draft ? 'stage-editor-instructions' : undefined}>
              <div className="stage-surface" ref={surface}>
                {!preview.positions.length ? <p className="stage-canvas-empty">{t('Adiciona uma posição ou gera uma proposta por naipes.', 'Add a position or generate a layout by section.')}</p> : null}
                {preview.positions.map((position, index) => {
                  const label = position.label || t('Posição sem nome', 'Unnamed position');
                  const style = { left: `${position.x}%`, top: `${position.y}%` };
                  const title = position.section ? `${label} · ${musicLabel(position.section)}` : label;

                  return draft ? (
                    <button key={index} type="button" className="stage-marker" style={style} title={title} aria-label={label}
                      aria-pressed={index === selectedPosition} data-dragging={index === dragging}
                      onClick={() => setSelectedPosition(index)}
                      onPointerDown={(event) => startDrag(event, index, position)}
                      onPointerMove={moveDrag}
                      onPointerUp={finishDrag}
                      onPointerCancel={finishDrag}
                      onLostPointerCapture={finishDrag}
                      onKeyDown={(event) => moveByKey(event, index, position)}>
                      {label}{position.section ? <small>{musicLabel(position.section)}</small> : null}
                    </button>
                  ) : <span key={index} className="stage-marker" style={style} title={title}>{label}{position.section ? <small>{musicLabel(position.section)}</small> : null}</span>;
                })}
              </div>
            </div>
            {preview.layout_type === 'auditorium' ? <p className="stage-orientation">{orientation}</p> : null}
          </article>

          {draft ? (
            <aside className="workspace-card form stage-inspector">
              <h3>{t('Posições', 'Positions')}</h3>
              <div className="stage-add-row">
                <label>{t('Adicionar naipe', 'Add section')}
                  <select value={sectionToAdd} onChange={(event) => setSectionToAdd(event.target.value)}>
                    <option value="">{t('Posição personalizada', 'Custom position')}</option>
                    {sections.map((section) => <option key={section} value={section}>{musicLabel(section)}</option>)}
                  </select>
                </label>
                <button type="button" className="ghost icon-action" disabled={saving || draft.positions.length >= limit} onClick={addPosition}><UiIcon name="plus" size={18} />{t('Adicionar', 'Add')}</button>
              </div>
              <div className="summary-row">
                <button type="button" className="ghost" disabled={saving || (eventId ? !eventRoster?.length : !musicians.length)} onClick={suggest}>
                  {eventId ? t('Distribuir confirmados por naipe', 'Arrange confirmed musicians by section') : t('Distribuir músicos por naipe', 'Arrange musicians by section')}
                </button>
                {data?.ai_enabled && !eventId ? <button type="button" className="ghost" disabled={!sections.length || proposing || saving} onClick={suggestWithAi}>
                  {proposing ? t('A gerar…', 'Generating…') : t('Sugerir com IA', 'Suggest with AI')}
                </button> : null}
              </div>
              {eventId ? <p role="status">{eventRoster
                ? t(`${eventRoster.length} músicos com presença confirmada.`, `${eventRoster.length} musicians have confirmed attendance.`)
                : rosterError ? t('Os confirmados não estão disponíveis.', 'The confirmed roster is unavailable.')
                  : t('A consultar as confirmações do evento…', 'Loading confirmations for this event…')}</p> : null}
              {active ? (
                <>
                  <label>{t('Posição selecionada', 'Selected position')}
                    <select value={selectedPosition} onChange={(event) => setSelectedPosition(Number(event.target.value))}>
                      {draft.positions.map((position, index) => <option key={index} value={index}>{index + 1}. {position.label || t('Posição sem nome', 'Unnamed position')}</option>)}
                    </select>
                  </label>
                  <label>{t('Músico associado', 'Assigned musician')}
                    <select value={active.member_id ?? ''} onChange={(event) => linkMusician(Number(event.target.value) || null)}>
                      <option value="">{t('Sem músico associado', 'No musician assigned')}</option>
                      {active.member_id && !musicians.some((entry) => entry.id === active.member_id) ? <option value={active.member_id}>{active.label} · {t('Indisponível', 'Unavailable')}</option> : null}
                      {musicians.map((entry) => <option key={entry.id} value={entry.id}
                        disabled={draft.positions.some((position, index) => index !== selectedPosition && position.member_id === entry.id)}>
                        {entry.name}{entry.sections[0] ? ` · ${musicLabel(entry.sections[0])}` : ''}
                      </option>)}
                    </select>
                  </label>
                  <label>{t('Naipe da posição', 'Position section')}<input list="stage-section-options" value={active.section ?? ''} maxLength={120}
                    onChange={(event) => updatePosition(selectedPosition, { section: event.target.value || null })} />
                    <datalist id="stage-section-options">{sections.map((section) => <option key={section} value={section} />)}</datalist>
                  </label>
                  <label>{t('Legenda da posição', 'Position label')}<input maxLength={120} value={active.label} onChange={(event) => updatePosition(selectedPosition, { label: event.target.value })} /></label>
                  <div className="stage-coordinate-inputs">
                    <label>{t('Horizontal (%)', 'Horizontal (%)')}<input type="number" min={0} max={100} step={1} value={active.x} onChange={(event) => updatePosition(selectedPosition, { x: coordinate(Number(event.target.value)) })} /></label>
                    <label>{t('Vertical (%)', 'Vertical (%)')}<input type="number" min={0} max={100} step={1} value={active.y} onChange={(event) => updatePosition(selectedPosition, { y: coordinate(Number(event.target.value)) })} /></label>
                  </div>
                  <button type="button" className="tiny danger icon-action" disabled={saving} onClick={() => {
                    setPositions(draft.positions.filter((_, index) => index !== selectedPosition));
                    setSelectedPosition(Math.max(0, selectedPosition - 1));
                  }}><UiIcon name="trash" size={17} />{t('Remover posição', 'Remove position')}</button>
                </>
              ) : null}
            </aside>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
