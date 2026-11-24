import { t } from '../../language';

import { useEffect, useState } from 'react';
import { downloadApiFile } from '../../api';
import { useWorkspaceResource } from '../../hooks/useWorkspaceResource';
import type { Paginated } from '../../types/licensing.types';
import type { SocietySection } from '../../ui-types';
import { Alerts } from '../common/Alerts';
import { Pagination } from '../common/Pagination';
import { SocietyEvents } from './SocietyEvents';
import { SocietyInventory } from './SocietyInventory';
import { SocietySepa } from './SocietySepa';

type Named = { id: number; name: string };
export type SocietySummary = Named & { can_manage: boolean };
type Society = Named & { description: string | null; transfer_instructions: string | null };
type SocietyMember = Named & {
  email: string;
  role: 'member' | 'board' | 'administrator';
  board_title?: string | null;
  status: 'active' | 'inactive';
  joined_on: string;
  ended_on: string | null;
};
type Due = {
  id: number;
  period: string;
  due_on: string;
  amount_cents: number;
  reference: string;
  paid_method: string | null;
  paid_at: string | null;
  member: Named;
};
type Notice = { id: number; title: string; body: string; created_at: string };
type Document = { id: number; title: string; category: string | null; original_name: string };
type SocietyDetails = {
  society: Society;
  can_manage: boolean;
  email_enabled: boolean;
  can_manage_board: boolean;
  member: SocietyMember | null;
  administrator?: Named | null;
  members: SocietyMember[];
  groups: Named[];
  eligible_groups: Named[];
  dues: Paginated<Due>;
  notices: Paginated<Notice>;
  documents: Paginated<Document>;
};

const currency = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });
const paidMethods = { transfer: t("Transferência", "Bank transfer"), sepa: t("Débito SEPA", "SEPA direct debit"), bizum: 'Bizum', cash: t("Numerário", "Cash"), other: t("Outro", "Other") };

