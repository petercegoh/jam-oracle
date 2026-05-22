export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full bg-gray-200" />
        <div className="h-3 w-16 rounded bg-gray-200" />
      </div>
      <div className="mb-2 h-8 w-24 rounded bg-gray-200" />
      <div className="mb-3 h-3 w-40 rounded bg-gray-100" />
      <div className="border-t border-gray-100 pt-3 space-y-2">
        <div className="h-2.5 w-32 rounded bg-gray-100" />
        <div className="flex justify-between">
          <div className="h-2.5 w-14 rounded bg-gray-100" />
          <div className="h-2.5 w-16 rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
}
