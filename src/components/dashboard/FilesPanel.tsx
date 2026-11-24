import { t } from '../../language';
﻿import type { FormEvent } from 'react';
import type {
  EventSummary,
  GroupAssetSummary,
  GroupDocumentSummary,
  RepertoirePieceSummary,
} from '../../types';
import type { AssetForm, DocumentForm } from '../../ui-types';

type FilesPanelProps = {
  selectedGroupId: number | null;
  assets: GroupAssetSummary[];
  documents: GroupDocumentSummary[];
  events: EventSummary[];
  pieces: RepertoirePieceSummary[];
  assetForm: AssetForm;
  documentForm: DocumentForm;
  submittingAsset: boolean;
  submittingDocument: boolean;
  loadingAssets: boolean;
  loadingDocuments: boolean;
  setAssetForm: (updater: (previous: AssetForm) => AssetForm) => void;
  setDocumentForm: (updater: (previous: DocumentForm) => DocumentForm) => void;
  onUploadAsset: (event: FormEvent) => void;
  onUploadDocument: (event: FormEvent) => void;
  onRefresh: () => void;
};

export function FilesPanel({
  selectedGroupId,
  assets,
  documents,
  events,
  pieces,
  assetForm,
  documentForm,
  submittingAsset,
  submittingDocument,
  loadingAssets,
  loadingDocuments,
  setAssetForm,
  setDocumentForm,
  onUploadAsset,
  onUploadDocument,
  onRefresh,
}: FilesPanelProps) {
  return (
    <article className="module-panel full-width">
      <div className="groups-header">
        <h2>{t("Partituras e Documentos", "Scores and documents")}</h2>
        <button className="ghost" type="button" onClick={onRefresh} disabled={!selectedGroupId}>
          {loadingAssets || loadingDocuments ? t("A atualizar...", "Refreshing…") : t("Atualizar", "Refresh")}
        </button>
      </div>

      {!selectedGroupId ? (
        <p className="muted">{t("Seleciona um grupo para gerir ficheiros.", "Select an ensemble to manage its files.")}</p>
      ) : (
        <div className="files-grid">
          <section>
            <h3>{t("Partituras / Anexos", "Scores and attachments")}</h3>
            {assets.length === 0 ? (
              <p className="muted">{t("Sem partituras anexadas.", "No scores attached.")}</p>
            ) : (
              <ul className="groups-list">
                {assets.map((asset) => (
                  <li key={asset.id} className="group-item">
                    <div>
                      <strong>{asset.title}</strong>
                      <p>
                        {asset.asset_type}
                        {asset.instrument ? ` • ${asset.instrument}` : ' • geral'}
                      </p>
                    </div>
                    <a className="tiny link-btn" href={asset.file_url} target="_blank" rel="noreferrer">
                      {t("Abrir", "Open")}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <form className="form" onSubmit={onUploadAsset}>
              <label>
                {t("Titulo", "Title")}
                <input
                  type="text"
                  required
                  value={assetForm.title}
                  onChange={(event) =>
                    setAssetForm((previous) => ({ ...previous, title: event.target.value }))
                  }
                />
              </label>

              <label>
                {t("Tipo", "Type")}
                <select
                  value={assetForm.assetType}
                  onChange={(event) =>
                    setAssetForm((previous) => ({ ...previous, assetType: event.target.value }))
                  }
                >
                  <option value="score">{t("Partitura", "Score")}</option>
                  <option value="audio">{t("Audio", "Audio")}</option>
                  <option value="document">{t("Documento", "Document")}</option>
                  <option value="other">{t("Outro", "Other")}</option>
                </select>
              </label>

              <label>
                {t("Instrumento (opcional)", "Instrument (optional)")}
                <input
                  type="text"
                  value={assetForm.instrument}
                  onChange={(event) =>
                    setAssetForm((previous) => ({ ...previous, instrument: event.target.value }))
                  }
                />
              </label>

              <label>
                {t("Evento (opcional)", "Event (optional)")}
                <select
                  value={assetForm.eventId}
                  onChange={(event) =>
                    setAssetForm((previous) => ({ ...previous, eventId: event.target.value }))
                  }
                >
                  <option value="">{t("Sem evento", "No event")}</option>
                  {events.map((eventItem) => (
                    <option key={eventItem.id} value={eventItem.id}>
                      {eventItem.title}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {t("Peca (opcional)", "Piece (optional)")}
                <select
                  value={assetForm.repertoirePieceId}
                  onChange={(event) =>
                    setAssetForm((previous) => ({
                      ...previous,
                      repertoirePieceId: event.target.value,
                    }))
                  }
                >
                  <option value="">{t("Sem peca", "No piece")}</option>
                  {pieces.map((piece) => (
                    <option key={piece.id} value={piece.id}>
                      {piece.title}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                {t("Ficheiro", "File")}
                <input
                  type="file"
                  required
                  onChange={(event) =>
                    setAssetForm((previous) => ({
                      ...previous,
                      file: event.target.files?.[0] ?? null,
                    }))
                  }
                />
              </label>

              <button type="submit" disabled={submittingAsset}>
                {submittingAsset ? t("A carregar...", "Loading…") : t("Carregar partitura/anexo", "Upload score or attachment")}
              </button>
            </form>
          </section>

          <section>
            <h3>{t("Documentos", "Documents")}</h3>
            {documents.length === 0 ? (
              <p className="muted">{t("Sem documentos no repositorio.", "No documents in the archive.")}</p>
            ) : (
              <ul className="groups-list">
                {documents.map((documentItem) => (
                  <li key={documentItem.id} className="group-item">
                    <div>
                      <strong>{documentItem.title}</strong>
                      <p>
                        {documentItem.document_type ?? 'documento'}
                        {documentItem.category ? ` • ${documentItem.category}` : ''}
                      </p>
                    </div>
                    <a
                      className="tiny link-btn"
                      href={documentItem.file_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t("Abrir", "Open")}
                    </a>
                  </li>
                ))}
              </ul>
            )}

            <form className="form" onSubmit={onUploadDocument}>
              <label>
                {t("Titulo", "Title")}
                <input
                  type="text"
                  required
                  value={documentForm.title}
                  onChange={(event) =>
                    setDocumentForm((previous) => ({ ...previous, title: event.target.value }))
                  }
                />
              </label>

              <label>
                {t("Tipo", "Type")}
                <input
                  type="text"
                  value={documentForm.documentType}
                  onChange={(event) =>
                    setDocumentForm((previous) => ({
                      ...previous,
                      documentType: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                {t("Categoria", "Category")}
                <input
                  type="text"
                  value={documentForm.category}
                  onChange={(event) =>
                    setDocumentForm((previous) => ({
                      ...previous,
                      category: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                {t("Relevancia (0-10)", "Relevance (0–10)")}
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={documentForm.relevance}
                  onChange={(event) =>
                    setDocumentForm((previous) => ({
                      ...previous,
                      relevance: event.target.value,
                    }))
                  }
                />
              </label>

              <label>
                {t("Ficheiro", "File")}
                <input
                  type="file"
                  required
                  onChange={(event) =>
                    setDocumentForm((previous) => ({
                      ...previous,
                      file: event.target.files?.[0] ?? null,
                    }))
                  }
                />
              </label>

              <button type="submit" disabled={submittingDocument}>
                {submittingDocument ? t("A carregar...", "Loading…") : t("Carregar documento", "Upload document")}
              </button>
            </form>
          </section>
        </div>
      )}
    </article>
  );
}