function SocietyWorkspace({ token, id, tab, onChange }: {
  token: string;
  id: number;
  tab: SocietySection | null;
  onChange: () => void;
}) {
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<SocietyMember | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [editingSociety, setEditingSociety] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const path = `/societies/${id}`;
  const { data, saving, loading, error, save } = useWorkspaceResource<SocietyDetails>(tab ? `${path}?${tab}_page=${page}` : path, token);

  useEffect(() => {
    setPage(1);
    setShowForm(false);
    setEditingNotice(null);
    setEditingDocument(null);
    setFileError(null);
  }, [tab]);

  if (!data) {
    return <><Alerts error={error} success={null} />{loading ? <p role="status">{t("A carregar sociedade...", "Loading society…")}</p> : null}</>;
  }

  return (
    <>
      <Alerts error={error ?? fileError} success={null} />
      <article className="workspace-card detail-list">
        <div className="listing-head">
          <div><h3>{data.society.name}</h3>{data.society.description ? <p>{data.society.description}</p> : null}</div>
          {data.can_manage ? <button type="button" className="tiny ghost" onClick={() => setEditingSociety(!editingSociety)}>{t("Editar sociedade", "Edit society")}</button> : null}
        </div>
        {data.administrator ? <p><strong>{t('Administrador da sociedade', 'Society administrator')}</strong> · {data.administrator.name}</p> : null}
        {data.member ? <p>{t("Sócio desde", "Member since")} {data.member.joined_on}{data.member.role === 'board' ? t(' · Direção', ' · Board') : ''}</p> : null}
        {editingSociety ? (
          <form className="form" onSubmit={async (event) => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            if (await save(path, 'PUT', Object.fromEntries(values))) {
              setEditingSociety(false);
              onChange();
            }
          }}>
            <label>{t("Nome", "Name")}<input name="name" defaultValue={data.society.name} maxLength={160} required /></label>
            <label>{t("Descrição", "Description")}<textarea name="description" defaultValue={data.society.description ?? ''} maxLength={10000} /></label>
            <label>{t("Instruções de pagamento por transferência", "Bank transfer instructions")}<textarea name="transfer_instructions" defaultValue={data.society.transfer_instructions ?? ''} maxLength={2500} /></label>
            <button type="submit" disabled={saving}>{t("Guardar alterações", "Save changes")}</button>
          </form>
        ) : null}
      </article>

      {loading ? <p role="status">{t("A carregar...", "Loading…")}</p> : null}
      {tab === 'groups' ? (
        <article className="workspace-card detail-list">
          <h3>{t("Formações ligadas", "Linked ensembles")}</h3>
          {data.groups.length ? <ul>{data.groups.map((entry) => <li key={entry.id} className="summary-row">
            {entry.name}
            {data.can_manage ? <button type="button" className="tiny ghost" disabled={saving} onClick={() => {
              if (window.confirm(t('Desligar esta formação da sociedade e retirar as partilhas de material?', 'Unlink this ensemble and remove its shared equipment access?'))) {
                void save(`${path}/groups/${entry.id}`, 'DELETE');
              }
            }}>{t('Desligar formação', 'Unlink ensemble')}</button> : null}
          </li>)}</ul> : <p>{t("Sem formações ligadas.", "No ensembles linked.")}</p>}
          {data.eligible_groups.length ? (
            <form className="form" onSubmit={(event) => {
              event.preventDefault();
              const values = new FormData(event.currentTarget);
              void save(`${path}/groups/${Number(values.get('group'))}`, 'PUT');
            }}>
              <label>{t("Ligar uma formação", "Link an ensemble")}
                <select name="group" required><option value="">{t("Seleciona uma formação", "Select an ensemble")}</option>
                  {data.eligible_groups.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
                </select>
              </label>
              <button type="submit" disabled={saving}>{t("Ligar formação", "Link ensemble")}</button>
            </form>
          ) : null}
        </article>
      ) : null}

      {tab === 'members' && data.can_manage ? (
        <article className="workspace-card detail-list">
          <div className="listing-head"><h3>{t("Sócios e direção", "Members and board")}</h3><button type="button" onClick={() => { setEditing(null); setShowForm(true); }}>{t("Adicionar sócio", "Add member")}</button></div>
          {showForm ? (
            <form className="form" key={editing?.id ?? 'new'} onSubmit={async (event) => {
              event.preventDefault();
              const values = Object.fromEntries(new FormData(event.currentTarget));
              if (await save(editing ? `${path}/members/${editing.id}` : `${path}/members`, editing ? 'PUT' : 'POST', values)) {
                setShowForm(false);
              }
            }}>
              <label>{t("Nome", "Name")}<input name="name" defaultValue={editing?.name} maxLength={160} required /></label>
              <label>{t('Email da conta GesBanda', 'GesBanda account email')}
                <input name="email" type="email" defaultValue={editing?.email} readOnly={editing?.role === 'administrator'} required maxLength={255} />
              </label>
              <label>{t('Função', 'Role')}
                <select name="role" defaultValue={editing?.role ?? 'member'}>
                  {editing?.role === 'administrator' ? <option value="administrator">{t('Administrador', 'Administrator')}</option> : (
                    <><option value="member">{t('Sócio', 'Member')}</option>{data.can_manage_board ? <option value="board">{t('Direção', 'Board')}</option> : null}</>
                  )}
                </select>
              </label>
              {data.can_manage_board ? <label>{t('Cargo na direção', 'Board position')}<input name="board_title" maxLength={120} defaultValue={editing?.board_title ?? ''} placeholder={t('Ex.: Presidência, Secretaria ou Tesouraria', 'E.g. Chair, Secretary or Treasurer')} /></label> : null}
              <label>{t("Estado", t("Status", "Status"))}<select name="status" defaultValue={editing?.status ?? 'active'}><option value="active">{t("Ativo", "Active")}</option>{editing?.role !== 'administrator' ? <option value="inactive">{t('Inativo', 'Inactive')}</option> : null}</select></label>
              <label>{t("Data de inscrição", "Date joined")}<input name="joined_on" type="date" defaultValue={editing?.joined_on} required /></label>
              <div className="summary-row"><button type="submit" disabled={saving}>{t("Guardar ficha", "Save profile")}</button><button type="button" className="ghost" onClick={() => setShowForm(false)}>{t("Cancelar", "Cancel")}</button></div>
            </form>
          ) : null}
          {data.can_manage_board && data.members.some((member) => member.role === 'board' && member.status === 'active') ? (
            <form className="form" onSubmit={(event) => {
              event.preventDefault();
              const values = new FormData(event.currentTarget);
              if (window.confirm(t('Transferir a administração da sociedade para este membro da direção?', 'Transfer society administration to this board member?'))) {
                void save(`${path}/administrator`, 'PATCH', { member_id: Number(values.get('administrator')) });
              }
            }}>
              <label>{t('Novo administrador', 'New administrator')}
                <select name="administrator" required>
                  <option value="">{t('Escolhe um membro ativo da direção', 'Choose an active board member')}</option>
                  {data.members.filter((member) => member.role === 'board' && member.status === 'active')
                    .map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                </select>
              </label>
              <button type="submit" disabled={saving}>{t('Transferir administração', 'Transfer administration')}</button>
            </form>
          ) : null}
          {data.members.length ? (
            <div className="table-wrapper entity-table-wrapper">
              <table className="entity-table">
                <thead><tr><th>{t("Nome", "Name")}</th><th>Email</th><th>{t("Função", "Role")}</th><th>{t("Inscrição", "Joined")}</th><th>{t("Saída", "Left")}</th><th>{t("Ação", "Action")}</th></tr></thead>
                <tbody>{data.members.map((member) => (
                  <tr key={member.id}><td>{member.name}</td><td>{member.email}</td><td>{member.role === 'administrator' ? t('Administrador', 'Administrator') : member.role === 'board' ? t('Direção', 'Board') : t('Sócio', 'Member')}{member.board_title ? ` · ${member.board_title}` : ''}</td><td>{member.joined_on}</td><td>{member.ended_on ?? '—'}</td>
                    <td>{member.role === 'member' || data.can_manage_board ? <button type="button" className="tiny ghost" onClick={() => { setEditing(member); setShowForm(true); }}>{t("Editar", "Edit")}</button> : '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p>{t("Sem sócios registados.", "No members registered.")}</p>}
        </article>
      ) : null}

      {tab === 'dues' ? (
        <article className="workspace-card detail-list">
          <h3>{data.can_manage ? t("Quotas dos sócios", "Member dues") : t("As minhas quotas", "My dues")}</h3>
          {data.society.transfer_instructions ? <p style={{ whiteSpace: 'pre-wrap' }}>{data.society.transfer_instructions}</p> : null}
          {data.can_manage ? (
            <form className="form" onSubmit={(event) => {
              event.preventDefault();
              const values = new FormData(event.currentTarget);
              if (window.confirm(t("Criar as quotas deste período para os sócios ativos?", "Generate dues for active members for this period?"))) {
                void save(`${path}/dues`, 'POST', { period: values.get('period'), due_on: values.get('due_on'), amount_cents: Math.round(Number(values.get('amount')) * 100) });
              }
            }}>
              <label>{t("Período", "Period")}<input name="period" type="month" required /></label>
              <label>{t("Vencimento", "Due date")}<input name="due_on" type="date" required /></label>
              <label>{t("Valor em euros", "Amount in euros")}<input name="amount" type="number" min="0.01" max="999999.99" step="0.01" required /></label>
              <button type="submit" disabled={saving}>{t("Gerar quotas", "Generate dues")}</button>
            </form>
          ) : null}
          {data.dues.data.length ? (
            <div className="table-wrapper entity-table-wrapper">
              <table className="entity-table">
                <thead><tr>{data.can_manage ? <th>{t("Sócio", "Member")}</th> : null}<th>{t("Período", "Period")}</th><th>{t("Vencimento", "Due date")}</th><th>{t("Valor", "Amount")}</th><th>{t("Referência", "Reference")}</th><th>{t("Estado", t("Status", "Status"))}</th></tr></thead>
                <tbody>{data.dues.data.map((due) => (
                  <tr key={due.id}>{data.can_manage ? <td>{due.member.name}</td> : null}<td>{due.period}</td><td>{due.due_on}</td><td>{currency.format(due.amount_cents / 100)}</td><td>{due.reference}</td>
                    <td>{due.paid_at ? t("Paga", "Paid") : data.can_manage ? (
                      <form className="summary-row" onSubmit={(event) => {
                        event.preventDefault();
                        const values = new FormData(event.currentTarget);
                        if (window.confirm(t("Confirmas que este pagamento já foi recebido?", "Confirm that this payment has been received?"))) {
                          void save(`${path}/dues/${due.id}/paid`, 'PATCH', { method: values.get('method') });
                        }
                      }}>
                        <select name="method" aria-label={t("Método de pagamento", "Payment method")}>
                          {Object.entries(paidMethods).map(([method, label]) => <option key={method} value={method}>{label}</option>)}
                        </select>
                        <button type="submit" className="tiny" disabled={saving}>{t("Registar pagamento", "Record payment")}</button>
                      </form>
                    ) : t("Pendente", "Pending")}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          ) : <p>{t("Sem quotas registadas.", "No dues recorded.")}</p>}
          <Pagination page={page} lastPage={data.dues.last_page} onChange={setPage} />
        </article>
      ) : null}

      {tab === 'notices' ? (
        <article className="workspace-card detail-list">
          <h3>{t("Comunicações da sociedade", "Society notices")}</h3>
          {data.can_manage ? (
            <form className="form" key={editingNotice?.id ?? 'new-notice'} onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const values = new FormData(form);
              const sendEmail = values.has('send_email');
              if (sendEmail && !window.confirm(t('Enviar esta comunicação por email a todos os sócios ativos?', 'Email this notice to all active members?'))) return;
              const url = editingNotice ? `${path}/notices/${editingNotice.id}` : `${path}/notices`;
              if (await save(url, editingNotice ? 'PUT' : 'POST', { title: values.get('title'), body: values.get('body'), send_email: sendEmail })) {
                setEditingNotice(null);
                form.reset();
                setPage(1);
              }
            }}>
              <label>{t("Título", "Title")}<input name="title" maxLength={160} defaultValue={editingNotice?.title} required /></label>
              <label>{t("Mensagem", "Message")}<textarea name="body" maxLength={10000} defaultValue={editingNotice?.body} required /></label>
              {data.email_enabled && !editingNotice ? (
                <label className="checkbox-row"><input type="checkbox" name="send_email" />{t('Enviar também por email', 'Email active members as well')}</label>
              ) : null}
              <div className="summary-row"><button type="submit" disabled={saving}>{editingNotice ? t('Guardar alterações', 'Save changes') : t('Publicar no portal', 'Publish to the portal')}</button>
                {editingNotice ? <button type="button" className="ghost" onClick={() => setEditingNotice(null)}>{t('Cancelar edição', 'Cancel editing')}</button> : null}</div>
            </form>
          ) : null}
          {data.notices.data.length ? data.notices.data.map((notice) => (
            <div className="detail-list" key={notice.id}><h4>{notice.title}</h4><p style={{ whiteSpace: 'pre-wrap' }}>{notice.body}</p>
              {data.can_manage ? <div className="summary-row">
                <button type="button" className="tiny ghost" onClick={() => setEditingNotice(notice)}>{t('Editar', 'Edit')}</button>
                <button type="button" className="tiny danger" disabled={saving} onClick={() => {
                  if (window.confirm(t('Eliminar esta comunicação?', 'Delete this notice?'))) void save(`${path}/notices/${notice.id}`, 'DELETE');
                }}>{t('Eliminar', 'Delete')}</button>
              </div> : null}
            </div>
          )) : <p>{t("Sem comunicações publicadas.", "No notices have been published.")}</p>}
          <Pagination page={page} lastPage={data.notices.last_page} onChange={setPage} />
        </article>
      ) : null}

      {tab === 'events' ? <SocietyEvents societyPath={path} token={token} canManage={data.can_manage} /> : null}
      {tab === 'inventory' && data.can_manage ? <SocietyInventory societyPath={path} token={token} /> : null}
      {tab === 'sepa' && data.can_manage ? <SocietySepa societyPath={path} token={token} /> : null}

      {tab === 'documents' ? (
        <article className="workspace-card detail-list">
          <h3>{t("Atas e documentos", "Minutes and documents")}</h3>
          {data.can_manage ? (
            <form className="form" key={editingDocument?.id ?? 'new-document'} onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const fields = new FormData(form);
              const url = editingDocument ? `${path}/documents/${editingDocument.id}` : `${path}/documents`;
              if (await save(url, editingDocument ? 'PUT' : 'POST', editingDocument ? Object.fromEntries(fields) : fields)) {
                setEditingDocument(null);
                form.reset();
                setPage(1);
              }
            }}>
              <label>{t("Título", "Title")}<input name="title" maxLength={160} defaultValue={editingDocument?.title} required /></label>
              <label>{t("Categoria", "Category")}<input name="category" maxLength={120} defaultValue={editingDocument?.category ?? ''} /></label>
              {!editingDocument ? <label>{t("Ficheiro", "File")}<input name="file" type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" required /></label> : null}
              <div className="summary-row">
                <button type="submit" disabled={saving}>{editingDocument ? t('Guardar alterações', 'Save changes') : t('Carregar documento', 'Upload document')}</button>
                {editingDocument ? <button type="button" className="ghost" onClick={() => setEditingDocument(null)}>{t('Cancelar edição', 'Cancel editing')}</button> : null}
              </div>
            </form>
          ) : null}
          {data.documents.data.length ? data.documents.data.map((file) => (
            <div className="summary-row" key={file.id}>
              <strong>{file.title}</strong><span>{file.category}</span>
              <button type="button" className="tiny ghost" onClick={async () => {
                setFileError(null);
                try {
                  await downloadApiFile(`${path}/documents/${file.id}`, token, file.original_name);
                } catch (err) {
                  setFileError(err instanceof Error ? err.message : t("Falha ao descarregar ficheiro.", "Could not download the file."));
                }
              }}>{t("Descarregar", "Download")}</button>
              {data.can_manage ? <>
                <button type="button" className="tiny ghost" onClick={() => setEditingDocument(file)}>{t('Editar', 'Edit')}</button>
                <button type="button" className="tiny danger" disabled={saving} onClick={() => {
                  if (window.confirm(t('Eliminar este documento?', 'Delete this document?'))) void save(`${path}/documents/${file.id}`, 'DELETE');
                }}>{t('Eliminar', 'Delete')}</button>
              </> : null}
            </div>
          )) : <p>{t("Sem documentos disponíveis.", "No documents available.")}</p>}
          <Pagination page={page} lastPage={data.documents.last_page} onChange={setPage} />
        </article>
      ) : null}
    </>
  );
}

export function SocietiesWorkspace({ token, section, societies, current, loading, saving, error, onSelect, onCreate, onChange }: {
  token: string;
  section: SocietySection | null;
  societies: SocietySummary[];
  current?: SocietySummary;
  loading: boolean;
  saving: boolean;
  error: string | null;
  onSelect: (id: number) => void;
  onCreate: (input: object) => Promise<boolean>;
  onChange: () => void;
}) {
  const [creating, setCreating] = useState(false);

  return (
    <section className="workspace-panel admin-panel">
      <header className="workspace-head admin-head"><h2>{t("Sociedades musicais", "Music societies")}</h2><button type="button" onClick={() => setCreating(!creating)}>{creating ? t("Fechar", "Close") : t("Nova sociedade", "New society")}</button></header>
      <Alerts error={error} success={null} />
      {loading ? <p role="status">{t("A carregar sociedades...", "Loading societies…")}</p> : null}
      {creating ? (
        <article className="workspace-card">
          <form className="form" onSubmit={async (event) => {
            event.preventDefault();
            const input = Object.fromEntries(new FormData(event.currentTarget));
            if (await onCreate(input)) {
              setCreating(false);
            }
          }}>
            <label>{t("Nome", "Name")}<input name="name" maxLength={160} required /></label>
            <label>{t("Descrição", "Description")}<textarea name="description" maxLength={10000} /></label>
            <button type="submit" disabled={saving}>{t("Criar sociedade", "Create society")}</button>
          </form>
        </article>
      ) : null}
      {current ? (
        <>
          <article className="workspace-card form">
            <label>{t("Sociedade", "Society")}<select value={current.id} onChange={(event) => onSelect(Number(event.target.value))}>
              {societies.map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}
            </select></label>
          </article>
          <SocietyWorkspace key={current.id} token={token} id={current.id} tab={section} onChange={onChange} />
        </>
      ) : !loading ? <p className="workspace-card">{t("Ainda não pertences a uma sociedade musical.", "You have not joined a music society yet.")}</p> : null}
    </section>
  );
}
