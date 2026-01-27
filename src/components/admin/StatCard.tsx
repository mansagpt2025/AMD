import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'teal';
  loading?: boolean;
}

export default function StatCard({ title, value, change, icon: Icon, color, loading = false }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-gradient-to-br from-blue-500 to-blue-700',
    green: 'bg-gradient-to-br from-green-500 to-green-700',
    purple: 'bg-gradient-to-br from-purple-500 to-purple-700',
    orange: 'bg-gradient-to-br from-orange-500 to-orange-700',
    red: 'bg-gradient-to-br from-red-500 to-red-700',
    teal: 'bg-gradient-to-br from-teal-500 to-teal-700',
  };

  const changeColor = change.startsWith('+') ? 'text-green-600' : 'text-red-600';

  return (
    <div className="relative overflow-hidden bg-white rounded-xl p-6 shadow-lg border border-gray-200 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group">
      {/* تأثير خلفي */}
      <div className={`absolute -right-8 -top-8 w-24 h-24 ${colorClasses[color]} opacity-10 rounded-full group-hover:scale-150 transition-transform duration-500`}></div>
      
      <div className="relative z-10 flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium mb-2">{title}</p>
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 w-24 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
              <p className="text-sm text-gray-500">
                <span className={`font-semibold ${changeColor}`}>
                  {change}
                </span>{' '}
                من الشهر الماضي
              </p>
            </>
          )}
        </div>
        <div className={`p-4 rounded-xl ${colorClasses[color]} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {/* خط متحرك في الأسفل */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
    </div>
  );
}