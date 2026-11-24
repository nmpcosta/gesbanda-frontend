import { t } from '../../language';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { downloadApiFile } from '../../api';
import { instrumentGroups, musicLabel } from '../../musicCatalog';
import { ScoreInstrumentSuggestion } from './ScoreInstrumentSuggestion';
import { UiIcon } from '../common/UiIcon';
import { ViewModeToggle, type ListingViewMode } from '../common/ViewModeToggle';
import type {
  EventSummary,
  GroupAssetSummary,
  GroupDocumentSummary,
  RepertoirePieceSummary,
} from '../../types';
import type { AssetForm, DocumentForm } from '../../ui-types';

type FileSelection =
  | { type: 'asset'; id: number }
  | { type: 'document'; id: number }
  | null;

type FilesMode = 'list' | 'detail' | 'create' | 'edit';

type FilesWorkspaceProps = {
  selectedGroupId: number | null;
  token: string | null;
  canManage: boolean;
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
  onRefresh: () => void;
  onUploadAsset: (event: FormEvent, itemId?: number) => Promise<boolean>;
  onDeleteFile: (type: NonNullable<FileSelection>['type'], itemId: number) => Promise<boolean>;
  onUploadDocument: (event: FormEvent, itemId?: number) => Promise<boolean>;
};

type LibraryRow = {
  key: string;
  type: 'asset' | 'document';
  id: number;
  title: string;
  category: string;
  detail: string;
};

