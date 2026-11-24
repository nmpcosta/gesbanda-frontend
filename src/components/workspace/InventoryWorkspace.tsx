import { t } from '../../language';

import { useState } from 'react';
import { useWorkspaceResource } from '../../hooks/useWorkspaceResource';
import type { GroupSummary } from '../../types';
import type { Paginated } from '../../types/licensing.types';
import { Alerts } from '../common/Alerts';
import { Pagination } from '../common/Pagination';

type InventoryCategory = { id: number; name: string; fields: string[] };
type InventoryLoan = {
  id: number;
  borrower_name: string;
  borrowed_at: string;
  due_at: string | null;
  returned_at: string | null;
  notes: string | null;
};
type InventoryItem = {
  id: number;
  name: string;
  code: string | null;
  musical_society_id: number | null;
  assigned_to_user_id: number | null;
  assigned_user: { name: string } | null;
  band_assignments?: { user_id: number | null; user: { name: string } | null }[];
  notes: string | null;
  inventory_category_id: number | null;
  category: InventoryCategory | null;
  attributes: Record<string, string | null>;
  is_archived: boolean;
  current_loan: InventoryLoan | null;
};
type InventoryResponse = {
  items: Paginated<InventoryItem>;
  categories: InventoryCategory[];
  members: { id: number; name: string }[];
};
type InventoryWorkspaceProps = {
  group: GroupSummary;
  token: string;
  formatDateTime: (value: string) => string;
};

function LoanHistory({ path, token, formatDateTime }: { path: string; token: string; formatDateTime: (value: string) => string }) {
  const [page, setPage] = useState(1);
  const { data, error, loading } = useWorkspaceResource<Paginated<InventoryLoan>>(`${path}?page=${page}`, token);

  return (
    <article className="workspace-card">
      <h3>{t("Histórico de empréstimos", "Loan history")}</h3>
      <Alerts error={error} success={null} />
      {loading ? <p role="status">{t("A carregar...", "Loading…")}</p> : null}
      {data?.data.length === 0 ? <p className="muted">{t("Sem empréstimos registados.", "No recorded loans.")}</p> : null}
      {data?.data.map((loan) => (
        <p key={loan.id}>
          <strong>{loan.borrower_name}</strong> · {formatDateTime(loan.borrowed_at)} · {loan.returned_at ? `Devolvido em ${formatDateTime(loan.returned_at)}` : t("Em empréstimo", "On loan")}
          {loan.notes ? ` · ${loan.notes}` : ''}
        </p>
      ))}
      {data ? <Pagination page={page} lastPage={data.last_page} onChange={setPage} /> : null}
    </article>
  );
}

