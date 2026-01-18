import { createSupabaseServerClient } from '@/lib/supabase/server'
import { requireActiveSubscription } from '@/lib/access'
import ProtectedVideo from '@/components/video/ProtectedVideo'
import { saveProgress } from './action'
import Link from 'next/link'

export default async function LessonPage({ params }: any) {
  const supabase = await createSupabaseServerClient()
  const { data: auth } = await supabase.auth.getUser()

  if (!auth.user) throw new Error('UNAUTHORIZED')

  await requireActiveSubscription(auth.user.id)

  const { data: lesson } = await supabase
    .from('lessons')
    .select('*')
    .eq('id', params.lessonId)
    .single()

  if (!lesson || !lesson.is_active) {
    throw new Error('LESSON_NOT_AVAILABLE')
  }

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('*')
    .eq('user_id', auth.user.id)
    .eq('lesson_id', lesson.id)
    .single()

  return (
    <div>
      <h1>{lesson.title}</h1>
      <p>{lesson.description}</p>

      <ProtectedVideo
        videoUrl={lesson.video_url}
        startAt={progress?.last_second ?? 0}
      />

      {lesson.pdf_url && (
        <iframe
          src={lesson.pdf_url}
          width="100%"
          height="600"
        />
      )}

      <Link href={`/lessons/${lesson.id}/exam`}>
        امتحان المحاضرة
      </Link>

      <form action={saveProgress}>
        <input type="hidden" name="lesson_id" value={lesson.id} />
        <input type="hidden" name="completed" value="true" />
        <button>إنهاء المحاضرة</button>
      </form>
    </div>
  )
}
