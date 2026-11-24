import type { ManagementArea } from '../permissions';

export type GroupSummary = {
  id: number;
  owner_user_id: number;
  name: string;
  slug: string;
  group_type: string;
  color?: string;
  location: string | null;
  description: string | null;
  plan_tier: string;
  is_active: boolean;
  has_public_profile?: boolean;
  memberships_count?: number;
  can_manage?: boolean;
  membership_status?: 'invited' | 'active' | null;
  management_permissions?: ManagementArea[] | null;
  member_fields?: string[] | null;
  owner?: { id: number; name: string; email: string };
  current_license?: { id: number; plan_name: string; expires_at: string } | null;
};

export type GroupsResponse = {
  data: GroupSummary[];
};

export type GroupResponse = {
  data: GroupSummary;
};

export type CreateGroupInput = {
  name: string;
  group_type: 'band' | 'choir' | 'orchestra' | 'ensemble' | 'other';
  color?: string | null;
  location?: string | null;
  description?: string | null;
};

export type UpdateGroupInput = Partial<CreateGroupInput> & {
  is_active?: boolean;
  has_public_profile?: boolean;
};
