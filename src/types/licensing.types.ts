export type LicensePlanInput = {
  name: string;
  price_cents: number;
  duration_days: number;
  is_active: boolean;
};

export type LicensePlan = LicensePlanInput & { id: number };

export type LicenseStatus = 'pending' | 'approved' | 'rejected' | 'revoked';

export type GroupLicense = {
  id: number;
  group_name: string;
  plan_name: string;
  price_cents: number;
  duration_days: number;
  reference: string;
  payment_instructions: string;
  status: LicenseStatus;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
};

export type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
};

export type LicensingResponse = {
  plans: LicensePlan[];
  licenses: Paginated<GroupLicense>;
  payments_enabled: boolean;
  has_pending_request?: boolean;
};

export type PlatformActivity = {
  id: number;
  description: string;
  group_name: string | null;
  actor: { id: number; name: string } | null;
  created_at: string;
};
