export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {/* Spinner */}
      <div
        className="w-14 h-14 rounded-full animate-spin mb-4"
        style={{
          border: '4px solid rgba(59, 130, 246, 0.2)',
          borderTop: '4px solid #3B82F6',
        }}
      />
      
      {/* Loading Text */}
      <p
        className="text-blue-600 text-lg font-medium"
        style={{ fontFamily: "'GE SS Two', sans-serif" }}
      >
        جاري التحميل...
      </p>
    </div>
  );
}