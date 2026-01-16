import { createSupabaseServerClient } from '@/lib/supabase/server'

export default async function PlansAdmin() {
  const supabase = await createSupabaseServerClient()

  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .order('created_at')

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">الباقات</h1>

      <table className="w-full">
        <thead>
          <tr>
            <th>الاسم</th>
            <th>المدة</th>
          </tr>
        </thead>
        <tbody>
          {plans?.map(plan => (
            <tr key={plan.id}>
              <td>{plan.name}</td>
              <td>{plan.duration_days} يوم</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
