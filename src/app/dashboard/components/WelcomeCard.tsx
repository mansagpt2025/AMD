import NotificationsBell from './NotificationsBell'

export default function WelcomeCard({ profile, wallet }: any) {
  return (
    <div className="p-6 rounded-xl bg-primary-600 text-white flex justify-between items-center">
      <div>
        <h2 className="text-xl font-bold">
          أهلاً يا {profile.full_name}
        </h2>
        <p className="text-sm">
          الصف: {profile.grade}
        </p>
        <p className="mt-2 font-semibold">
          رصيد المحفظة: {wallet?.balance ?? 0} جنيه
        </p>
      </div>

      <NotificationsBell />
    </div>
  )
}
