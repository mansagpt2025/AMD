'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

type Lesson = {
  id: string
  title: string
  order_index: number
}

export default function LessonsDragList({
  initialLessons,
}: {
  initialLessons: Lesson[]
}) {
  const [lessons, setLessons] = useState(initialLessons)
  const supabase = createSupabaseBrowserClient()

  function onDragEnd(from: number, to: number) {
    if (to < 0 || to >= lessons.length) return

    const updated = [...lessons]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)

    const reordered = updated.map((l, i) => ({
      ...l,
      order_index: i,
    }))

    setLessons(reordered)

    reordered.forEach(l => {
      supabase
        .from('lessons')
        .update({ order_index: l.order_index })
        .eq('id', l.id)
    })
  }

  return (
    <ul>
      {lessons.map((l, i) => (
        <li
          key={l.id}
          draggable
          onDragStart={e =>
            e.dataTransfer.setData('index', i.toString())
          }
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            const from = Number(e.dataTransfer.getData('index'))
            onDragEnd(from, i)
          }}
          style={{
            padding: 10,
            marginBottom: 8,
            background: '#222',
            cursor: 'grab',
          }}
        >
          {l.title}
        </li>
      ))}
    </ul>
  )
}
