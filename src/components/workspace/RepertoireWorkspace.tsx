import { t } from '../../language';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { UiIcon } from '../common/UiIcon';
import { ViewModeToggle, type ListingViewMode } from '../common/ViewModeToggle';
import type { RepertoirePieceSummary } from '../../types';
import type { EventPieceForm, PieceForm } from '../../ui-types';

type RepertoireMode = 'list' | 'detail' | 'edit' | 'create' | 'edit-piece';

type RepertoireWorkspaceProps = {
  renderPieceFiles: (pieceId: number) => React.ReactNode;
  selectedGroupId: number | null;
  canManage: boolean;
  selectedEventId: number | null;
  pieces: RepertoirePieceSummary[];
  eventPieces: RepertoirePieceSummary[];
  pieceForm: PieceForm;
  eventPieceForm: EventPieceForm;
  loadingPieces: boolean;
  loadingEventPieces: boolean;
  submittingPiece: boolean;
  submittingEventPiece: boolean;
  setPieceForm: (updater: (previous: PieceForm) => PieceForm) => void;
  setEventPieceForm: (updater: (previous: EventPieceForm) => EventPieceForm) => void;
  onRefresh: () => void;
  onCreatePiece: (event: FormEvent, pieceId?: number) => Promise<boolean>;
  onDeletePiece: (pieceId: number) => Promise<boolean>;
  onAttachPiece: (event: FormEvent) => Promise<boolean>;
  onDetachPiece: (pieceId: number) => void | Promise<void>;
};

