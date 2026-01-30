export default function Loading() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-64 bg-gray-200 rounded-lg" />
      <div className="h-8 w-1/2 bg-gray-200 rounded" />
      <div className="space-y-2">
        <div className="h-16 bg-gray-200 rounded" />
        <div className="h-16 bg-gray-200 rounded" />
        <div className="h-16 bg-gray-200 rounded" />
      </div>
    </div>
  );
}