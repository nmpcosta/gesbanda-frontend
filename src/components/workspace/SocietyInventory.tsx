
import { useState } from 'react';
import { useWorkspaceResource } from '../../hooks/useWorkspaceResource';
import { t } from '../../language';
import type { Paginated } from '../../types/licensing.types';
import { Alerts } from '../common/Alerts';
import { Pagination } from '../common/Pagination';

type Named = { id: number; name: string };
type InventoryItem = Named & {
  code: string | null;
  notes: string | null;
  is_archived: boolean;
  assigned_to_user_id: number | null;
  assigned_user: Named | null;
  band_assignments: { id: number; group_id: number; group: Named; user: Named | null }[];
};
type InventoryResponse = { items: Paginated<InventoryItem>; groups: Named[]; members: (Named & { user_id: number })[] };

export function SocietyInventory({ societyPath, token }: { societyPath: string; token: string }) {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const path = `${societyPath}/inventory`;
  const { data, loading, saving, error, save } = useWorkspaceResource<InventoryResponse>(`${path}?page=${page}`, token);

  return (
    <section className="workspace-panel">
      <header className="workspace-head"><h2>{t('Material da sociedade', 'Society equipment')}</h2>
        <button className="workspace-primary" type="button" onClick={() => { setEditing(null); setShowForm(true); }}>{t('Adicionar instrumento ou material', 'Add instrument or equipment')}</button>
      </header>
      <Alerts error={error} success={null} />
      {loading ? <p role="status">{t('A carregar material…', 'Loading equipment…')}</p> : null}
      {showForm ? (
        <article className="workspace-card">
          <form className="form" key={editing?.id ?? 'new'} onSubmit={async (event) => {
            event.preventDefault();
            const fields = new FormData(event.currentTarget);
            const input = {
              name: fields.get('name'), code: fields.get('code'), notes: fields.get('notes'),
              assigned_to_user_id: Number(fields.get('user')) || null,
              is_archived: fields.has('archived'),
            };
            if (await save(editing ? `${path}/${editing.id}` : path, editing ? 'PUT' : 'POST', input)) setShowForm(false);
          }}>
            <label>{t('Nome', 'Name')}<input name="name" maxLength={160} defaultValue={editing?.name} required /></label>
            <label>{t('Código', 'Code')}<input name="code" maxLength={100} defaultValue={editing?.code ?? ''} /></label>
            <label>{t('Responsável na sociedade', 'Society assignee')}
              <select name="user" defaultValue={editing?.assigned_to_user_id ?? ''}>
                <option value="">{t('Sem responsável', 'Unassigned')}</option>
                {data?.members.map((member) => <option value={member.user_id} key={member.id}>{member.name}</option>)}
              </select>
            </label>
            <label>{t('Observações', 'Notes')}<textarea name="notes" maxLength={5000} defaultValue={editing?.notes ?? ''} /></label>
            {editing ? <label className="checkbox-row"><input type="checkbox" name="archived" defaultChecked={editing.is_archived} />{t('Arquivado', 'Archived')}</label> : null}
            <div className="summary-row"><button type="submit" disabled={saving}>{t('Guardar material', 'Save equipment')}</button>
              <button type="button" className="ghost" onClick={() => setShowForm(false)}>{t('Cancelar', 'Cancel')}</button></div>
          </form>
        </article>
      ) : null}
      {data?.items.data.length === 0 ? <p className="workspace-card">{t('A sociedade ainda não tem material registado.', 'The society has no equipment records yet.')}</p> : null}
      {data?.items.data.map((item) => (
        <article className="workspace-card detail-list" key={item.id}>
          <div className="listing-head"><div><h3>{item.name}</h3><p>{item.code}</p></div>
            <button type="button" className="tiny ghost" onClick={() => { setEditing(item); setShowForm(true); }}>{t('Editar', 'Edit')}</button></div>
          {item.is_archived ? <p>{t('Arquivado', 'Archived')}</p> : null}
          <p><strong>{t('Responsável na sociedade', 'Society assignee')}</strong> · {item.assigned_user?.name ?? t('Sem responsável', 'Unassigned')}</p>
          {item.notes ? <p>{item.notes}</p> : null}
          <h4>{t('Bandas com acesso', 'Ensembles with access')}</h4>
          {item.band_assignments.length ? item.band_assignments.map((assignment) => (
            <div className="summary-row" key={assignment.id}>
              <span><strong>{assignment.group.name}</strong> · {assignment.user?.name ?? t('Sem músico associado', 'No musician assigned')}</span>
              <button type="button" disabled={saving} className="tiny ghost" onClick={() => {
                if (window.confirm(t('Retirar o acesso desta banda ao material?', 'Remove this ensemble’s access to the equipment?'))) {
                  void save(`${path}/${item.id}/groups/${assignment.group_id}`, 'DELETE');
                }
              }}>{t('Retirar partilha', 'Stop sharing')}</button>
            </div>
          )) : <p>{t('Material exclusivo da sociedade.', 'Equipment used only by the society.')}</p>}
          {!item.is_archived ? (
            <form className="form" onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const groupId = Number(new FormData(form).get('group_id'));
              if (groupId && await save(`${path}/${item.id}/groups/${groupId}`, 'PUT')) form.reset();
            }}>
              <label>{t('Partilhar com uma banda', 'Share with an ensemble')}
                <select name="group_id" required>
                  <option value="">{t('Seleciona uma banda', 'Select an ensemble')}</option>
                  {data.groups.filter((group) => !item.band_assignments.some((assignment) => assignment.group_id === group.id))
                    .map((group) => <option value={group.id} key={group.id}>{group.name}</option>)}
                </select>
              </label>
              <button type="submit" disabled={saving}>{t('Partilhar material', 'Share equipment')}</button>
            </form>
          ) : null}
        </article>
      ))}
      {data ? <Pagination page={page} lastPage={data.items.last_page} onChange={setPage} /> : null}
    </section>
  );
}
