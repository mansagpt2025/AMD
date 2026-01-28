export interface PackageRow {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  created_at: string
}

export interface LectureRow {
  id: string
  package_id: string
  title: string
  description: string | null
  image_url: string | null
  order_number: number
  is_active: boolean
  created_at: string
  packages?: {
    name: string
  }
}

export interface ContentRow {
  id: string
  lecture_id: string
  type: string
  title: string
  description: string | null
  content_url: string | null
  max_attempts: number
  order_number: number
  is_active: boolean
  created_at: string
  lectures?: {
    title: string
  }
}
