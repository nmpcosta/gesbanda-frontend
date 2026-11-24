export type GroupAssetSummary = {
  id: number;
  group_id: number;
  uploaded_by_user_id: number | null;
  repertoire_piece_id: number | null;
  event_id: number | null;
  asset_type: string;
  title: string;
  file_url: string;
  instrument: string | null;
  meta: {
    path?: string;
    original_name?: string;
    mime?: string;
    size?: number;
  } | null;
};

export type GroupAssetsResponse = {
  data: GroupAssetSummary[];
};

export type GroupAssetResponse = {
  data: GroupAssetSummary;
};

export type GroupDocumentSummary = {
  id: number;
  group_id: number;
  uploaded_by_user_id: number | null;
  title: string;
  document_type: string | null;
  category: string | null;
  file_url: string;
  relevance: number;
  published_at: string | null;
};

export type GroupDocumentsResponse = {
  data: GroupDocumentSummary[];
};

export type GroupDocumentResponse = {
  data: GroupDocumentSummary;
};