export function InventoryWorkspace({ group, token, formatDateTime }: InventoryWorkspaceProps) {
  const [page, setPage] = useState(1);
  const [archived, setArchived] = useState(false);
  const [category, setCategory] = useState<InventoryCategory | null>(null);
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [form, setForm] = useState<'item' | 'category' | null>(null);
  const [categoryId, setCategoryId] = useState('');
  const [lendItem, setLendItem] = useState<number | null>(null);
  const [historyItem, setHistoryItem] = useState<number | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const path = `/groups/${group.id}/inventory`;
  const { data, error, loading, saving, save } = useWorkspaceResource<InventoryResponse>(
    `${path}?page=${page}&archived=${archived ? 1 : 0}`, token
  );
  const fields = data?.categories.find((entry) => String(entry.id) === categoryId)?.fields ?? [];

  function editItem(nextItem: InventoryItem | null) {
    setItem(nextItem);
    setCategoryId(nextItem?.inventory_category_id?.toString() ?? '');
    setForm('item');
  }

  function editCategory(nextCategory: InventoryCategory | null) {
    setCategory(nextCategory);
    setForm('category');
  }

  return (
    <section className="workspace-panel admin-panel">
      <header className="workspace-head admin-head">
        <div><h2>{t("Inventário", "Inventory")}</h2><p className="subtitle">{group.name}</p></div>
        <div className="summary-row">
          <button type="button" className="ghost" onClick={() => { setArchived(!archived); setPage(1); setHistoryItem(null); }}>
            {archived ? t("Ver material em uso", "View current equipment") : t("Ver material arquivado", "View archived equipment")}
          </button>
          <button type="button" className="ghost" onClick={() => editCategory(null)}>{t("Nova categoria", "New category")}</button>
          <button type="button" onClick={() => editItem(null)}>{t("Adicionar material", "Add equipment")}</button>
        </div>
      </header>
      <Alerts error={error} success={null} />
      {loading ? <p role="status">{t("A carregar inventário...", "Loading inventory…")}</p> : null}
      {form === 'category' ? (
        <article className="workspace-card">
          <form className="form" key={category?.id ?? 'new-category'} onSubmit={async (event) => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            const fields = String(values.get('fields')).split('\n').map((field) => field.trim()).filter(Boolean);
            if (await save(category ? `${path}/categories/${category.id}` : `${path}/categories`, category ? 'PUT' : 'POST', { name: values.get('name'), fields })) {
              setForm(null);
            }
          }}>
            <h3>{category ? t("Editar categoria", "Edit category") : t("Nova categoria", "New category")}</h3>
            <label>{t("Nome", "Name")}<input name="name" maxLength={120} defaultValue={category?.name} required /></label>
            <label>{t("Campos personalizados, um por linha", "Custom fields, one per line")}<textarea name="fields" rows={4} defaultValue={category?.fields.join('\n')} /></label>
            <div className="summary-row"><button type="submit" disabled={saving}>{t("Guardar", "Save")}</button><button type="button" className="ghost" onClick={() => setForm(null)}>{t("Cancelar", "Cancel")}</button></div>
          </form>
        </article>
      ) : null}
      {form === 'item' ? (
        <article className="workspace-card">
          <form className="form" key={item?.id ?? 'new-item'} onSubmit={async (event) => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            const attributes = Object.fromEntries(fields.map((field) => [field, values.get(`field-${field}`) || null]));
            if (await save(item ? `${path}/items/${item.id}` : `${path}/items`, item ? 'PUT' : 'POST', {
              name: values.get('name'),
              code: values.get('code') || null,
              notes: values.get('notes') || null,
              inventory_category_id: categoryId ? Number(categoryId) : null,
              attributes,
              assigned_to_user_id: Number(values.get('assigned_to_user_id')) || null,
              is_archived: values.has('archived'),
            })) {
              setForm(null);
            }
          }}>
            <h3>{item ? t("Editar material", "Edit equipment") : t("Adicionar material", "Add equipment")}</h3>
            <label>{t("Nome", "Name")}<input name="name" maxLength={160} defaultValue={item?.name} required /></label>
            <label>{t("Código", "Code")}<input name="code" maxLength={100} defaultValue={item?.code ?? ''} /></label>
            <label>{t("Categoria", "Category")}
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
                <option value="">{t("Sem categoria", "No category")}</option>
                {data?.categories.map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}
              </select>
            </label>
            <label>{t('Músico responsável', 'Assigned musician')}
              <select name="assigned_to_user_id" defaultValue={item?.assigned_to_user_id ?? ''}>
                <option value="">{t('Sem músico associado', 'No musician assigned')}</option>
                {data?.members.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}
              </select>
            </label>
            {fields.map((field) => <label key={`${categoryId}-${field}`}>{field}<input name={`field-${field}`} maxLength={250} defaultValue={item?.attributes[field] ?? ''} /></label>)}
            <label>{t("Observações", "Notes")}<textarea name="notes" maxLength={5000} defaultValue={item?.notes ?? ''} /></label>
            {item ? <label className="checkbox-row"><input type="checkbox" name="archived" defaultChecked={item.is_archived} disabled={Boolean(item.current_loan)} />{t("Arquivado", "Archived")}</label> : null}
            <div className="summary-row"><button type="submit" disabled={saving}>{t("Guardar", "Save")}</button><button type="button" className="ghost" onClick={() => setForm(null)}>{t("Cancelar", "Cancel")}</button></div>
          </form>
        </article>
      ) : null}
      {data?.categories.length ? (
        <article className="workspace-card">
          <h3>{t("Categorias", "Categories")}</h3>
          <div className="summary-row">
            {data.categories.map((entry) => <button key={entry.id} className="tiny ghost" type="button" onClick={() => editCategory(entry)}>{entry.name}</button>)}
          </div>
        </article>
      ) : null}
      {data?.items.data.length === 0 && !loading ? <p className="workspace-card">{t("Sem material nesta lista.", "No equipment in this list.")}</p> : null}
      {data?.items.data.map((entry) => (
        <article className="workspace-card detail-list" key={entry.id}>
          <div className="listing-head">
            <div>
              <h3>{entry.name}</h3>
              <p>{[entry.code, entry.category?.name].filter(Boolean).join(' · ')}</p>
            </div>
            <div className="summary-row">
              {!entry.musical_society_id ? <>
              <button type="button" className="tiny ghost" onClick={() => editItem(entry)}>{t("Editar", "Edit")}</button>
              <button type="button" className="tiny ghost" onClick={() => setHistoryItem(historyItem === entry.id ? null : entry.id)}>{t("Histórico", "Activity")}</button>
              {entry.current_loan ? (
                <button type="button" className="tiny" disabled={saving} onClick={async () => {
                  if (entry.current_loan && await save(`${path}/items/${entry.id}/loans/${entry.current_loan.id}/return`, 'PATCH')) {
                    setHistoryVersion((previous) => previous + 1);
                  }
                }}>{t("Registar devolução", "Record return")}</button>
              ) : !entry.is_archived ? <button type="button" className="tiny" onClick={() => setLendItem(lendItem === entry.id ? null : entry.id)}>{t("Emprestar", "Lend")}</button> : null}
              </> : <span className="status-chip mute">{t('Material partilhado', 'Shared equipment')}</span>}
            </div>
          </div>
          <p>{entry.current_loan ? `Emprestado a ${entry.current_loan.borrower_name}${entry.current_loan.due_at ? ` até ${formatDateTime(entry.current_loan.due_at)}` : ''}` : entry.is_archived ? t("Arquivado", "Archived") : t("Disponível", "Available")}</p>
          <p><strong>{t('Músico responsável', 'Assigned musician')}</strong> · {(entry.musical_society_id ? entry.band_assignments?.[0]?.user?.name : entry.assigned_user?.name) ?? t('Sem músico associado', 'No musician assigned')}</p>
          {entry.musical_society_id && !entry.is_archived ? (
            <form className="form" key={entry.band_assignments?.[0]?.user_id ?? 'unassigned'} onSubmit={async (event) => {
              event.preventDefault();
              const value = new FormData(event.currentTarget).get('user');
              await save(`${path}/shared-items/${entry.id}/assignment`, 'PUT', { user_id: Number(value) || null });
            }}>
              <label>{t('Atribuição nesta banda', 'Assignment in this ensemble')}
                <select name="user" defaultValue={entry.band_assignments?.[0]?.user_id ?? ''}>
                  <option value="">{t('Sem músico associado', 'No musician assigned')}</option>
                  {data.members.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}
                </select>
              </label>
              <button type="submit" disabled={saving}>{t('Guardar atribuição', 'Save assignment')}</button>
            </form>
          ) : null}
          {entry.notes ? <p>{entry.notes}</p> : null}
          {Object.entries(entry.attributes).filter(([, value]) => value).map(([field, value]) => <p key={field}><strong>{field}</strong> {value}</p>)}
          {lendItem === entry.id ? (
            <form className="form" onSubmit={async (event) => {
              event.preventDefault();
              const values = new FormData(event.currentTarget);
              const date = values.get('due_at');
              if (await save(`${path}/items/${entry.id}/loans`, 'POST', {
                user_id: Number(values.get('user_id')),
                due_at: date ? new Date(String(date)).toISOString() : null,
                notes: values.get('notes') || null,
              })) {
                setLendItem(null);
                setHistoryVersion((previous) => previous + 1);
              }
            }}>
              <label>{t("Músico", "Musician")}<select name="user_id" required><option value="">{t("Seleciona um músico", "Select a musician")}</option>{data.members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select></label>
              <label>{t("Data prevista de devolução", "Expected return date")}<input type="datetime-local" name="due_at" /></label>
              <label>{t("Observações", "Notes")}<input name="notes" maxLength={5000} /></label>
              <button type="submit" disabled={saving}>{t("Registar empréstimo", "Record loan")}</button>
            </form>
          ) : null}
        </article>
      ))}
      {data ? <Pagination page={page} lastPage={data.items.last_page} onChange={setPage} /> : null}
      {historyItem ? <LoanHistory key={`${historyItem}-${historyVersion}`} path={`${path}/items/${historyItem}/loans`} token={token} formatDateTime={formatDateTime} /> : null}
    </section>
  );
}
