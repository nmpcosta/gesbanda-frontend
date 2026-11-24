import type {
  CreateEventInput,
  CreateGroupInput,
  GroupMemberSummary,
} from './types';

export type AuthMode = 'login' | 'register';

export type WorkspaceView =
  | 'overview'
  | 'agenda'
  | 'attendance'
  | 'communication'
  | 'inventory'
  | 'payments'
  | 'vacancies'
  | 'manage-vacancies'
  | 'stage-plans'
  | 'societies'
  | 'reminders'
  | 'groups'
  | 'events'
  | 'members'
  | 'repertoire'
  | 'files'
  | 'group-licenses'
  | 'platform-licenses'
  | 'history';

export type SocietySection = 'groups' | 'members' | 'dues' | 'notices' | 'documents' | 'sepa' | 'inventory' | 'events';

export type LoginForm = {
  email: string;
  password: string;
};

export type RegisterForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

export type GroupForm = {
  name: string;
  groupType: CreateGroupInput['group_type'];
  location: string;
  description: string;
};

export type EventForm = {
  title: string;
  eventType: CreateEventInput['event_type'];
  startsAt: string;
  endsAt: string;
  location: string;
  description: string;
};

export type MemberForm = {
  email: string;
  name: string;
  membershipRole: GroupMemberSummary['membership_role'];
  section: string;
  instrument: string;
  sections?: string[];
  instruments?: string[];
  status: GroupMemberSummary['status'];
};

export type PieceForm = {
  title: string;
  composer: string;
  arranger: string;
  difficultyLevel: string;
  notes: string;
};

export type EventPieceForm = {
  repertoirePieceId: string;
  pieceOrder: string;
  notes: string;
};

export type AssetForm = {
  title: string;
  assetType: string;
  instrument: string;
  eventId: string;
  repertoirePieceId: string;
  file: File | null;
};

export type DocumentForm = {
  title: string;
  documentType: string;
  category: string;
  relevance: string;
  file: File | null;
};

export type RsvpSummary = {
  yes: number;
  no: number;
  maybe: number;
};
