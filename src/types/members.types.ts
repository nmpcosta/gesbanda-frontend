import type { ManagementArea } from '../permissions';

export type GroupMemberSummary = {
  id: number;
  group_id: number;
  user_id: number;
  membership_role: 'admin' | 'member' | 'board' | 'conductor';
  section: string | null;
  instrument: string | null;
  sections?: string[] | null;
  instruments?: string[] | null;
  status: 'invited' | 'active' | 'inactive';
  joined_at: string | null;
  custom_fields?: Record<string, string | null> | null;
  management_permissions?: ManagementArea[] | null;
  user?: {
    id: number;
    name: string;
    email: string;
  };
};

export type GroupMembersResponse = {
  data: GroupMemberSummary[];
};

export type GroupMemberResponse = {
  data: GroupMemberSummary;
};

export type CreateMemberInput = {
  email: string;
  name?: string;
  membership_role: GroupMemberSummary['membership_role'];
  section?: string;
  instrument?: string;
  sections?: string[];
  instruments?: string[];
  status?: GroupMemberSummary['status'];
};

export type UpdateMemberInput = {
  membership_role?: GroupMemberSummary['membership_role'];
  section?: string | null;
  instrument?: string | null;
  sections?: string[];
  instruments?: string[];
  status?: GroupMemberSummary['status'];
  custom_fields?: Record<string, string | null>;
  management_permissions?: ManagementArea[] | null;
};
