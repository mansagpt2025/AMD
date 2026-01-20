'use client'

import { supabase } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function NotificationsBell() {
  const [list, setList] = useState<any[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      setList(data || [])
    }

    fetchData()
  }, [])

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}>🔔</button>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-white shadow rounded">
          {list.length === 0 ? (
            <p className="p-3 text-sm">لا توجد إشعارات</p>
          ) : (
            list.map((n) => (
              <div key={n.id} className="p-3 border-b text-text-sm">
                <p className="font-semibold">{n.title}</p>
                <p className="text-xs text-gray-500">{n.body}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
