import { useState } from 'react';
import { t } from '../../language';
import type { GroupAssetSummary, RepertoirePieceSummary } from '../../types';
import { PieceFiles } from './PieceFiles';
import { UiIcon } from '../common/UiIcon';

type EventProgrammeProps = {
  token: string;
  groupId: number;
  eventId: number;
  pieces: RepertoirePieceSummary[];
  assets: GroupAssetSummary[];
  loadingPieces: boolean;
  loadingAssets: boolean;
};

export function EventProgramme({ token, groupId, eventId, pieces, assets, loadingPieces, loadingAssets }: EventProgrammeProps) {
  const [openId, setOpenId] = useState<number | null>(null);
  const [partsByPiece, setPartsByPiece] = useState<Record<number, number>>({});
  const ordered = pieces.filter(piece => piece.group_id === groupId).sort((a, b) =>
    (a.pivot?.piece_order ?? Infinity) - (b.pivot?.piece_order ?? Infinity));
  const files = assets.filter(asset => asset.event_id === null || asset.event_id === eventId);
  return <section className="summary-card event-programme">
    <h4>{t('Alinhamento do evento', 'Event programme')}</h4>
    {loadingPieces ? <p role="status">{t('A carregar alinhamento…', 'Loading programme…')}</p> :
      ordered.length === 0 ? <p className="muted">{t('Este evento ainda não tem obras associadas.', 'No pieces have been added to this event yet.')}</p> :
      <ol className="programme-list">{ordered.map((piece, index) => <li key={piece.id}>
        <button className="programme-toggle" type="button" aria-expanded={openId === piece.id}
          onClick={() => setOpenId(openId === piece.id ? null : piece.id)}>
          <span className="programme-order" aria-hidden="true">{index + 1}</span>
          <strong>{piece.title}</strong><UiIcon name="arrow-right" size={16} />
        </button>
        {openId === piece.id && <>
          {piece.pivot?.notes && <p>{piece.pivot.notes}</p>}
          <PieceFiles pieceId={piece.id} groupId={groupId} token={token} assets={files}
            initialPartId={partsByPiece[piece.id]}
            onPartChange={assetId => setPartsByPiece(previous => ({ ...previous, [piece.id]: assetId }))}
            loading={loadingAssets} canManage={false} />
          {ordered.length > 1 && <div className="entity-card-actions">
            <button className="ghost" type="button" disabled={index === 0}
              onClick={() => setOpenId(ordered[index - 1].id)}>{t('Obra anterior', 'Previous piece')}</button>
            <button className="ghost" type="button" disabled={index === ordered.length - 1}
              onClick={() => setOpenId(ordered[index + 1].id)}>{t('Obra seguinte', 'Next piece')}</button>
          </div>}
        </>}
      </li>)}</ol>}
  </section>;
}
