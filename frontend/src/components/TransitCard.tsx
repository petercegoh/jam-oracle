import type { RouteResult, TransitLeg } from "@/types/api";

interface Props {
  route: RouteResult;
  color: string;
  origin: string;
  destination: string;
}

const VEHICLE_STYLES: Record<string, { bg: string; text: string }> = {
  SUBWAY: { bg: "bg-blue-100", text: "text-blue-800" },
  METRO: { bg: "bg-blue-100", text: "text-blue-800" },
  RAIL: { bg: "bg-green-100", text: "text-green-800" },
  BUS: { bg: "bg-amber-100", text: "text-amber-800" },
  TRAM: { bg: "bg-purple-100", text: "text-purple-800" },
  FERRY: { bg: "bg-teal-100", text: "text-teal-800" },
};

function vehicleStyle(type: string) {
  return VEHICLE_STYLES[type] ?? { bg: "bg-gray-100", text: "text-gray-700" };
}

function LegPill({ leg }: { leg: TransitLeg }) {
  const { bg, text } = vehicleStyle(leg.vehicle_type);
  return (
    <div className={`rounded-lg ${bg} px-3 py-2`}>
      <div className={`text-xs font-semibold ${text}`}>{leg.short_name}</div>
      <div className="mt-0.5 text-xs text-gray-500">
        {leg.departure_stop} → {leg.arrival_stop}
      </div>
      <div className="mt-0.5 text-xs text-gray-400">{leg.num_stops} stops</div>
    </div>
  );
}

export default function TransitCard({ route, color, origin, destination }: Props) {
  const mapsUrl =
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${encodeURIComponent(origin)}` +
    `&destination=${encodeURIComponent(destination)}` +
    `&travelmode=transit`;

  const legs = route.transit_legs ?? [];

  const best =
    route.hourly_traffic.length > 0
      ? route.hourly_traffic.reduce((a, b) =>
          a.duration_minutes < b.duration_minutes ? a : b
        )
      : null;
  const worst =
    route.hourly_traffic.length > 0
      ? route.hourly_traffic.reduce((a, b) =>
          a.duration_minutes > b.duration_minutes ? a : b
        )
      : null;

  return (
    <div
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
      style={{ borderLeftColor: color, borderLeftWidth: 5 }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold" style={{ color }}>
          Route {route.index + 1}
        </h3>
        {route.transfers !== null && (
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {route.transfers === 0 ? "Direct" : `${route.transfers} transfer${route.transfers > 1 ? "s" : ""}`}
          </span>
        )}
      </div>

      {legs.length > 0 ? (
        <div className="mb-3 flex flex-col gap-1.5">
          {legs.map((leg, i) => (
            <LegPill key={i} leg={leg} />
          ))}
        </div>
      ) : (
        <p className="mb-3 text-sm text-gray-400 italic">Walking only</p>
      )}

      <dl className="space-y-1 text-sm border-t border-gray-100 pt-3">
        <div className="flex justify-between">
          <dt className="text-gray-500">Distance</dt>
          <dd className="font-medium">{route.distance}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-gray-500">Duration</dt>
          <dd className="font-medium">{route.duration_current}</dd>
        </div>
      </dl>

      {(best || worst) && (
        <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
          {best && (
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                Fastest · {best.hour}
              </span>
              <span className="text-sm font-medium">{best.duration_minutes} min</span>
            </div>
          )}
          {worst && (
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                Slowest · {worst.hour}
              </span>
              <span className="text-sm font-medium">{worst.duration_minutes} min</span>
            </div>
          )}
        </div>
      )}

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
