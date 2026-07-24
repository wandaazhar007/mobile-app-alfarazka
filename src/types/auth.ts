// Identik dengan frontend/src/types/auth.ts — kontrak response dari
// POST /api/auth/sync / GET /api/auth/me sama persis di kedua platform.
export type Role = 'owner' | 'admin' | 'seller';

export interface AppUser {
  id: string;
  branchId: string | null;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  isVendor?: boolean;
  mustChangePassword: boolean;
}
