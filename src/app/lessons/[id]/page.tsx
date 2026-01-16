import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireSubscription } from '@/lib/subscription/guards'
import { redirect } from 'next/navigation'

export default async function LessonPage({ params }: any) {
  const subscription = await requireSubscription()
  if (!subscription) redirect('/activate-code')

  const supabase = await createSupabaseServerClient()

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', params.id)
    .single()

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-bold">{lesson.title}</h1>

      <iframe
        src={lesson.video_url}
        className="w-full aspect-video rounded"
        allowFullScreen
      />

      {lesson.pdf_url && (
        <iframe
          src={lesson.pdf_url}
          className="w-full h-[600px] rounded"
        />
      )}
    </main>
  )
}
