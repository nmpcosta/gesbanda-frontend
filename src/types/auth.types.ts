import type { GroupSummary } from './groups.types';

export type UserProfile = {
  first_name: string;
  last_name: string;
  photo_url: string | null;
  phone: string | null;
  instruments: string[];
  role_label: string | null;
  participation_status: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  is_platform_admin?: boolean;
  onboarding_completed_at?: string | null;
  profile?: UserProfile;
  groups?: GroupSummary[];
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type MeResponse = {
  user: User;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone?: string;
  instruments?: string[];
  role_label?: string;
};
