export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 h-4 w-20 rounded bg-gray-200" />
      <div className="mb-4 h-3 w-32 rounded bg-gray-100" />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 w-16 rounded bg-gray-100" />
            <div className="h-3 w-12 rounded bg-gray-100" />
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
        <div className="flex justify-between">
          <div className="h-3 w-16 rounded bg-green-100" />
          <div className="h-3 w-20 rounded bg-gray-100" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-16 rounded bg-red-100" />
          <div className="h-3 w-20 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
