import { useMemo } from 'react';
import { useEventsData } from './useEventsData';
import { useFilesData } from './useFilesData';
import { useGroupsData } from './useGroupsData';
import { useMembersData } from './useMembersData';
import { useRepertoireData } from './useRepertoireData';

type UseDashboardDataOptions = {
  token: string | null;
  platform?: boolean;
  setError: (message: string | null) => void;
  setSuccess: (message: string | null) => void;
};

export function useDashboardData({ token, platform, setError, setSuccess }: UseDashboardDataOptions) {
  const groupsData = useGroupsData({ token, setError, setSuccess });
  const selectedGroupId = groupsData.selectedGroup?.membership_status === 'invited' ? null : groupsData.selectedGroupId;

  const eventsData = useEventsData({
    token,
    selectedGroupId,
    setError,
    setSuccess,
  });

  const membersData = useMembersData({
    token,
    selectedGroupId,
    setError,
    setSuccess,
  });

  const repertoireData = useRepertoireData({
    token,
    selectedGroupId,
    selectedEventId: eventsData.selectedEventId,
    setError,
    setSuccess,
  });

  const filesData = useFilesData({
    token,
    selectedGroupId,
    setError,
    setSuccess,
  });

  const events = useMemo(
    () => eventsData.events.filter((event) => event.group_id === selectedGroupId),
    [eventsData.events, selectedGroupId]
  );
  const members = useMemo(
    () => membersData.members.filter((member) => member.group_id === selectedGroupId),
    [membersData.members, selectedGroupId]
  );
  const pieces = useMemo(
    () => repertoireData.pieces.filter((piece) => piece.group_id === selectedGroupId),
    [repertoireData.pieces, selectedGroupId]
  );
  const assets = useMemo(
    () => filesData.assets.filter((asset) => asset.group_id === selectedGroupId),
    [filesData.assets, selectedGroupId]
  );
  const documents = useMemo(
    () => filesData.documents.filter((document) => document.group_id === selectedGroupId),
    [filesData.documents, selectedGroupId]
  );
  const selectedEvent = eventsData.selectedEvent?.group_id === selectedGroupId ? eventsData.selectedEvent : null;

  async function handleRefreshGroupContext() {
    if (!token || !selectedGroupId) {
      return;
    }

    setError(null);

    await Promise.all([
      eventsData.loadEvents(token, selectedGroupId),
      membersData.loadMembers(token, selectedGroupId),
      repertoireData.loadPieces(token, selectedGroupId),
      filesData.loadAssets(token, selectedGroupId),
      filesData.loadDocuments(token, selectedGroupId),
    ]);
  }

  return {
    groups: groupsData.groups,
    groupsCount: groupsData.groupsCount,
    selectedGroup: groupsData.selectedGroup,
    selectedGroupId: groupsData.selectedGroupId,
    setSelectedGroupId: groupsData.setSelectedGroupId,

    events,
    selectedEvent,
    selectedEventId: selectedEvent?.id ?? null,
    setSelectedEventId: eventsData.setSelectedEventId,
    rsvpSummary: selectedEvent ? eventsData.rsvpSummary : null,

    members,

    pieces,
    eventPieces: selectedEvent ? repertoireData.eventPieces : [],

    assets,
    documents,

    loadingGroups: groupsData.loadingGroups,
    loadingEvents: eventsData.loadingEvents,
    loadingMembers: membersData.loadingMembers,
    loadingPieces: repertoireData.loadingPieces,
    loadingEventPieces: repertoireData.loadingEventPieces,
    loadingAssets: filesData.loadingAssets,
    loadingDocuments: filesData.loadingDocuments,
    loadingSummary: eventsData.loadingSummary,

    submittingGroup: groupsData.submittingGroup,
    updatingGroup: groupsData.updatingGroup,
    deletingGroup: groupsData.deletingGroup,
    creatingQuickGroup: groupsData.creatingQuickGroup,
    submittingEvent: eventsData.submittingEvent,
    updatingEvent: eventsData.updatingEvent,
    deletingEvent: eventsData.deletingEvent,
    submittingMember: membersData.submittingMember,
    updatingMember: membersData.updatingMember,
    submittingPiece: repertoireData.submittingPiece,
    submittingEventPiece: repertoireData.submittingEventPiece,
    submittingAsset: filesData.submittingAsset,
    submittingDocument: filesData.submittingDocument,
    submittingRsvpId: eventsData.submittingRsvpId,

    groupForm: groupsData.groupForm,
    setGroupForm: groupsData.setGroupForm,
    groupEditForm: groupsData.groupEditForm,
    setGroupEditForm: groupsData.setGroupEditForm,

    eventForm: eventsData.eventForm,
    setEventForm: eventsData.setEventForm,
    eventEditForm: eventsData.eventEditForm,
    setEventEditForm: eventsData.setEventEditForm,

    memberForm: membersData.memberForm,
    setMemberForm: membersData.setMemberForm,

    pieceForm: repertoireData.pieceForm,
    setPieceForm: repertoireData.setPieceForm,

    eventPieceForm: repertoireData.eventPieceForm,
    setEventPieceForm: repertoireData.setEventPieceForm,

    assetForm: filesData.assetForm,
    setAssetForm: filesData.setAssetForm,

    documentForm: filesData.documentForm,
    setDocumentForm: filesData.setDocumentForm,

    handleCreateGroupSubmit: groupsData.handleCreateGroupSubmit,
    handleUpdateGroupSubmit: groupsData.handleUpdateGroupSubmit,
    handleDeleteSelectedGroup: groupsData.handleDeleteSelectedGroup,
    handleQuickCreateGroup: groupsData.handleQuickCreateGroup,
    handleCreateEventSubmit: eventsData.handleCreateEventSubmit,
    handleUpdateEventSubmit: eventsData.handleUpdateEventSubmit,
    handleDeleteSelectedEvent: eventsData.handleDeleteSelectedEvent,
    handleInviteMemberSubmit: membersData.handleInviteMemberSubmit,
    handleUpdateMember: membersData.handleUpdateMember,
    handleToggleMemberStatus: membersData.handleToggleMemberStatus,
    handleRemoveMember: membersData.handleRemoveMember,
    handleCreatePieceSubmit: repertoireData.handleCreatePieceSubmit,
    handleAttachPieceSubmit: repertoireData.handleAttachPieceSubmit,
    handleDetachPiece: repertoireData.handleDetachPiece,
    handleDeletePiece: repertoireData.handleDeletePiece,
    handleUploadAssetSubmit: filesData.handleUploadAssetSubmit,
    handleUploadDocumentSubmit: filesData.handleUploadDocumentSubmit,
    handleDeleteFile: filesData.handleDeleteFile,
    handleRsvp: eventsData.handleRsvp,
    handleRefreshGroups: groupsData.handleRefreshGroups,
    handleRefreshGroupContext,

    loadMembers: membersData.loadMembers,
    loadAssets: filesData.loadAssets,
    loadPieces: repertoireData.loadPieces,
  };
}
