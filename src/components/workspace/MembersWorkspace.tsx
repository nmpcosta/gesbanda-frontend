import { MusicChoices } from '../common/MusicChoices';
import { instrumentGroups, memberInstruments, memberSections, musicLabel, sectionGroups } from '../../musicCatalog';
import { t } from '../../language';
import { managementAreas, type ManagementArea } from '../../permissions';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { UiIcon } from '../common/UiIcon';
import { ViewModeToggle, type ListingViewMode } from '../common/ViewModeToggle';
import type { GroupMemberSummary, UpdateMemberInput } from '../../types';
import type { MemberForm } from '../../ui-types';

type MembersWorkspaceMode = 'list' | 'detail' | 'edit' | 'create';

type MemberEditForm = {
  membershipRole: GroupMemberSummary['membership_role'];
  status: GroupMemberSummary['status'];
  section: string;
  instrument: string;
};

const initialMemberEditForm: MemberEditForm = {
  membershipRole: 'member',
  status: 'invited',
  section: '',
  instrument: '',
};

type MembersWorkspaceProps = {
  selectedGroupId: number | null;
  selectedGroupOwnerId: number | undefined;
  canManage: boolean;
  canManageRoles: boolean;
  canChangePermissions: boolean;
  memberFields: string[];
  onSaveFields: (fields: string[]) => Promise<boolean>;
  members: GroupMemberSummary[];
  memberForm: MemberForm;
  loadingMembers: boolean;
  submittingMember: boolean;
  updatingMember: boolean;
  setMemberForm: (updater: (previous: MemberForm) => MemberForm) => void;
  onRefresh: () => void;
  onInviteSubmit: (event: FormEvent) => Promise<boolean>;
  onUpdateMember: (member: GroupMemberSummary, input: UpdateMemberInput) => Promise<boolean>;
  onRemoveMember: (member: GroupMemberSummary) => void | Promise<void>;
};

