import { t } from '../../language';
﻿import type { FormEvent } from 'react';
import type { GroupMemberSummary } from '../../types';
import type { MemberForm } from '../../ui-types';

type MembersPanelProps = {
  selectedGroupId: number | null;
  selectedGroupOwnerId: number | undefined;
  members: GroupMemberSummary[];
  memberForm: MemberForm;
  submittingMember: boolean;
  loadingMembers: boolean;
  setMemberForm: (updater: (previous: MemberForm) => MemberForm) => void;
  onSubmit: (event: FormEvent) => void;
  onRefresh: () => void;
  onToggleStatus: (member: GroupMemberSummary, status: GroupMemberSummary['status']) => void;
  onRemove: (member: GroupMemberSummary) => void;
};

export function MembersPanel({
  selectedGroupId,
  selectedGroupOwnerId,
  members,
  memberForm,
  submittingMember,
  loadingMembers,
  setMemberForm,
  onSubmit,
  onRefresh,
  onToggleStatus,
  onRemove,
}: MembersPanelProps) {
  return (
    <article className="module-panel full-width">
      <div className="groups-header">
        <h2>{t("Membros", "Members")}</h2>
        <button
          className="ghost"
          type="button"
          onClick={onRefresh}
          disabled={loadingMembers || !selectedGroupId}
        >
          {loadingMembers ? t("A atualizar...", "Refreshing…") : t("Atualizar", "Refresh")}
        </button>
      </div>

      {!selectedGroupId ? (
        <p className="muted">{t("Seleciona um grupo para gerir membros.", "Select an ensemble to manage its members.")}</p>
      ) : members.length === 0 ? (
        <p className="muted">{t("Sem membros neste grupo.", "No members in this ensemble.")}</p>
      ) : (
        <ul className="groups-list">
          {members.map((member) => (
            <li key={member.id} className="group-item member-item">
              <div>
                <strong>{member.user?.name ?? 'Sem nome'}</strong>
                <p>{member.user?.email}</p>
                <p>
                  {member.membership_role} • {member.status}
                  {member.section ? ` • ${member.section}` : ''}
                  {member.instrument ? ` • ${member.instrument}` : ''}
                </p>
              </div>
              <div className="inline-controls">
                {member.status !== 'active' ? (
                  <button
                    type="button"
                    className="tiny"
                    onClick={() => onToggleStatus(member, 'active')}
                  >
                    {t("Ativar", "Activate")}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="tiny"
                    onClick={() => onToggleStatus(member, 'inactive')}
                  >
                    {t("Inativar", "Deactivate")}
                  </button>
                )}
                <button
                  type="button"
                  className="tiny"
                  disabled={member.user_id === selectedGroupOwnerId}
                  onClick={() => onRemove(member)}
                >
                  {t("Remover", "Remove")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h3>{t("Convidar membro", "Invite member")}</h3>
      <form className="form" onSubmit={onSubmit}>
        <label>
          Email
          <input
            type="email"
            required
            value={memberForm.email}
            onChange={(event) =>
              setMemberForm((previous) => ({ ...previous, email: event.target.value }))
            }
          />
        </label>

        <label>
          {t("Nome", "Name")}
          <input
            type="text"
            value={memberForm.name}
            onChange={(event) =>
              setMemberForm((previous) => ({ ...previous, name: event.target.value }))
            }
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
          >
            <option value="invited">{t("Convidado", "Invited")}</option>
            <option value="active">{t("Ativo", "Active")}</option>
            <option value="inactive">{t("Inativo", "Inactive")}</option>
          </select>
        </label>

        <label>
          {t("Naipe / Secao", "Section")}
          <input
            type="text"
            value={memberForm.section}
            onChange={(event) =>
              setMemberForm((previous) => ({ ...previous, section: event.target.value }))
            }
          />
        </label>

        <label>
          {t("Instrumento", "Instrument")}
          <input
            type="text"
            value={memberForm.instrument}
            onChange={(event) =>
              setMemberForm((previous) => ({ ...previous, instrument: event.target.value }))
            }
          />
        </label>

        <button type="submit" disabled={submittingMember || !selectedGroupId}>
          {submittingMember ? t("A enviar convite...", "Sending invitation…") : t("Convidar membro", "Invite member")}
        </button>
      </form>
    </article>
  );
}
