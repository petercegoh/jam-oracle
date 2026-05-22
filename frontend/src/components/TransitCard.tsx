import type { RouteResult, TransitLeg } from "@/types/api";

interface Props {
  route: RouteResult;
  color: string;
  selected?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
}

const VEHICLE_STYLES: Record<string, { bg: string; text: string }> = {
  SUBWAY: { bg: "bg-blue-100", text: "text-blue-800" },
  METRO:  { bg: "bg-blue-100", text: "text-blue-800" },
  RAIL:   { bg: "bg-green-100", text: "text-green-800" },
  BUS:    { bg: "bg-amber-100", text: "text-amber-800" },
  TRAM:   { bg: "bg-purple-100", text: "text-purple-800" },
  FERRY:  { bg: "bg-teal-100", text: "text-teal-800" },
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

function fmtHour(h: string): string {
  const n = parseInt(h.split(":")[0]);
  if (n === 0) return "12am";
  if (n < 12) return `${n}am`;
  if (n === 12) return "12pm";
  return `${n - 12}pm`;
}

export default function TransitCard({ route, color, selected = false, dimmed = false, onClick }: Props) {
  const routeLabel = String.fromCharCode(65 + route.index);
  const legs = route.transit_legs ?? [];

  const peak = route.hourly_traffic.length > 0
    ? route.hourly_traffic.reduce((a, b) => a.duration_minutes > b.duration_minutes ? a : b)
    : null;
  const offPeak = route.hourly_traffic.length > 0
    ? route.hourly_traffic.reduce((a, b) => a.duration_minutes < b.duration_minutes ? a : b)
    : null;

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-gray-200 bg-white p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${dimmed ? "opacity-30" : ""}`}
      style={{ boxShadow: selected ? `0 0 0 2px white, 0 0 0 4px ${color}` : undefined }}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Route {routeLabel}
        </span>
        {route.transfers !== null && (
          <span className="ml-auto rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
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

      {peak && (
        <>
          <div className="mb-1">
            <span className="text-2xl font-bold text-gray-900">{fmtHour(peak.hour)}</span>
            <span className="ml-1.5 text-sm text-gray-500">peak</span>
          </div>
          {offPeak && (
            <p className="text-sm text-gray-500">
              {Math.round(peak.duration_minutes)}min peak &middot; {Math.round(offPeak.duration_minutes)}min off-peak
            </p>
          )}
        </>
      )}
    </div>
  );
}