export function MembersWorkspace({
  selectedGroupId,
  selectedGroupOwnerId,
  canManage,
  canManageRoles,
  canChangePermissions,
  memberFields,
  onSaveFields,
  members,
  memberForm,
  loadingMembers,
  submittingMember,
  updatingMember,
  setMemberForm,
  onRefresh,
  onInviteSubmit,
  onUpdateMember,
  onRemoveMember,
}: MembersWorkspaceProps) {
  const [mode, setMode] = useState<MembersWorkspaceMode>('list');
  const [listingView, setListingView] = useState<ListingViewMode>('table');
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [editSections, setEditSections] = useState<string[]>([]);
  const [editInstruments, setEditInstruments] = useState<string[]>([]);
  const [editingFields, setEditingFields] = useState(false);
  const [savingFields, setSavingFields] = useState(false);
  const [memberEditForm, setMemberEditForm] = useState<MemberEditForm>(initialMemberEditForm);

  const selectedMember = useMemo(
    () => members.find((member) => member.id === selectedMemberId) ?? null,
    [members, selectedMemberId]
  );

  const canEditSelected = canManage && selectedMember && (canManageRoles
    || (selectedMember.membership_role === 'member' && !selectedMember.management_permissions
      && selectedMember.user_id !== selectedGroupOwnerId));

  useEffect(() => {
    setEditSections(selectedMember ? memberSections(selectedMember) : []);
    setEditInstruments(selectedMember ? memberInstruments(selectedMember) : []);
  }, [selectedMember]);

  useEffect(() => {
    setSelectedMemberId((previous) => {
      if (previous && members.some((member) => member.id === previous)) {
        return previous;
      }

      return members[0]?.id ?? null;
    });
  }, [members]);

  useEffect(() => {
    if (!selectedMember) {
      setMemberEditForm(initialMemberEditForm);
      return;
    }

    setMemberEditForm({
      membershipRole: selectedMember.membership_role,
      status: selectedMember.status,
      section: memberSections(selectedMember).map(musicLabel).join(', ') || '',
      instrument: memberInstruments(selectedMember).map(musicLabel).join(', ') || '',
    });
  }, [selectedMember]);

  useEffect(() => {
    if (!selectedMember && mode !== 'create') {
      setMode('list');
    }
  }, [mode, selectedMember]);

  return (
    <section className="workspace-panel admin-panel">
      <header className="workspace-head admin-head">
        <div>
          <h2>{t("Membros", "Members")}</h2>
          <p className="subtitle">{t("Listagem de membros com detalhe e acoes de administracao.", "Ensemble member profiles and management.")}</p>
        </div>

        <div className="summary-row">
          {mode === 'list' ? (
            <>
              <button
                className="ghost icon-action"
                type="button"
                onClick={onRefresh}
                disabled={loadingMembers || !selectedGroupId}
              >
                <UiIcon name="refresh" />
                <span>{loadingMembers ? t("A atualizar...", "Refreshing…") : t("Atualizar", "Refresh")}</span>
              </button>
              <button
                className="ghost icon-action"
                type="button"
                onClick={() => setMode('create')}
                disabled={!selectedGroupId || !canManage}
              >
                <UiIcon name="plus" />
                <span>{t("Convidar membro", "Invite member")}</span>
              </button>
              {canManage && selectedGroupId ? <button type="button" className="ghost" onClick={() => setEditingFields(!editingFields)}>{t("Campos das fichas", "Profile fields")}</button> : null}
            </>
          ) : mode === 'detail' ? (
            <>
              <button className="ghost icon-action" type="button" onClick={() => setMode('list')}>
                <UiIcon name="arrow-left" />
                <span>{t("Voltar a lista", "Back to list")}</span>
              </button>
              <button
                className="ghost icon-action"
                type="button"
                onClick={() => setMode('edit')}
                disabled={!canEditSelected}
              >
                <UiIcon name="edit" />
                <span>{t("Editar", "Edit")}</span>
              </button>
              <button
                type="button"
                className="tiny danger icon-action"
                disabled={!canEditSelected || selectedMember?.user_id === selectedGroupOwnerId}
                onClick={() => selectedMember && onRemoveMember(selectedMember)}
              >
                <UiIcon name="trash" />
                <span>{t("Eliminar", "Delete")}</span>
              </button>
            </>
          ) : mode === 'edit' ? (
            <button className="ghost icon-action" type="button" onClick={() => setMode('detail')}>
              <UiIcon name="arrow-left" />
              <span>{t("Voltar ao detalhe", "Back to details")}</span>
            </button>
          ) : (
            <button className="ghost icon-action" type="button" onClick={() => setMode('list')}>
              <UiIcon name="arrow-left" />
              <span>{t("Voltar a lista", "Back to list")}</span>
            </button>
          )}
        </div>
      </header>

      {editingFields && canManage ? (
        <article className="workspace-card">
          <form className="form" key={selectedGroupId} onSubmit={async (event) => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            const fields = String(values.get('member_fields')).split('\n').map((field) => field.trim()).filter(Boolean);
            setSavingFields(true);
            try {
              if (await onSaveFields(fields)) setEditingFields(false);
            } finally {
              setSavingFields(false);
            }
          }}>
            <label>{t("Campos personalizados, um por linha", "Custom fields, one per line")}<textarea name="member_fields" rows={5} defaultValue={memberFields.join('\n')} /></label>
            <div className="summary-row"><button type="submit" disabled={savingFields}>{t("Guardar campos", "Save fields")}</button><button className="ghost" type="button" onClick={() => setEditingFields(false)}>{t("Cancelar", "Cancel")}</button></div>
          </form>
        </article>
      ) : null}
      {mode === 'list' ? (
        !selectedGroupId ? (
          <article className="workspace-card">
            <p className="muted">{t("Seleciona um grupo para gerir membros.", "Select an ensemble to manage its members.")}</p>
          </article>
        ) : members.length === 0 ? (
          <article className="workspace-card">
            <p className="muted">{t("Sem membros neste grupo.", "No members in this ensemble.")}</p>
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
                      <th>{t("Nome", "Name")}</th>
                      <th>{t("Papel", "Role")}</th>
                      <th>{t("Estado", t("Status", "Status"))}</th>
                      <th>{t("Instrumento", "Instrument")}</th>
                      <th>{t("Acoes", "Actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className={selectedMemberId === member.id ? 'selected' : ''}>
                        <td>
                          <div className="table-primary">
                            <strong>{member.user?.name ?? 'Sem nome'}</strong>
                            <small>{member.user?.email ?? 'Sem email'}</small>
                          </div>
                        </td>
                        <td>{member.membership_role}</td>
                        <td>
                          <span className={`status-chip ${member.status === 'active' ? 'ok' : 'mute'}`}>
                            {member.status}
                          </span>
                        </td>
                        <td>{memberInstruments(member).map(musicLabel).join(', ') || '-'}</td>
                        <td className="cell-actions">
                          <button
                            type="button"
                            className="tiny icon-only"
                            onClick={() => {
                              setSelectedMemberId(member.id);
                              setMode('detail');
                            }}
                            aria-label={`Ver detalhe do membro ${member.user?.name ?? 'sem nome'}`}
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
                {members.map((member) => (
                  <article
                    key={member.id}
                    className={`entity-card${selectedMemberId === member.id ? ' selected' : ''}`}
                  >
                    <div>
                      <h4>{member.user?.name ?? 'Sem nome'}</h4>
                      <p>{member.user?.email ?? 'Sem email'}</p>
                      <p>
                        {member.membership_role} | {memberInstruments(member).map(musicLabel).join(', ') || 'Sem instrumento'}
                      </p>
                    </div>
                    <div className="entity-card-actions">
                      <span className={`status-chip ${member.status === 'active' ? 'ok' : 'mute'}`}>
                        {member.status}
                      </span>
                      <button
                        type="button"
                        className="tiny icon-action"
                        onClick={() => {
                          setSelectedMemberId(member.id);
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
          {!selectedMember ? (
            <p className="muted">{t("Seleciona um membro na listagem.", "Select a member from the list.")}</p>
          ) : (
            <div className="detail-list">
              <p>
                <strong>{t("Nome:", "Name:")}</strong> {selectedMember.user?.name ?? 'Sem nome'}
              </p>
              <p>
                <strong>{t("Email:", "Email:")}</strong> {selectedMember.user?.email ?? 'Sem email'}
              </p>
              <p>
                <strong>{t("Papel:", "Role:")}</strong> {selectedMember.membership_role}
              </p>
              <p>
                <strong>{t("Estado:", t("Status:", "Status:"))}</strong> {selectedMember.status}
              </p>
              <p>
                <strong>{t("Secao:", "Section:")}</strong> {memberSections(selectedMember).map(musicLabel).join(', ') || 'Sem secao'}
              </p>
              <p>
                <strong>{t("Instrumento:", "Instrument:")}</strong> {memberInstruments(selectedMember).map(musicLabel).join(', ') || 'Sem instrumento'}
              </p>
            </div>
          )}
        </article>
      ) : null}

      {mode === 'edit' && canEditSelected ? (
        <article className="workspace-card">
          <form
            className="form"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!selectedMember) {
                return;
              }

              const values = new FormData(event.currentTarget);
              const updated = await onUpdateMember(selectedMember, {
                custom_fields: Object.fromEntries(memberFields.map((field) => [field, String(values.get(`field-${field}`) ?? '').trim() || null])),
                ...(canChangePermissions && selectedMember.user_id !== selectedGroupOwnerId ? {
                  management_permissions: values.has('limited') ? values.getAll('permissions') as ManagementArea[] : null,
                } : {}),
                membership_role: memberEditForm.membershipRole,
                status: memberEditForm.status,
                sections: editSections,
                instruments: editInstruments,
              });

              if (updated) {
                setMode('detail');
              }
            }}
          >
            <h3>{t("Editar membro", "Edit member")}</h3>
            <label>
              {t("Papel", "Role")}
              <select
                value={memberEditForm.membershipRole}
                onChange={(event) =>
                  setMemberEditForm((previous) => ({
                    ...previous,
                    membershipRole: event.target.value as MemberEditForm['membershipRole'],
                  }))
                }
                disabled={!selectedMember || !canManageRoles || selectedMember.user_id === selectedGroupOwnerId}
              >
                <option value="member">{t("Membro", "Member")}</option>
                <option value="admin">{t("Administrador", "Administrator")}</option>
                <option value="board">{t("Direcao", "Board")}</option>
                <option value="conductor">{t("Maestro", "Conductor")}</option>
              </select>
            </label>

            <label>
              {t("Estado", t("Status", "Status"))}
              <select
                value={memberEditForm.status}
                onChange={(event) =>
                  setMemberEditForm((previous) => ({
                    ...previous,
                    status: event.target.value as MemberEditForm['status'],
                  }))
                }
                disabled={!selectedMember || selectedMember.user_id === selectedGroupOwnerId}
              >
                <option value="invited">{t("Convidado", "Invited")}</option>
                <option value="active">{t("Ativo", "Active")}</option>
                <option value="inactive">{t("Inativo", "Inactive")}</option>
              </select>
            </label>

            <MusicChoices label={t('Naipes', 'Sections')} groups={sectionGroups} value={editSections} onChange={setEditSections} />

            <MusicChoices label={t('Instrumentos e vozes', 'Instruments and voices')} groups={instrumentGroups} value={editInstruments} onChange={setEditInstruments} />

            {memberFields.map((field) => (
              <label key={field}>{field}<input name={`field-${field}`} maxLength={1000} defaultValue={selectedMember?.custom_fields?.[field] ?? ''} /></label>
            ))}
            {canChangePermissions && selectedMember && selectedMember.user_id !== selectedGroupOwnerId ? (
              <fieldset>
                <legend>{t("Permissões de gestão", "Management permissions")}</legend>
                <label className="checkbox-row"><input name="limited" type="checkbox" defaultChecked={selectedMember.management_permissions != null} />{t("Personalizar permissões", "Customise permissions")}</label>
                {Object.entries(managementAreas).map(([area, label]) => (
                  <label className="checkbox-row" key={area}><input name="permissions" value={area} type="checkbox" defaultChecked={selectedMember.management_permissions?.includes(area as ManagementArea)} />{label}</label>
                ))}
              </fieldset>
            ) : null}
            <button type="submit" className="icon-action" disabled={updatingMember || !selectedMember}>
              <UiIcon name="check" />
              <span>{updatingMember ? t("A guardar...", "Saving…") : t("Guardar alteracoes", "Save changes")}</span>
            </button>
          </form>
        </article>
      ) : null}

      {mode === 'create' ? (
        <article className="workspace-card">
          <form
            className="form"
            onSubmit={async (event) => {
              const invited = await onInviteSubmit(event);
              if (invited) {
                setMode('list');
              }
            }}
          >
            <h3>{t("Convidar membro", "Invite member")}</h3>
            <p>{t("Usa o email associado à conta GesBanda do músico.", "Use the email address of the musician’s GesBanda account.")}</p>
            <label>
              Email
              <input
                type="email"
                required
                value={memberForm.email}
                onChange={(event) =>
                  setMemberForm((previous) => ({ ...previous, email: event.target.value }))
                }
                disabled={!selectedGroupId}
              />
            </label>



            <label>
              {t("Papel", "Role")}
              <select
                value={memberForm.membershipRole}
                onChange={(event) =>
                  setMemberForm((previous) => ({
                    ...previous,
                    membershipRole: event.target.value as MemberForm['membershipRole'],
                  }))
                }
                disabled={!selectedGroupId}
              >
                <option value="member">{t("Membro", "Member")}</option>
                <option value="admin">{t("Administrador", "Administrator")}</option>
                <option value="board">{t("Direcao", "Board")}</option>
                <option value="conductor">{t("Maestro", "Conductor")}</option>
              </select>
            </label>

            <label>
              {t("Estado", t("Status", "Status"))}
              <select
                value={memberForm.status}
                onChange={(event) =>
                  setMemberForm((previous) => ({
                    ...previous,
                    status: event.target.value as MemberForm['status'],
                  }))
                }
                disabled={!selectedGroupId}
              >
                <option value="invited">{t("Convidado", "Invited")}</option>
                <option value="active">{t("Ativo", "Active")}</option>
                <option value="inactive">{t("Inativo", "Inactive")}</option>
              </select>
            </label>

            <MusicChoices label={t('Naipes', 'Sections')} groups={sectionGroups} value={memberForm.sections ?? []} onChange={(sections) => setMemberForm((previous) => ({ ...previous, sections }))} />

            <MusicChoices label={t('Instrumentos e vozes', 'Instruments and voices')} groups={instrumentGroups} value={memberForm.instruments ?? []} onChange={(instruments) => setMemberForm((previous) => ({ ...previous, instruments }))} />

            <button type="submit" className="icon-action" disabled={submittingMember || !selectedGroupId}>
              <UiIcon name="plus" />
              <span>{submittingMember ? t("A enviar...", "Sending…") : t("Convidar membro", "Invite member")}</span>
            </button>
          </form>
        </article>
      ) : null}
    </section>
  );
}
