// ============================================
// Type definitions for the Family Tree App
// ============================================

export interface Family {
  id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  full_name: string;
  nickname: string | null;
  gender: 'male' | 'female';
  birth_place: string | null;
  birth_date: string | null;
  death_date: string | null;
  is_alive: boolean;
  biography: string | null;
  phone: string | null;
  email: string | null;
  photo_url: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  father_id: string | null;
  mother_id: string | null;
  spouse_id: string | null;
  generation: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface FamilyAccess {
  id: string;
  user_id: string;
  family_id: string;
  role: 'admin' | 'editor' | 'viewer';
  created_at: string;
}

export type FamilyMemberInsert = Omit<FamilyMember, 'id' | 'created_at' | 'updated_at'>;
export type FamilyMemberUpdate = Partial<FamilyMemberInsert>;

export interface FamilyMemberWithRelations extends FamilyMember {
  father?: FamilyMember | null;
  mother?: FamilyMember | null;
  spouse?: FamilyMember | null;
  children?: FamilyMember[];
  siblings?: FamilyMember[];
}
