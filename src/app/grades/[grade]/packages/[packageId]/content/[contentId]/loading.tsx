export default function Loading() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-4">
      <div className="aspect-video bg-gray-200 rounded-lg animate-pulse" />
      <div className="h-8 w-2/3 bg-gray-200 rounded animate-pulse" />
    </div>
  );
}