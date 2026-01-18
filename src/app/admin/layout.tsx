import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()

  if (!data.user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', data.user.id)
    .single()

  if (!profile?.is_admin) redirect('/')

  return (
    <div>
      <nav>
        <a href="/admin/plans">Plans</a> | 
        <a href="/admin/courses">Courses</a> | 
        <a href="/admin/lessons">Lessons</a> | 
        <a href="/admin/codes">Codes</a> | 
        <a href="/admin/users">Users</a>
      </nav>
      <hr />
      {children}
    </div>
  )
}