export function RepertoireWorkspace({
  renderPieceFiles,
  selectedGroupId,
  canManage,
  selectedEventId,
  pieces,
  eventPieces,
  pieceForm,
  eventPieceForm,
  loadingPieces,
  loadingEventPieces,
  submittingPiece,
  submittingEventPiece,
  setPieceForm,
  setEventPieceForm,
  onRefresh,
  onCreatePiece,
  onDeletePiece,
  onAttachPiece,
  onDetachPiece,
}: RepertoireWorkspaceProps) {
  const [mode, setMode] = useState<RepertoireMode>('list');
  const [listingView, setListingView] = useState<ListingViewMode>('table');
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);

  const selectedPiece = useMemo(
    () => pieces.find((piece) => piece.id === selectedPieceId) ?? null,
    [pieces, selectedPieceId]
  );

  const editing = mode === 'edit-piece';

  function editPiece(piece: RepertoirePieceSummary) {
    setPieceForm(() => ({
      title: piece.title,
      composer: piece.composer ?? '',
      arranger: piece.arranger ?? '',
      difficultyLevel: piece.difficulty_level ?? '',
      notes: piece.notes ?? '',
    }));
    setMode('edit-piece');
  }

  useEffect(() => {
    setSelectedPieceId((previous) => {
      if (previous && pieces.some((piece) => piece.id === previous)) {
        return previous;
      }

      return pieces[0]?.id ?? null;
    });
  }, [pieces]);

  useEffect(() => {
    if (!selectedPiece && mode !== 'create' && mode !== 'edit') {
      setMode('list');
    }
  }, [mode, selectedPiece]);

  return (
    <section className="workspace-panel admin-panel">
      <header className="workspace-head admin-head">
        <div>
          <h2>{t("Repertório", "Repertoire")}</h2>
          <p className="subtitle">{t("Listagem de peças, detalhe e associacao ao evento selecionado.", "Browse pieces and add them to the selected event.")}</p>
        </div>

        <div className="summary-row">
          {mode === 'list' ? (
            <>
              <button
                className="ghost icon-action"
                type="button"
                onClick={onRefresh}
                disabled={!selectedGroupId}
              >
                <UiIcon name="refresh" />
                <span>{loadingPieces ? t("A atualizar...", "Refreshing…") : t("Atualizar", "Refresh")}</span>
              </button>
              <button
                className="ghost icon-action"
                type="button"
                onClick={() => setMode('create')}
                disabled={!selectedGroupId || !canManage}
              >
                <UiIcon name="plus" />
                <span>{t("Nova peça", "New piece")}</span>
              </button>
              <button
                className="ghost icon-action"
                type="button"
                onClick={() => setMode('edit')}
                disabled={!selectedEventId || !canManage}
              >
                <UiIcon name="edit" />
                <span>{t("Associar ao evento", "Add to event")}</span>
              </button>
            </>
          ) : mode === 'detail' ? (
            <>
              <button className="ghost icon-action" type="button" onClick={() => setMode('list')}>
                <UiIcon name="arrow-left" />
                <span>{t("Voltar a lista", "Back to list")}</span>
              </button>
              <button
                className="ghost icon-action"
                type="button"
                onClick={() => setMode('edit')}
                disabled={!selectedEventId || !canManage}
              >
                <UiIcon name="edit" />
                <span>{t("Associar ao evento", "Add to event")}</span>
              </button>
              {canManage && selectedPiece ? (
                <>
                  <button type="button" className="ghost" onClick={() => editPiece(selectedPiece)}>{t("Editar peça", "Edit piece")}</button>
                  <button type="button" className="tiny danger" disabled={submittingPiece} onClick={async () => {
                    if (await onDeletePiece(selectedPiece.id)) {
                      setMode('list');
                    }
                  }}>{t("Eliminar peça", "Delete piece")}</button>
                </>
              ) : null}
            </>
          ) : mode === 'edit' || editing ? (
            <button className="ghost icon-action" type="button" onClick={() => setMode('detail')}>
              <UiIcon name="arrow-left" />
              <span>{t("Voltar ao detalhe", "Back to details")}</span>
            </button>
          ) : (
            <button className="ghost icon-action" type="button" onClick={() => setMode('list')}>
              <UiIcon name="arrow-left" />
              <span>{t("Voltar a lista", "Back to list")}</span>
            </button>
          )}
        </div>
      </header>

      {mode === 'list' ? (
        !selectedGroupId ? (
          <article className="workspace-card">
            <p className="muted">{t("Seleciona um grupo para gerir repertório.", "Select an ensemble to manage its repertoire.")}</p>
          </article>
        ) : pieces.length === 0 ? (
          <article className="workspace-card">
            <p className="muted">{t("Sem peças no repertório.", "No pieces in the library.")}</p>
          </article>
        ) : (
          <article className="workspace-card listing-shell">
            <div className="listing-head">
              <h3>{t("Listagem", "List")}</h3>
              <ViewModeToggle value={listingView} onChange={setListingView} />
            </div>

            {listingView === 'table' ? (
              <div className="table-wrapper entity-table-wrapper">
                <table className="entity-table">
                  <thead>
                    <tr>
                      <th>{t("Título", "Title")}</th>
                      <th>{t("Compositor", "Composer")}</th>
                      <th>{t("Dificuldade", "Difficulty")}</th>
                      <th>{t("Acoes", "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pieces.map((piece) => (
                      <tr key={piece.id} className={selectedPieceId === piece.id ? 'selected' : ''}>
                        <td>
                          <div className="table-primary">
                            <strong>{piece.title}</strong>
                            <small>{piece.arranger ?? 'Sem arranjador'}</small>
                          </div>
                        </td>
                        <td>{piece.composer ?? t('Sem compositor', 'No composer')}</td>
                        <td>{piece.difficulty_level ?? t('Não definida', 'Not specified')}</td>
                        <td className="cell-actions">
                          <button
                            type="button"
                            className="tiny icon-only"
                            onClick={() => {
                              setSelectedPieceId(piece.id);
                              setMode('detail');
                            }}
                            aria-label={`Ver detalhe da peca ${piece.title}`}
                          >
                            <UiIcon name="eye" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="entity-card-grid">
                {pieces.map((piece) => (
                  <article
                    key={piece.id}
                    className={`entity-card${selectedPieceId === piece.id ? ' selected' : ''}`}
                  >
                    <div>
                      <h4>{piece.title}</h4>
                      <p>{piece.composer ?? t('Sem compositor', 'No composer')}</p>
                      <p>{piece.difficulty_level ?? t('Não definida', 'Not specified')}</p>
                    </div>
                    <div className="entity-card-actions">
                      <button
                        type="button"
                        className="tiny icon-action"
                        onClick={() => {
                          setSelectedPieceId(piece.id);
                          setMode('detail');
                        }}
                      >
                        <UiIcon name="eye" />
                        <span>{t("Detalhe", "Details")}</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </article>
        )
      ) : null}

      {mode === 'detail' ? (
        <article className="workspace-card">
          {!selectedPiece ? (
            <p className="muted">{t("Seleciona uma peça na listagem.", "Select a piece from the list.")}</p>
          ) : (
            <div className="detail-list">
              <p>
                <strong>{t("Título:", "Title:")}</strong> {selectedPiece.title}
              </p>
              <p>
                <strong>{t("Compositor:", "Composer:")}</strong> {selectedPiece.composer ?? t('Não definido', 'Not specified')}
              </p>
              <p>
                <strong>{t("Arranjador:", "Arranger:")}</strong> {selectedPiece.arranger ?? t('Não definido', 'Not specified')}
              </p>
              <p>
                <strong>{t("Dificuldade:", "Difficulty:")}</strong> {selectedPiece.difficulty_level ?? t('Não definida', 'Not specified')}
              </p>
              <p>
                <strong>{t("Notas:", "Notes:")}</strong> {selectedPiece.notes ?? t('Sem notas', 'No notes')}
              </p>
              {renderPieceFiles(selectedPiece.id)}

              <div className="summary-card">
                <h4>{t("Peças no evento selecionado", "Pieces for this event")}</h4>
                {!selectedEventId ? (
                  <p className="muted">{t("Seleciona um evento para ver associações.", "Select an event to view its repertoire.")}</p>
                ) : loadingEventPieces ? (
                  <p className="muted">{t("A carregar peças do evento...", "Loading the event repertoire…")}</p>
                ) : eventPieces.length === 0 ? (
                  <p className="muted">{t("Evento sem peças associadas.", "No repertoire has been added to this event.")}</p>
                ) : (
                  <ul className="entity-list compact">
                    {eventPieces.map((piece) => (
                      <li key={piece.id}>
                        <div className="entity-inline">
                          <div>
                            <strong>{piece.title}</strong>
                            <small>
                              {t("Ordem:", "Order:")} {piece.pivot?.piece_order ?? '-'}
                              {piece.pivot?.notes ? ` | ${piece.pivot.notes}` : ''}
                            </small>
                          </div>
                          <button
                            type="button"
                            className="tiny icon-action"
                            onClick={() => onDetachPiece(piece.id)}
                            disabled={!canManage}
                          >
                            <UiIcon name="trash" />
                            <span>{t("Remover", "Remove")}</span>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </article>
      ) : null}

      {mode === 'edit' ? (
        <article className="workspace-card">
          <form
            className="form"
            onSubmit={async (event) => {
              const attached = await onAttachPiece(event);
              if (attached) {
                setMode('detail');
              }
            }}
          >
            <h3>{t("Associar peça ao evento", "Add piece to event")}</h3>
            <label>
              {t("Peça", "Piece")}
              <select
                required
                value={eventPieceForm.repertoirePieceId}
                onChange={(event) =>
                  setEventPieceForm((previous) => ({
                    ...previous,
                    repertoirePieceId: event.target.value,
                  }))
                }
                disabled={!selectedEventId}
              >
                <option value="">{t("Selecionar peça", "Select a piece")}</option>
                {pieces.map((piece) => (
                  <option key={piece.id} value={piece.id}>
                    {piece.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              {t("Ordem", "Order")}
              <input
                type="number"
                min={1}
                value={eventPieceForm.pieceOrder}
                onChange={(event) =>
                  setEventPieceForm((previous) => ({
                    ...previous,
                    pieceOrder: event.target.value,
                  }))
                }
                disabled={!selectedEventId}
              />
            </label>

            <label>
              {t("Notas", "Notes")}
              <textarea
                rows={3}
                value={eventPieceForm.notes}
                onChange={(event) =>
                  setEventPieceForm((previous) => ({ ...previous, notes: event.target.value }))
                }
                disabled={!selectedEventId}
              />
            </label>

            <button
              type="submit"
              className="icon-action"
              disabled={submittingEventPiece || !selectedEventId || !eventPieceForm.repertoirePieceId}
            >
              <UiIcon name="check" />
              <span>{submittingEventPiece ? t("A associar...", "Adding…") : t("Associar ao evento", "Add to event")}</span>
            </button>
          </form>
        </article>
      ) : null}

      {canManage && (mode === 'create' || (editing && selectedPiece)) ? (
        <article className="workspace-card">
          <form
            className="form"
            onSubmit={async (event) => {
              const created = await onCreatePiece(event, editing ? selectedPiece?.id : undefined);
              if (created) {
                setMode(editing ? 'detail' : 'list');
              }
            }}
          >
            <h3>{editing ? t("Editar peça", "Edit piece") : t("Nova peça", "New piece")}</h3>
            <label>
              {t("Título", "Title")}
              <input
                type="text"
                required
                value={pieceForm.title}
                onChange={(event) =>
                  setPieceForm((previous) => ({ ...previous, title: event.target.value }))
                }
                disabled={!selectedGroupId}
              />
            </label>

            <label>
              {t("Compositor", "Composer")}
              <input
                type="text"
                value={pieceForm.composer}
                onChange={(event) =>
                  setPieceForm((previous) => ({ ...previous, composer: event.target.value }))
                }
                disabled={!selectedGroupId}
              />
            </label>

            <label>
              {t("Arranjador", "Arranger")}
              <input
                type="text"
                value={pieceForm.arranger}
                onChange={(event) =>
                  setPieceForm((previous) => ({ ...previous, arranger: event.target.value }))
                }
                disabled={!selectedGroupId}
              />
            </label>

            <label>
              {t("Dificuldade", "Difficulty")}
              <input
                type="text"
                value={pieceForm.difficultyLevel}
                onChange={(event) =>
                  setPieceForm((previous) => ({ ...previous, difficultyLevel: event.target.value }))
                }
                disabled={!selectedGroupId}
              />
            </label>

            <label>
              {t("Notas", "Notes")}
              <textarea
                rows={3}
                value={pieceForm.notes}
                onChange={(event) =>
                  setPieceForm((previous) => ({ ...previous, notes: event.target.value }))
                }
                disabled={!selectedGroupId}
              />
            </label>

            <button type="submit" className="icon-action" disabled={submittingPiece || !selectedGroupId}>
              <UiIcon name="plus" />
              <span>{submittingPiece ? t("A guardar...", "Saving…") : editing ? t("Guardar alterações", "Save changes") : t("Criar peça", "Create piece")}</span>
            </button>
          </form>
        </article>
      ) : null}
    </section>
  );
}
