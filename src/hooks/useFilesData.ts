import { t } from '../language';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { apiRequest } from '../api';
import { listGroupAssets, listGroupDocuments, uploadGroupAsset, uploadGroupDocument } from '../auth';
import type { GroupAssetSummary, GroupDocumentSummary } from '../types';
import type { AssetForm, DocumentForm } from '../ui-types';

type UseFilesDataOptions = {
  token: string | null;
  selectedGroupId: number | null;
  setError: (message: string | null) => void;
  setSuccess: (message: string | null) => void;
};

const initialAssetForm: AssetForm = {
  title: '',
  assetType: 'score',
  instrument: '',
  eventId: '',
  repertoirePieceId: '',
  file: null,
};

const initialDocumentForm: DocumentForm = {
  title: '',
  documentType: '',
  category: '',
  relevance: '0',
  file: null,
};

export function useFilesData({ token, selectedGroupId, setError, setSuccess }: UseFilesDataOptions) {
  const current = useRef({ token, selectedGroupId });
  current.current = { token, selectedGroupId };
  const assetRequest = useRef(0);
  const documentRequest = useRef(0);
  function isCurrent(currentToken: string, groupId: number) {
    return current.current.token === currentToken && current.current.selectedGroupId === groupId;
  }
  const [assets, setAssets] = useState<GroupAssetSummary[]>([]);
  const [documents, setDocuments] = useState<GroupDocumentSummary[]>([]);

  const [loadingAssets, setLoadingAssets] = useState<boolean>(false);
  const [loadingDocuments, setLoadingDocuments] = useState<boolean>(false);
  const [submittingAsset, setSubmittingAsset] = useState<boolean>(false);
  const [submittingDocument, setSubmittingDocument] = useState<boolean>(false);

  const [assetForm, setAssetForm] = useState<AssetForm>(initialAssetForm);
  const [documentForm, setDocumentForm] = useState<DocumentForm>(initialDocumentForm);

  async function loadAssets(currentToken: string, groupId: number) {
    if (!isCurrent(currentToken, groupId)) return;
    const request = ++assetRequest.current;
    setLoadingAssets(true);

    try {
      const response = await listGroupAssets(currentToken, groupId);
      if (request === assetRequest.current && isCurrent(currentToken, groupId)) setAssets(response.data);
    } catch (err) {
      if (request !== assetRequest.current || !isCurrent(currentToken, groupId)) return;
      setError(err instanceof Error ? err.message : t("Nao foi possivel carregar partituras.", "Could not load the scores."));
    } finally {
      if (request === assetRequest.current) setLoadingAssets(false);
    }
  }

  async function loadDocuments(currentToken: string, groupId: number) {
    if (!isCurrent(currentToken, groupId)) return;
    const request = ++documentRequest.current;
    setLoadingDocuments(true);

    try {
      const response = await listGroupDocuments(currentToken, groupId);
      if (request === documentRequest.current && isCurrent(currentToken, groupId)) setDocuments(response.data);
    } catch (err) {
      if (request !== documentRequest.current || !isCurrent(currentToken, groupId)) return;
      setError(err instanceof Error ? err.message : t("Nao foi possivel carregar documentos.", "Could not load the documents."));
    } finally {
      if (request === documentRequest.current) setLoadingDocuments(false);
    }
  }

  useEffect(() => {
    if (!token || !selectedGroupId) {
      setAssets([]);
      setDocuments([]);
      return;
    }

    loadAssets(token, selectedGroupId);
    loadDocuments(token, selectedGroupId);
  }, [token, selectedGroupId]);

  async function handleUploadAssetSubmit(event: FormEvent, itemId?: number): Promise<boolean> {
    event.preventDefault();

    if (!token || !selectedGroupId || (!itemId && !assetForm.file)) {
      return false;
    }

    setSubmittingAsset(true);
    setError(null);
    setSuccess(null);

    try {
      if (itemId) {
        await apiRequest(`/groups/${selectedGroupId}/assets/${itemId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: assetForm.title.trim(),
            asset_type: assetForm.assetType,
            instrument: assetForm.instrument.trim() || null,
            event_id: assetForm.eventId ? Number(assetForm.eventId) : null,
            repertoire_piece_id: assetForm.repertoirePieceId ? Number(assetForm.repertoirePieceId) : null,
          }),
        }, token);
      } else if (assetForm.file) {
        const formData = new FormData();
        formData.append('title', assetForm.title.trim());
        formData.append('asset_type', assetForm.assetType.trim());
        if (assetForm.instrument.trim()) {
          formData.append('instrument', assetForm.instrument.trim());
        }
        if (assetForm.eventId) {
          formData.append('event_id', assetForm.eventId);
        }
        if (assetForm.repertoirePieceId) {
          formData.append('repertoire_piece_id', assetForm.repertoirePieceId);
        }
        formData.append('file', assetForm.file);

        await uploadGroupAsset(token, selectedGroupId, formData);
      }
      await loadAssets(token, selectedGroupId);
      setAssetForm(initialAssetForm);
      setSuccess(itemId ? t("Partitura ou anexo atualizado.", "Score or attachment updated.") : t("Partitura ou anexo carregado.", "Score or attachment uploaded."));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Falha ao carregar partitura.", "Could not upload the score."));
      return false;
    } finally {
      setSubmittingAsset(false);
    }
  }

  async function handleUploadDocumentSubmit(event: FormEvent, itemId?: number): Promise<boolean> {
    event.preventDefault();

    if (!token || !selectedGroupId || (!itemId && !documentForm.file)) {
      return false;
    }

    setSubmittingDocument(true);
    setError(null);
    setSuccess(null);

    try {
      if (itemId) {
        await apiRequest(`/groups/${selectedGroupId}/documents/${itemId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: documentForm.title.trim(),
            document_type: documentForm.documentType.trim() || null,
            category: documentForm.category.trim() || null,
            relevance: Number(documentForm.relevance || '0'),
          }),
        }, token);
      } else if (documentForm.file) {
        const formData = new FormData();
        formData.append('title', documentForm.title.trim());
        if (documentForm.documentType.trim()) {
          formData.append('document_type', documentForm.documentType.trim());
        }
        if (documentForm.category.trim()) {
          formData.append('category', documentForm.category.trim());
        }
        formData.append('relevance', documentForm.relevance || '0');
        formData.append('file', documentForm.file);

        await uploadGroupDocument(token, selectedGroupId, formData);
      }
      await loadDocuments(token, selectedGroupId);
      setDocumentForm(initialDocumentForm);
      setSuccess(itemId ? t("Documento atualizado.", "Document updated.") : t("Documento carregado.", "Document uploaded."));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Falha ao carregar documento.", "Could not upload the document."));
      return false;
    } finally {
      setSubmittingDocument(false);
    }
  }

  async function handleDeleteFile(type: 'asset' | 'document', itemId: number): Promise<boolean> {
    if (!token || !selectedGroupId || !window.confirm(t("Eliminar definitivamente este ficheiro?", "Delete this file permanently?"))) {
      return false;
    }

    const isAsset = type === 'asset';
    const setSubmitting = isAsset ? setSubmittingAsset : setSubmittingDocument;
    const loadFiles = isAsset ? loadAssets : loadDocuments;
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiRequest(`/groups/${selectedGroupId}/${isAsset ? 'assets' : 'documents'}/${itemId}`, { method: 'DELETE' }, token);
      await loadFiles(token, selectedGroupId);
      setSuccess(t("Ficheiro eliminado.", "File deleted."));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Não foi possível eliminar o ficheiro.", "Could not delete the file."));
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return {
    assets,
    documents,
    loadingAssets,
    loadingDocuments,
    submittingAsset,
    submittingDocument,
    assetForm,
    setAssetForm,
    documentForm,
    setDocumentForm,
    loadAssets,
    loadDocuments,
    handleUploadAssetSubmit,
    handleUploadDocumentSubmit,
    handleDeleteFile,
  };
}
