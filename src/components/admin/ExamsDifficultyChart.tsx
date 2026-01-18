'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function ExamsDifficultyChart({ data }: any) {
  const map: Record<string, number[]> = {}

  data.forEach((e: any) => {
    const title = e.lessons?.title
    if (!title) return
    map[title] = map[title] || []
    map[title].push(e.score)
  })

  const chartData = Object.entries(map).map(([k, scores]) => ({
    lesson: k,
    avg: scores.reduce((a, b) => a + b, 0) / scores.length,
  }))

  return (
    <div style={{ height: 300 }}>
      <h2>🧪 متوسط درجات الامتحانات</h2>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <XAxis dataKey="lesson" />
          <YAxis />
          <Tooltip />
          <Line dataKey="avg" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
