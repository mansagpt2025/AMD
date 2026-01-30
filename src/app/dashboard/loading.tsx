export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      {/* Spinner Center */}
      <div className="flex flex-col items-center justify-center py-8 space-y-3">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-blue-600 text-lg font-medium">
          جاري التحميل...
        </p>
      </div>

      {/* Skeleton Content */}
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
          <div className="h-24 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
