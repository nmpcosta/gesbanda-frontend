import { t } from '../language';
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { createGroup, deleteGroup, listGroups, updateGroup } from '../auth';
import type { GroupSummary } from '../types';
import type { GroupForm } from '../ui-types';

type UseGroupsDataOptions = {
  token: string | null;
  platform?: boolean;
  setError: (message: string | null) => void;
  setSuccess: (message: string | null) => void;
};

export type GroupEditForm = GroupForm & {
  isActive: boolean;
};

type QuickCreateGroupInput = {
  name: string;
  groupType: GroupForm['groupType'];
  location?: string;
};

const initialGroupForm: GroupForm = {
  name: '',
  groupType: 'band',
  location: '',
  description: '',
};

const initialGroupEditForm: GroupEditForm = {
  ...initialGroupForm,
  isActive: true,
};

export function useGroupsData({ token, platform = false, setError, setSuccess }: UseGroupsDataOptions) {
  const scope = token ? `${token}:${platform}` : null;
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const requestId = useRef(0);
  const [groupList, setGroupList] = useState<{ scope: string | null; data: GroupSummary[] }>({
    scope: null,
    data: [],
  });
  const [selection, setSelectedGroupId] = useState<number | null>(null);
  const groups = useMemo(() => (scope === groupList.scope ? groupList.data : []), [scope, groupList]);
  const selectedGroupId = scope === groupList.scope ? selection : null;
  const [groupForm, setGroupForm] = useState<GroupForm>(initialGroupForm);
  const [groupEditForm, setGroupEditForm] = useState<GroupEditForm>(initialGroupEditForm);

  const [loadingGroups, setLoadingGroups] = useState<boolean>(false);
  const [submittingGroup, setSubmittingGroup] = useState<boolean>(false);
  const [updatingGroup, setUpdatingGroup] = useState<boolean>(false);
  const [deletingGroup, setDeletingGroup] = useState<boolean>(false);
  const [creatingQuickGroup, setCreatingQuickGroup] = useState<boolean>(false);

  const groupsCount = useMemo(() => groups.length, [groups]);
  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId]
  );

  async function loadGroups(currentToken: string, preferredGroupId: number | null = null) {
    const id = ++requestId.current;
    setLoadingGroups(true);

    try {
      const response = await listGroups(currentToken, platform);
      if (scopeRef.current !== scope || requestId.current !== id) {
        return;
      }

      setGroupList({ scope, data: response.data });
      setSelectedGroupId((previous) => {
        if (preferredGroupId && response.data.some((group) => group.id === preferredGroupId)) {
          return preferredGroupId;
        }

        if (previous && response.data.some((group) => group.id === previous)) {
          return previous;
        }

        return response.data[0]?.id ?? null;
      });
    } catch (err) {
      if (scopeRef.current === scope && requestId.current === id) {
        setError(err instanceof Error ? err.message : t("Não foi possível carregar as bandas.", "Could not load the ensembles."));
      }
    } finally {
      if (scopeRef.current === scope && requestId.current === id) {
        setLoadingGroups(false);
      }
    }
  }

  useEffect(() => {
    if (!token) {
      setGroupList({ scope: null, data: [] });
      setLoadingGroups(false);
      setSelectedGroupId(null);
      setGroupEditForm(initialGroupEditForm);
      return;
    }

    loadGroups(token);
    setGroupForm(initialGroupForm);
  }, [token, platform]);

  useEffect(() => {
    if (!selectedGroup) {
      setGroupEditForm(initialGroupEditForm);
      return;
    }

    setGroupEditForm({
      name: selectedGroup.name,
      groupType: selectedGroup.group_type as GroupForm['groupType'],
      location: selectedGroup.location ?? '',
      description: selectedGroup.description ?? '',
      isActive: selectedGroup.is_active,
    });
  }, [selectedGroup]);

  async function handleCreateGroupSubmit(event: FormEvent, ownerEmail?: string): Promise<boolean> {
    event.preventDefault();

    if (!token) {
      return false;
    }

    setSubmittingGroup(true);
    setError(null);
    setSuccess(null);

    try {
      const values = new FormData(event.currentTarget as HTMLFormElement);
      const createdGroup = await createGroup(token, {
        name: groupForm.name.trim(),
        color: values.has('use_custom_color') ? String(values.get('group_color')) : undefined,
        group_type: groupForm.groupType,
        location: groupForm.location.trim() || undefined,
        description: groupForm.description.trim() || undefined,
        owner_email: ownerEmail?.trim() || undefined,
      }, platform);

      await loadGroups(token, createdGroup.data.id);
      setGroupForm(initialGroupForm);
      setSuccess(t("Grupo criado com sucesso.", "Ensemble created."));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Falha ao criar grupo.", "Could not create the ensemble."));
      return false;
    } finally {
      setSubmittingGroup(false);
    }
  }

  async function handleUpdateGroupSubmit(event: FormEvent): Promise<boolean> {
    event.preventDefault();

    if (!token || !selectedGroupId) {
      return false;
    }

    setUpdatingGroup(true);
    setError(null);
    setSuccess(null);

    try {
      await updateGroup(token, selectedGroupId, {
        name: groupEditForm.name.trim(),
        group_type: groupEditForm.groupType,
        location: groupEditForm.location.trim() || null,
        description: groupEditForm.description.trim() || null,
        is_active: groupEditForm.isActive,
        color: new FormData(event.currentTarget as HTMLFormElement).get('group_color')?.toString(),
        has_public_profile: new FormData(event.currentTarget as HTMLFormElement).has('public_profile'),
      });

      await loadGroups(token);
      setSuccess(t("Grupo atualizado com sucesso.", "Ensemble updated."));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Falha ao atualizar grupo.", "Could not update the ensemble."));
      return false;
    } finally {
      setUpdatingGroup(false);
    }
  }

  async function handleRefreshGroups() {
    if (!token) {
      return;
    }

    setError(null);
    await loadGroups(token);
  }

  async function handleQuickCreateGroup(input: QuickCreateGroupInput): Promise<boolean> {
    if (!token) {
      return false;
    }

    const normalizedName = input.name.trim();

    if (!normalizedName) {
      setError(t("Indica um nome para criar a banda.", "Enter a name to create the ensemble."));
      return false;
    }

    setCreatingQuickGroup(true);
    setError(null);
    setSuccess(null);

    try {
      const createdGroup = await createGroup(token, {
        name: normalizedName,
        group_type: input.groupType,
        location: input.location?.trim() || undefined,
      }, platform);

      await loadGroups(token, createdGroup.data.id);
      setSuccess(`Banda "${normalizedName}" criada com sucesso.`);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Falha ao criar banda.", "Could not create the ensemble."));
      return false;
    } finally {
      setCreatingQuickGroup(false);
    }
  }

  async function handleDeleteSelectedGroup() {
    if (!token || !selectedGroup) {
      return;
    }

    const canContinue =
      typeof window === 'undefined' || window.confirm(`Eliminar o grupo "${selectedGroup.name}"?`);

    if (!canContinue) {
      return;
    }

    setDeletingGroup(true);
    setError(null);
    setSuccess(null);

    try {
      await deleteGroup(token, selectedGroup.id);
      await loadGroups(token);
      setSuccess(t("Grupo eliminado com sucesso.", "Ensemble deleted."));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("Falha ao eliminar grupo.", "Could not delete the ensemble."));
    } finally {
      setDeletingGroup(false);
    }
  }

  return {
    groups,
    groupsCount,
    selectedGroup,
    selectedGroupId,
    setSelectedGroupId,
    groupForm,
    setGroupForm,
    groupEditForm,
    setGroupEditForm,
    loadingGroups,
    submittingGroup,
    updatingGroup,
    deletingGroup,
    creatingQuickGroup,
    loadGroups,
    handleCreateGroupSubmit,
    handleUpdateGroupSubmit,
    handleDeleteSelectedGroup,
    handleRefreshGroups,
    handleQuickCreateGroup,
  };
}
