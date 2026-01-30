export default function Loading() {
  return (
    <div className="relative min-h-screen">
      {/* Centered Loader */}
      <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
        
        {/* Nice Spinner */}
        <div
          className="w-14 h-14 rounded-full animate-spin"
          style={{
            border: '4px solid rgba(59, 130, 246, 0.2)', // blue-500 with opacity
            borderTop: '4px solid #3B82F6', // blue-500
          }}
        />

        {/* Text */}
        <p
          className="text-blue-600 text-lg font-medium"
          style={{ fontFamily: "'GE SS Two', sans-serif" }}
        >
          جاري التحميل...
        </p>
      </div>

      {/* Skeleton Content (Optional - خلفية خفيفة) */}
      <div className="p-6 space-y-4 animate-pulse opacity-40">
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
