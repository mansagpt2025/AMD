'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function LessonsCompletionChart({ data }: any) {
  const map: Record<string, number> = {}

  data.forEach((p: any) => {
    const title = p.lessons?.title
    if (!title) return
    map[title] = (map[title] || 0) + (p.completed ? 1 : 0)
  })

  const chartData = Object.entries(map).map(([k, v]) => ({
    lesson: k,
    completed: v,
  }))

  return (
    <div style={{ height: 300 }}>
      <h2>📈 إكمال المحاضرات</h2>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="lesson" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="completed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
