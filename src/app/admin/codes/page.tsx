import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function CodesAdmin() {
  const supabase = await createSupabaseServerClient()

  const { data: codes } = await supabase
    .from('codes')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">الأكواد</h1>

      {codes?.map(code => (
        <div key={code.id} className="bg-gray-800 p-3 rounded mb-2">
          <p>{code.code}</p>
          <small>{code.is_used ? 'مستخدم' : 'متاح'}</small>
        </div>
      ))}
    </div>
  )
}
