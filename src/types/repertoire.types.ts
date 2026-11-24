export type RepertoirePieceSummary = {
  id: number;
  group_id: number;
  title: string;
  composer: string | null;
  arranger: string | null;
  duration_seconds: number | null;
  difficulty_level: string | null;
  notes: string | null;
  pivot?: {
    piece_order: number | null;
    notes: string | null;
  };
};

export type RepertoirePiecesResponse = {
  data: RepertoirePieceSummary[];
};

export type RepertoirePieceResponse = {
  data: RepertoirePieceSummary;
};

export type CreateRepertoirePieceInput = {
  title: string;
  composer?: string | null;
  arranger?: string | null;
  duration_seconds?: number;
  difficulty_level?: string | null;
  notes?: string | null;
};

export type AttachEventPieceInput = {
  repertoire_piece_id: number;
  piece_order?: number;
  notes?: string;
};
