export default async function UsersAdmin() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/users`, {
    cache: 'no-store',
  })

  const users = await res.json()

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">المستخدمين</h1>

      {users.map((user: any) => (
        <div key={user.id} className="bg-gray-800 p-3 rounded mb-2">
          {user.email}
        </div>
      ))}
    </div>
  )
}
