import { t } from '../language';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { apiRequest } from '../api';
import {
  attachPieceToEvent,
  createRepertoirePiece,
  updateRepertoirePiece,
  detachPieceFromEvent,
  listEventPieces,
  listRepertoirePieces,
} from '../auth';
import type { RepertoirePieceSummary } from '../types';
import type { EventPieceForm, PieceForm } from '../ui-types';

type UseRepertoireDataOptions = {
  token: string | null;
  selectedGroupId: number | null;
  selectedEventId: number | null;
  setError: (message: string | null) => void;
  setSuccess: (message: string | null) => void;
};

const initialPieceForm: PieceForm = {
  title: '',
  composer: '',
  arranger: '',
  difficultyLevel: '',
  notes: '',
};

const initialEventPieceForm: EventPieceForm = {
  repertoirePieceId: '',
  pieceOrder: '',
  notes: '',
};

export function useRepertoireData({
  token,
  selectedGroupId,
  selectedEventId,
  setError,
  setSuccess,
}: UseRepertoireDataOptions) {
  const [pieces, setPieces] = useState<RepertoirePieceSummary[]>([]);
  const [eventPieces, setEventPieces] = useState<RepertoirePieceSummary[]>([]);
  const [loadedEventId, setLoadedEventId] = useState<number | null>(null);
  const currentEvent = useRef(selectedEventId);
  currentEvent.current = selectedEventId;
  const latestLoad = useRef(0);

  const [loadingPieces, setLoadingPieces] = useState<boolean>(false);
  const [loadingEventPieces, setLoadingEventPieces] = useState<boolean>(false);
  const [submittingPiece, setSubmittingPiece] = useState<boolean>(false);
  const [submittingEventPiece, setSubmittingEventPiece] = useState<boolean>(false);

  const [pieceForm, setPieceForm] = useState<PieceForm>(initialPieceForm);
  const [eventPieceForm, setEventPieceForm] = useState<EventPieceForm>(initialEventPieceForm);

  async function loadPieces(currentToken: string, groupId: number) {
    setLoadingPieces(true);

    try {
      const response = await listRepertoirePieces(currentToken, groupId);
      setPieces(response.data);
      setEventPieceForm((previous) => {
        if (
          previous.repertoirePieceId &&
          response.data.some((piece) => piece.id === Number(previous.repertoirePieceId))
        ) {
          return previous;
        }

        return {
          ...previous,
          repertoirePieceId: response.data[0] ? String(response.data[0].id) : '',
        };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Nao foi possivel carregar repertorio.", "Could not load the repertoire."));
    } finally {
      setLoadingPieces(false);
    }
  }

  async function loadEventPieces(currentToken: string, eventId: number) {
    if (eventId !== currentEvent.current) return;
    const request = ++latestLoad.current;
    setLoadingEventPieces(true);

    try {
      const response = await listEventPieces(currentToken, eventId);
      if (request !== latestLoad.current || eventId !== currentEvent.current) return;
      setEventPieces(response.data);
      setLoadedEventId(eventId);
    } catch (err) {
      if (request !== latestLoad.current || eventId !== currentEvent.current) return;
      setEventPieces([]);
      setLoadedEventId(eventId);
      setError(err instanceof Error ? err.message : t("Nao foi possivel carregar pecas do evento.", "Could not load the event repertoire."));
    } finally {
      if (request === latestLoad.current) setLoadingEventPieces(false);
    }
  }

  useEffect(() => {
    if (!token || !selectedGroupId) {
      setPieces([]);
      setEventPieces([]);
      return;
    }

    setEventPieces([]);
    loadPieces(token, selectedGroupId);
  }, [token, selectedGroupId]);

  useEffect(() => {
    if (!token || !selectedEventId) {
      setEventPieces([]);
      return;
    }

    loadEventPieces(token, selectedEventId);
  }, [token, selectedEventId]);

  async function handleCreatePieceSubmit(event: FormEvent, pieceId?: number): Promise<boolean> {
    event.preventDefault();

    if (!token || !selectedGroupId) {
      return false;
    }

    setSubmittingPiece(true);
    setError(null);
    setSuccess(null);

    try {
      const input = {
        title: pieceForm.title.trim(),
        composer: pieceForm.composer.trim() || null,
        arranger: pieceForm.arranger.trim() || null,
        difficulty_level: pieceForm.difficultyLevel.trim() || null,
        notes: pieceForm.notes.trim() || null,
      };

      if (pieceId) {
        await updateRepertoirePiece(token, selectedGroupId, pieceId, input);
        if (selectedEventId) {
          await loadEventPieces(token, selectedEventId);
        }
      } else {
        await createRepertoirePiece(token, selectedGroupId, input);
      }

      await loadPieces(token, selectedGroupId);
      setPieceForm(initialPieceForm);
      setSuccess(pieceId ? t("Peça atualizada.", "Piece updated.") : t("Peça adicionada ao repertório.", "Piece added to the repertoire."));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Não foi possível guardar a peça.", "Could not save the piece."));
      return false;
    } finally {
      setSubmittingPiece(false);
    }
  }

  async function handleAttachPieceSubmit(event: FormEvent): Promise<boolean> {
    event.preventDefault();

    if (!token || !selectedEventId || !eventPieceForm.repertoirePieceId) {
      return false;
    }

    setSubmittingEventPiece(true);
    setError(null);
    setSuccess(null);

    try {
      await attachPieceToEvent(token, selectedEventId, {
        repertoire_piece_id: Number(eventPieceForm.repertoirePieceId),
        piece_order: eventPieceForm.pieceOrder ? Number(eventPieceForm.pieceOrder) : undefined,
        notes: eventPieceForm.notes.trim() || undefined,
      });

      await loadEventPieces(token, selectedEventId);
      setEventPieceForm((previous) => ({
        ...previous,
        pieceOrder: '',
        notes: '',
      }));
      setSuccess(t("Peca associada ao evento.", "Piece added to the event."));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Falha ao associar peca ao evento.", "Could not add the piece to the event."));
      return false;
    } finally {
      setSubmittingEventPiece(false);
    }
  }

  async function handleDetachPiece(pieceId: number) {
    if (!token || !selectedEventId) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await detachPieceFromEvent(token, selectedEventId, pieceId);
      await loadEventPieces(token, selectedEventId);
      setSuccess(t("Peca removida do evento.", "Piece removed from the event."));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Falha ao remover peca do evento.", "Could not remove the piece from the event."));
    }
  }

  async function handleDeletePiece(pieceId: number): Promise<boolean> {
    if (!token || !selectedGroupId || !window.confirm(t("Eliminar esta peça e removê-la dos eventos associados?", "Delete the piece and remove it from linked events?"))) {
      return false;
    }

    setSubmittingPiece(true);
    setError(null);
    setSuccess(null);

    try {
      await apiRequest(`/groups/${selectedGroupId}/pieces/${pieceId}`, { method: 'DELETE' }, token);
      await loadPieces(token, selectedGroupId);
      if (selectedEventId) {
        await loadEventPieces(token, selectedEventId);
      }
      setSuccess(t("Peça eliminada.", "Piece deleted."));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Não foi possível eliminar a peça.", "Could not delete the piece."));
      return false;
    } finally {
      setSubmittingPiece(false);
    }
  }

  return {
    pieces,
    eventPieces: loadedEventId === selectedEventId ? eventPieces : [],
    loadingPieces,
    loadingEventPieces,
    submittingPiece,
    submittingEventPiece,
    pieceForm,
    setPieceForm,
    eventPieceForm,
    setEventPieceForm,
    loadPieces,
    loadEventPieces,
    handleCreatePieceSubmit,
    handleAttachPieceSubmit,
    handleDetachPiece,
    handleDeletePiece,
  };
}
