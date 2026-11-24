import { t } from '../../language';
﻿import type { FormEvent } from 'react';
import type { RepertoirePieceSummary } from '../../types';
import type { EventPieceForm, PieceForm } from '../../ui-types';

type RepertoirePanelProps = {
  selectedGroupId: number | null;
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
  onCreatePiece: (event: FormEvent) => void;
  onAttachPiece: (event: FormEvent) => void;
  onDetachPiece: (pieceId: number) => void;
};

export function RepertoirePanel({
  selectedGroupId,
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
  onAttachPiece,
  onDetachPiece,
}: RepertoirePanelProps) {
  return (
    <article className="module-panel full-width">
      <div className="groups-header">
        <h2>{t("Repertorio", "Repertoire")}</h2>
        <button
          className="ghost"
          type="button"
          onClick={onRefresh}
          disabled={loadingPieces || !selectedGroupId}
        >
          {loadingPieces ? t("A atualizar...", "Refreshing…") : t("Atualizar", "Refresh")}
        </button>
      </div>

      {!selectedGroupId ? (
        <p className="muted">{t("Seleciona um grupo para gerir repertorio.", "Select an ensemble to manage its repertoire.")}</p>
      ) : pieces.length === 0 ? (
        <p className="muted">{t("Sem pecas no repertorio.", "No pieces in the library.")}</p>
      ) : (
        <ul className="groups-list">
          {pieces.map((piece) => (
            <li key={piece.id} className="group-item">
              <div>
                <strong>{piece.title}</strong>
                <p>
                  {piece.composer ?? 'Sem compositor'}
                  {piece.arranger ? ` • Arr: ${piece.arranger}` : ''}
                  {piece.difficulty_level ? ` • ${piece.difficulty_level}` : ''}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3>{t("Nova peca", "New piece")}</h3>
      <form className="form" onSubmit={onCreatePiece}>
        <label>
          {t("Titulo", "Title")}
          <input
            type="text"
            required
            value={pieceForm.title}
            onChange={(event) =>
              setPieceForm((previous) => ({ ...previous, title: event.target.value }))
            }
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
          />
        </label>

        <label>
          {t("Dificuldade", "Difficulty")}
          <input
            type="text"
            value={pieceForm.difficultyLevel}
            onChange={(event) =>
              setPieceForm((previous) => ({
                ...previous,
                difficultyLevel: event.target.value,
              }))
            }
          />
        </label>

        <label>
          {t("Notas", "Notes")}
          <textarea
            rows={2}
            value={pieceForm.notes}
            onChange={(event) =>
              setPieceForm((previous) => ({ ...previous, notes: event.target.value }))
            }
          />
        </label>

        <button type="submit" disabled={submittingPiece || !selectedGroupId}>
          {submittingPiece ? t("A criar peca...", "Creating piece…") : t("Criar peca", "Create piece")}
        </button>
      </form>

      <h3>{t("Associar peca ao evento selecionado", "Add piece to selected event")}</h3>
      {!selectedEventId ? (
        <p className="muted">{t("Seleciona um evento para associar pecas.", "Select an event to add pieces.")}</p>
      ) : (
        <>
          <form className="form" onSubmit={onAttachPiece}>
            <label>
              {t("Peca", "Piece")}
              <select
                required
                value={eventPieceForm.repertoirePieceId}
                onChange={(event) =>
                  setEventPieceForm((previous) => ({
                    ...previous,
                    repertoirePieceId: event.target.value,
                  }))
                }
              >
                <option value="">{t("Selecionar peca", "Select a piece")}</option>
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
              />
            </label>

            <label>
              {t("Notas", "Notes")}
              <textarea
                rows={2}
                value={eventPieceForm.notes}
                onChange={(event) =>
                  setEventPieceForm((previous) => ({ ...previous, notes: event.target.value }))
                }
              />
            </label>

            <button
              type="submit"
              disabled={submittingEventPiece || !eventPieceForm.repertoirePieceId}
            >
              {submittingEventPiece ? t("A associar...", "Adding…") : t("Associar ao evento", "Add to event")}
            </button>
          </form>

          {loadingEventPieces ? (
            <p className="muted">{t("A carregar pecas do evento...", "Loading the event repertoire…")}</p>
          ) : eventPieces.length === 0 ? (
            <p className="muted">{t("Evento sem pecas associadas.", "No repertoire has been added to this event.")}</p>
          ) : (
            <ul className="groups-list">
              {eventPieces.map((piece) => (
                <li key={piece.id} className="group-item member-item">
                  <div>
                    <strong>{piece.title}</strong>
                    <p>
                      {t("Ordem:", "Order:")} {piece.pivot?.piece_order ?? '-'}
                      {piece.pivot?.notes ? ` • ${piece.pivot.notes}` : ''}
                    </p>
                  </div>
                  <button type="button" className="tiny" onClick={() => onDetachPiece(piece.id)}>
                    {t("Remover", "Remove")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </article>
  );
}
