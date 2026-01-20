import Link from 'next/link'

export default function GradeCard({ grade }: { grade: string }) {
  return (
    <Link href={`/grades/${grade}`}>
      <div className="cursor-pointer p-6 rounded-xl bg-gradient-primary text-white">
        <h3 className="text-lg font-bold">صفك الدراسي</h3>
        <p className="mt-2">اضغط لعرض الباقات المتاحة</p>
      </div>
    </Link>
  )
}
