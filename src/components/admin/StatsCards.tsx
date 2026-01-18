export default function StatsCards({
  users,
  subscriptions,
  lessons,
}: {
  users: number
  subscriptions: number
  lessons: number
}) {
  return (
    <div style={{ display: 'flex', gap: 20 }}>
      <Card title="👤 الطلاب" value={users} />
      <Card title="💳 الاشتراكات" value={subscriptions} />
      <Card title="📚 المحاضرات" value={lessons} />
    </div>
  )
}

function Card({ title, value }: any) {
  return (
    <div style={{ padding: 20, background: '#111', width: 200 }}>
      <h3>{title}</h3>
      <strong style={{ fontSize: 28 }}>{value}</strong>
    </div>
  )
}
