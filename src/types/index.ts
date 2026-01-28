// types/index.ts
export interface UserProfile {
  id: string
  full_name: string
  email: string
  phone: string
  grade: 'first' | 'second' | 'third'
  section: 'general' | 'scientific' | 'literary' | 'science' | 'math' | null
  parent_phone: string
  governorate: string
  city: string
  school: string
  created_at: string
  role: string;
}

export interface Package {
  id: string
  name: string
  description: string
  price: number
  image_url: string | null
  grade: 'first' | 'second' | 'third'
  type: 'weekly' | 'monthly' | 'term' | 'offer'
  lecture_count: number
  is_active: boolean
  created_at: string
}


export interface UserPackage {
  id: string
  user_id: string
  package_id: string
  purchased_at: string
  expires_at: string | null
  is_active: boolean
  packages: Package
}

export interface Wallet {
  id: string
  user_id: string
  balance: number
  created_at: string
  updated_at: string
}

export interface Code {
  id: string
  code: string
  package_id: string
  grade: string
  is_used: boolean
  used_by: string | null
  used_at: string | null
  created_at: string
  expires_at: string | null
  packages?: {
    name: string;
    grade: string;
    type: string;
  };
  profiles?: {
    full_name: string;
    email: string;
  };
}

export interface Notification {
  id: string
  user_id: string | null
  title: string
  message: string
  type: 'info' | 'success' | 'warning'
  is_read: boolean
  created_at: string
  target_grade: string | null
  target_section: string | null
}

export interface Grade {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export interface PasswordChangeRequest {
  identifier: string;
  newPassword: string;
}

export interface ApiResponse<T = any> {
  data: T | null;
  error: string | null;
  success?: boolean;
}

