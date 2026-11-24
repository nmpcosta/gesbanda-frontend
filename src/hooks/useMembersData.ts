import { t } from '../language';
import { FormEvent, useEffect, useState } from 'react';
import { inviteGroupMember, listGroupMembers, removeGroupMember, updateGroupMember } from '../auth';
import type { GroupMemberSummary, UpdateMemberInput } from '../types';
import type { MemberForm } from '../ui-types';

type UseMembersDataOptions = {
  token: string | null;
  selectedGroupId: number | null;
  setError: (message: string | null) => void;
  setSuccess: (message: string | null) => void;
};

const initialMemberForm: MemberForm = {
  email: '',
  name: '',
  membershipRole: 'member',
  section: '',
  instrument: '',
  status: 'invited',
};

export function useMembersData({
  token,
  selectedGroupId,
  setError,
  setSuccess,
}: UseMembersDataOptions) {
  const [members, setMembers] = useState<GroupMemberSummary[]>([]);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(false);
  const [submittingMember, setSubmittingMember] = useState<boolean>(false);
  const [updatingMember, setUpdatingMember] = useState<boolean>(false);
  const [memberForm, setMemberForm] = useState<MemberForm>(initialMemberForm);

  async function loadMembers(currentToken: string, groupId: number) {
    setLoadingMembers(true);

    try {
      const response = await listGroupMembers(currentToken, groupId);
      setMembers(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Nao foi possivel carregar membros.", "Could not load the members."));
    } finally {
      setLoadingMembers(false);
    }
  }

  useEffect(() => {
    if (!token || !selectedGroupId) {
      setMembers([]);
      return;
    }

    loadMembers(token, selectedGroupId);
  }, [token, selectedGroupId]);

  async function handleInviteMemberSubmit(event: FormEvent): Promise<boolean> {
    event.preventDefault();

    if (!token || !selectedGroupId) {
      return false;
    }

    setSubmittingMember(true);
    setError(null);
    setSuccess(null);

    try {
      await inviteGroupMember(token, selectedGroupId, {
        email: memberForm.email.trim(),
        name: memberForm.name.trim() || undefined,
        membership_role: memberForm.membershipRole,
        section: memberForm.section.trim() || undefined,
        instrument: memberForm.instrument.trim() || undefined,
        sections: memberForm.sections,
        instruments: memberForm.instruments,
        status: memberForm.status,
      });

      await loadMembers(token, selectedGroupId);
      setMemberForm(initialMemberForm);
      setSuccess(t("Membro convidado/atualizado com sucesso.", "Member invitation saved."));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Falha ao convidar membro.", "Could not invite the member."));
      return false;
    } finally {
      setSubmittingMember(false);
    }
  }

  async function handleUpdateMember(
    member: GroupMemberSummary,
    input: UpdateMemberInput
  ): Promise<boolean> {
    if (!token || !selectedGroupId) {
      return false;
    }

    setUpdatingMember(true);
    setError(null);
    setSuccess(null);

    try {
      await updateGroupMember(token, selectedGroupId, member.id, input);
      await loadMembers(token, selectedGroupId);
      setSuccess(t("Membro atualizado com sucesso.", "Member updated."));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Falha ao atualizar membro.", "Could not update the member."));
      return false;
    } finally {
      setUpdatingMember(false);
    }
  }

  async function handleToggleMemberStatus(
    member: GroupMemberSummary,
    status: GroupMemberSummary['status']
  ) {
    await handleUpdateMember(member, { status });
  }

  async function handleRemoveMember(member: GroupMemberSummary) {
    if (!token || !selectedGroupId) {
      return;
    }

    const canContinue =
      typeof window === 'undefined' ||
      window.confirm(`Remover ${member.user?.name ?? member.user?.email ?? 'membro'}?`);

    if (!canContinue) {
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await removeGroupMember(token, selectedGroupId, member.id);
      await loadMembers(token, selectedGroupId);
      setSuccess(t("Membro removido com sucesso.", "Member removed."));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Falha ao remover membro.", "Could not remove the member."));
    }
  }

  return {
    members,
    loadingMembers,
    submittingMember,
    updatingMember,
    memberForm,
    setMemberForm,
    loadMembers,
    handleInviteMemberSubmit,
    handleUpdateMember,
    handleToggleMemberStatus,
    handleRemoveMember,
  };
}
