import { createSupabaseServer } from '@/lib/supabase/server'

export default async function LecturePage({ params }: any) {
const supabase = await createSupabaseServer()

  const { data: contents } = await supabase
    .from('contents')
    .select('*')
    .eq('lecture_id', params.lectureId)
    .order('created_at')

  return (
    <div className="space-y-6">
      {contents?.map((c) => (
        <div key={c.id} className="border p-4 rounded">
          <h3 className="font-bold">{c.title}</h3>

          {c.type === 'video' && (
            <iframe
              src={c.resource_url}
              className="w-full h-64"
              allowFullScreen
            />
          )}

          {c.type === 'pdf' && (
            <a
              href={c.resource_url}
              target="_blank"
              className="text-blue-600"
            >
              فتح PDF
            </a>
          )}

          {c.type === 'exam' && (
            <a
              href={`/exams/${c.id}`}
              className="text-red-600"
            >
              دخول الامتحان
            </a>
          )}
        </div>
      ))}
    </div>
  )
}
