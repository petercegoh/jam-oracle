export default function SkeletonChart() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-1 h-3 w-40 rounded bg-gray-200" />
      <div className="mb-4 flex justify-center gap-6 mt-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-3 w-28 rounded bg-gray-200" />
        ))}
      </div>
      <div className="h-64 rounded-lg bg-gray-100" />
      <div className="mt-2 flex justify-between px-1">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-2 w-8 rounded bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
