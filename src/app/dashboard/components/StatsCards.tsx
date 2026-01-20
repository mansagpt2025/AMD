export default function StatsCards({ subsCount }: { subsCount: number }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 rounded-lg bg-white shadow">
        <p className="text-gray-500 text-sm">عدد الباقات</p>
        <p className="text-2xl font-bold">{subsCount}</p>
      </div>

      <div className="p-4 rounded-lg bg-white shadow">
        <p className="text-gray-500 text-sm">حالة الحساب</p>
        <p className="text-success-500 font-semibold">نشط</p>
      </div>
    </div>
  )
}
