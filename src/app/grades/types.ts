export interface Grade {
  id: string
  name: string
  color_scheme: string
  created_at: string
}

export interface Package {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  type: 'weekly' | 'monthly' | 'term' | 'offer'
  is_active: boolean
  lectures_count: number
  created_at: string
}

export interface StudentPurchase {
  id: string
  student_id: string
  package_id: string
  purchase_date: string
  purchase_method: 'wallet' | 'code'
  code_used: string | null
  amount_paid: number
  status: string
  package: Package
}

export interface PackageCode {
  id: string
  code: string
  package_id: string
  grade_id: string
  is_used: boolean
  used_by: string | null
  used_at: string | null
  created_at: string
}

export interface Wallet {
  id: string
  student_id: string
  balance: number
  last_updated: string
}