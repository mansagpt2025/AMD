import Link from 'next/link'

export default function Subscriptions({ subs }: any) {
  if (subs.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg text-center">
        لم تشترك في أي باقة بعد
      </div>
    )
  }

  return (
    <div>
      <h3 className="font-bold mb-3">باقاتك</h3>
      <div className="grid md:grid-cols-3 gap-4">
        {subs.map((sub: any) => (
          <Link
            key={sub.id}
            href={`/packages/${sub.packages.id}`}
            className="bg-white rounded-lg shadow overflow-hidden"
          >
            <img
              src={sub.packages.image_url}
              className="h-32 w-full object-cover"
            />
            <div className="p-3 font-semibold">
              {sub.packages.title}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