export function FilesWorkspace({
  selectedGroupId,
  token,
  canManage,
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
  onRefresh,
  onUploadAsset,
  onUploadDocument,
  onDeleteFile,
}: FilesWorkspaceProps) {
  const [mode, setMode] = useState<FilesMode>('list');
  const [listingView, setListingView] = useState<ListingViewMode>('table');
  const [selection, setSelection] = useState<FileSelection>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const selectedAsset = useMemo(() => {
    if (!selection || selection.type !== 'asset') {
      return null;
    }

    return assets.find((asset) => asset.id === selection.id) ?? null;
  }, [assets, selection]);

  const selectedDocument = useMemo(() => {
    if (!selection || selection.type !== 'document') {
      return null;
    }

    return documents.find((documentItem) => documentItem.id === selection.id) ?? null;
  }, [documents, selection]);

  const editing = mode === 'edit';

  async function downloadFile(type: 'assets' | 'documents', id: number, title: string) {
    if (!token || !selectedGroupId) return;

    setDownloadError(null);
    try {
      await downloadApiFile(`/groups/${selectedGroupId}/${type}/${id}/download`, token, title, true);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : t('Não foi possível descarregar o ficheiro.', 'Could not download the file.'));
    }
  }

  useEffect(() => {
    setDownloadError(null);
  }, [selection]);

  function editFile() {
    if (selectedAsset) {
      setAssetForm(() => ({
        title: selectedAsset.title,
        assetType: selectedAsset.asset_type,
        instrument: selectedAsset.instrument ?? '',
        eventId: selectedAsset.event_id?.toString() ?? '',
        repertoirePieceId: selectedAsset.repertoire_piece_id?.toString() ?? '',
        file: null,
      }));
    } else if (selectedDocument) {
      setDocumentForm(() => ({
        title: selectedDocument.title,
        documentType: selectedDocument.document_type ?? '',
        category: selectedDocument.category ?? '',
        relevance: String(selectedDocument.relevance),
        file: null,
      }));
    }

    setMode('edit');
  }

  const libraryRows = useMemo<LibraryRow[]>(() => {
    return [
      ...assets.map((asset) => ({
        key: `asset-${asset.id}`,
        type: 'asset' as const,
        id: asset.id,
        title: asset.title,
        category: t("Partitura / Anexo", "Score or attachment"),
        detail: asset.asset_type,
      })),
      ...documents.map((documentItem) => ({
        key: `document-${documentItem.id}`,
        type: 'document' as const,
        id: documentItem.id,
        title: documentItem.title,
        category: t("Documento", "Document"),
        detail: documentItem.document_type ?? 'sem tipo',
      })),
    ];
  }, [assets, documents]);

  useEffect(() => {
    setSelection((previous) => {
      if (previous?.type === 'asset' && assets.some((asset) => asset.id === previous.id)) {
        return previous;
      }

      if (
        previous?.type === 'document' &&
        documents.some((documentItem) => documentItem.id === previous.id)
      ) {
        return previous;
      }

      if (assets[0]) {
        return { type: 'asset', id: assets[0].id };
      }

      if (documents[0]) {
        return { type: 'document', id: documents[0].id };
      }

      return null;
    });
  }, [assets, documents]);

  useEffect(() => {
    if (!selection && mode === 'detail') {
      setMode('list');
    }
  }, [mode, selection]);

  return (
    <section className="workspace-panel admin-panel">
      <header className="workspace-head admin-head">
        <div>
          <h2>{t("Ficheiros", "Files")}</h2>
          <p className="subtitle">{t("Biblioteca de partituras e documentos em formato admin list/detail.", "Scores, attachments and documents.")}</p>
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
                <span>{loadingAssets || loadingDocuments ? t("A atualizar...", "Refreshing…") : t("Atualizar", "Refresh")}</span>
              </button>
              <button
                className="ghost icon-action"
                type="button"
                onClick={() => setMode('create')}
                disabled={!selectedGroupId || !canManage}
              >
                <UiIcon name="plus" />
                <span>{t("Carregar ficheiro", "Upload file")}</span>
              </button>
            </>
          ) : (
            <button className="ghost icon-action" type="button" onClick={() => setMode('list')}>
              <UiIcon name="arrow-left" />
              <span>{t("Voltar a lista", "Back to list")}</span>
            </button>
          )}
          {mode === 'detail' && canManage && selection && (selectedAsset || selectedDocument) ? (
            <>
              <button type="button" className="ghost" onClick={editFile}>{t("Editar", "Edit")}</button>
              <button type="button" className="tiny danger" disabled={submittingAsset || submittingDocument} onClick={async () => {
                if (await onDeleteFile(selection.type, selection.id)) {
                  setMode('list');
                }
              }}>{t("Eliminar", "Delete")}</button>
            </>
          ) : null}
        </div>
      </header>

      {mode === 'list' ? (
        !selectedGroupId ? (
          <article className="workspace-card">
            <p className="muted">{t("Seleciona um grupo para gerir ficheiros.", "Select an ensemble to manage its files.")}</p>
          </article>
        ) : libraryRows.length === 0 ? (
          <article className="workspace-card">
            <p className="muted">{t("Sem ficheiros disponiveis.", "No files available.")}</p>
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
                      <th>{t("Titulo", "Title")}</th>
                      <th>{t("Categoria", "Category")}</th>
                      <th>{t("Tipo", "Type")}</th>
                      <th>{t("Acoes", "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {libraryRows.map((row) => (
                      <tr
                        key={row.key}
                        className={selection?.type === row.type && selection.id === row.id ? 'selected' : ''}
                      >
                        <td>
                          <div className="table-primary">
                            <strong>{row.title}</strong>
                            <small>{row.type === 'asset' ? 'Asset' : t("Documento", "Document")}</small>
                          </div>
                        </td>
                        <td>{row.category}</td>
                        <td>{row.detail}</td>
                        <td className="cell-actions">
                          <button
                            type="button"
                            className="tiny icon-only"
                            onClick={() => {
                              setSelection({ type: row.type, id: row.id });
                              setMode('detail');
                            }}
                            aria-label={`Ver detalhe do ficheiro ${row.title}`}
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
                {libraryRows.map((row) => (
                  <article
                    key={row.key}
                    className={`entity-card${selection?.type === row.type && selection.id === row.id ? ' selected' : ''}`}
                  >
                    <div>
                      <h4>{row.title}</h4>
                      <p>{row.category}</p>
                      <p>{row.detail}</p>
                    </div>
                    <div className="entity-card-actions">
                      <button
                        type="button"
                        className="tiny icon-action"
                        onClick={() => {
                          setSelection({ type: row.type, id: row.id });
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
          {!selection ? (
            <p className="muted">{t("Seleciona um ficheiro na listagem.", "Select a file from the list.")}</p>
          ) : selectedAsset ? (
            <div className="detail-list">
              <p>
                <strong>{t("Titulo:", "Title:")}</strong> {selectedAsset.title}
              </p>
              <p>
                <strong>{t("Tipo:", "Type:")}</strong> {selectedAsset.asset_type}
              </p>
              <p>
                <strong>{t("Instrumento:", "Instrument:")}</strong> {selectedAsset.instrument ?? 'Geral'}
              </p>
              <button className="tiny ghost icon-action" type="button" onClick={() => void downloadFile('assets', selectedAsset.id, selectedAsset.title)}>
                <UiIcon name="open" />
                <span>{t("Descarregar ficheiro", "Download file")}</span>
              </button>
              {downloadError ? <p role="alert">{downloadError}</p> : null}
            </div>
          ) : selectedDocument ? (
            <div className="detail-list">
              <p>
                <strong>{t("Titulo:", "Title:")}</strong> {selectedDocument.title}
              </p>
              <p>
                <strong>{t("Tipo:", "Type:")}</strong> {selectedDocument.document_type ?? 'documento'}
              </p>
              <p>
                <strong>{t("Categoria:", "Category:")}</strong> {selectedDocument.category ?? 'Sem categoria'}
              </p>
              <p>
                <strong>{t("Relevancia:", "Relevance:")}</strong> {selectedDocument.relevance}
              </p>
              <button className="tiny ghost icon-action" type="button" onClick={() => void downloadFile('documents', selectedDocument.id, selectedDocument.title)}>
                <UiIcon name="open" />
                <span>{t("Descarregar ficheiro", "Download file")}</span>
              </button>
              {downloadError ? <p role="alert">{downloadError}</p> : null}
            </div>
          ) : (
            <p className="muted">{t("O item selecionado ja nao existe.", "The selected item no longer exists.")}</p>
          )}
        </article>
      ) : null}

      {canManage && (mode === 'create' || editing) ? (
        <article className="workspace-card">
          <div className="edit-stack">
            {!editing || selectedAsset ? <form
              className="form"
              onSubmit={async (event) => {
                const uploaded = await onUploadAsset(event, editing ? selectedAsset?.id : undefined);
                if (uploaded) {
                  setMode(editing ? 'detail' : 'list');
                }
              }}
            >
              <h3>{editing ? t("Editar partitura ou anexo", "Edit score or attachment") : t("Carregar partitura ou anexo", "Upload score or attachment")}</h3>
              <label>
                {t("Titulo", "Title")}
                <input
                  type="text"
                  required
                  value={assetForm.title}
                  onChange={(event) =>
                    setAssetForm((previous) => ({ ...previous, title: event.target.value }))
                  }
                  disabled={!selectedGroupId}
                />
              </label>

              <label>
                {t("Tipo", "Type")}
                <select
                  value={assetForm.assetType}
                  onChange={(event) =>
                    setAssetForm((previous) => ({ ...previous, assetType: event.target.value }))
                  }
                  disabled={!selectedGroupId}
                >
                  <option value="score">{t("Partitura", "Score")}</option>
                  <option value="audio">{t("Audio", "Audio")}</option>
                  <option value="document">{t("Documento", "Document")}</option>
                  <option value="other">{t("Outro", "Other")}</option>
                </select>
              </label>

              <label>
                {t("Instrumento", "Instrument")}
                <input
                  type="text"
                  list="asset-instrument-options"
                  value={assetForm.instrument}
                  onChange={(event) =>
                    setAssetForm((previous) => ({ ...previous, instrument: event.target.value }))
                  }
                  disabled={!selectedGroupId}
                />
              </label>

              <datalist id="asset-instrument-options">
                {instrumentGroups.flatMap((group) => group.options.map(([instrument]) => <option key={instrument} value={instrument}>{musicLabel(instrument)}</option>))}
              </datalist>

              <label>
                {t("Evento", "Event")}
                <select
                  value={assetForm.eventId}
                  onChange={(event) =>
                    setAssetForm((previous) => ({ ...previous, eventId: event.target.value }))
                  }
                  disabled={!selectedGroupId}
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
                {t("Peca", "Piece")}
                <select
                  value={assetForm.repertoirePieceId}
                  onChange={(event) =>
                    setAssetForm((previous) => ({
                      ...previous,
                      repertoirePieceId: event.target.value,
                    }))
                  }
                  disabled={!selectedGroupId}
                >
                  <option value="">{t("Sem peca", "No piece")}</option>
                  {pieces.map((piece) => (
                    <option key={piece.id} value={piece.id}>
                      {piece.title}
                    </option>
                  ))}
                </select>
              </label>

              {!editing ? (
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
                    disabled={!selectedGroupId}
                  />
                </label>
              ) : null}

              {!editing && token && selectedGroupId && assetForm.file ? (
                <ScoreInstrumentSuggestion
                  key={`${assetForm.file.name}-${assetForm.file.lastModified}`}
                  file={assetForm.file}
                  token={token}
                  groupId={selectedGroupId}
                  onSelect={(instrument) => setAssetForm((previous) => ({ ...previous, instrument }))}
                />
              ) : null}

              <button type="submit" className="icon-action" disabled={submittingAsset || !selectedGroupId}>
                <UiIcon name="plus" />
                <span>{submittingAsset ? t("A guardar...", "Saving…") : editing ? t("Guardar alterações", "Save changes") : t("Carregar partitura ou anexo", "Upload score or attachment")}</span>
              </button>
            </form> : null}

            {!editing || selectedDocument ? <form
              className="form"
              onSubmit={async (event) => {
                const uploaded = await onUploadDocument(event, editing ? selectedDocument?.id : undefined);
                if (uploaded) {
                  setMode(editing ? 'detail' : 'list');
                }
              }}
            >
              <h3>{editing ? t("Editar documento", "Edit document") : t("Carregar documento", "Upload document")}</h3>
              <label>
                {t("Titulo", "Title")}
                <input
                  type="text"
                  required
                  value={documentForm.title}
                  onChange={(event) =>
                    setDocumentForm((previous) => ({ ...previous, title: event.target.value }))
                  }
                  disabled={!selectedGroupId}
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
                  disabled={!selectedGroupId}
                />
              </label>

              <label>
                {t("Categoria", "Category")}
                <input
                  type="text"
                  value={documentForm.category}
                  onChange={(event) =>
                    setDocumentForm((previous) => ({ ...previous, category: event.target.value }))
                  }
                  disabled={!selectedGroupId}
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
                    setDocumentForm((previous) => ({ ...previous, relevance: event.target.value }))
                  }
                  disabled={!selectedGroupId}
                />
              </label>

              {!editing ? (
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
                    disabled={!selectedGroupId}
                  />
                </label>
              ) : null}

              <button type="submit" className="icon-action" disabled={submittingDocument || !selectedGroupId}>
                <UiIcon name="plus" />
                <span>{submittingDocument ? t("A guardar...", "Saving…") : editing ? t("Guardar alterações", "Save changes") : t("Carregar documento", "Upload document")}</span>
              </button>
            </form> : null}
          </div>
        </article>
      ) : null}
    </section>
  );
}
