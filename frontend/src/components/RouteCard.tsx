import type { RouteResult } from "@/types/api";

interface Props {
  route: RouteResult;
  color: string;
  origin: string;
  destination: string;
}

export default function RouteCard({ route, color, origin, destination }: Props) {
  const mapsUrl =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${encodeURIComponent(origin)}` +
    `&destination=${encodeURIComponent(destination)}` +
    `&travelmode=driving`;
  const best = route.hourly_traffic.reduce((a, b) =>
    a.duration_minutes < b.duration_minutes ? a : b
  );
  const worst = route.hourly_traffic.reduce((a, b) =>
    a.duration_minutes > b.duration_minutes ? a : b
  );

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
      style={{ borderLeftColor: color, borderLeftWidth: 5 }}
    >
      <h3 className="mb-1 font-semibold text-gray-900" style={{ color }}>
        Route {route.index + 1}
      </h3>
      <p className="mb-3 text-sm text-gray-500">{route.summary}</p>

      <dl className="space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-gray-500">Distance</dt>
          <dd className="font-medium">{route.distance}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Now</dt>
          <dd className="font-medium">{route.duration_current}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Typical</dt>
          <dd className="font-medium">{route.duration_typical}</dd>
        </div>
      </dl>

      <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
            Best · {best.hour}
          </span>
          <span className="text-sm font-medium">{best.duration_minutes} min</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
            Worst · {worst.hour}
          </span>
          <span className="text-sm font-medium">{worst.duration_minutes} min</span>
        </div>
      </div>

      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:border-blue-300 hover:text-blue-600"
      >
        Open in Google Maps
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}
