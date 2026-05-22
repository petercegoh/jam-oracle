export default function SkeletonChart() {
  return (
    <div className="animate-pulse rounded-2xl bg-gray-50 p-5">
      <div className="mb-4 h-3 w-56 rounded bg-gray-200" />
      <div className="h-72 rounded-xl bg-gray-200" />
      <div className="mt-3 flex justify-between px-1">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-2 w-6 rounded bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
