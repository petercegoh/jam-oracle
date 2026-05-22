import type { RouteResult } from "@/types/api";

interface Props {
  route: RouteResult;
  color: string;
  selected?: boolean;
  dimmed?: boolean;
  onClick?: () => void;
}

function fmtHour(h: string): string {
  const n = parseInt(h.split(":")[0]);
  if (n === 0) return "12am";
  if (n < 12) return `${n}am`;
  if (n === 12) return "12pm";
  return `${n - 12}pm`;
}

export default function RouteCard({ route, color, selected = false, dimmed = false, onClick }: Props) {
  const routeLabel = String.fromCharCode(65 + route.index);

  const peak = route.hourly_traffic.reduce((a, b) =>
    a.duration_minutes > b.duration_minutes ? a : b
  );
  const offPeak = route.hourly_traffic.reduce((a, b) =>
    a.duration_minutes < b.duration_minutes ? a : b
  );

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
      </div>

      <div className="mb-1">
        <span className="text-3xl font-bold text-gray-900">{fmtHour(peak.hour)}</span>
        <span className="ml-1.5 text-sm text-gray-500">peak</span>
      </div>

      <p className="text-sm text-gray-500">
        {Math.round(peak.duration_minutes)}min peak &middot; {Math.round(offPeak.duration_minutes)}min off-peak
      </p>

      <div className="mt-3 border-t border-gray-100 pt-3 space-y-1.5">
        {route.summary && (
          <p className="text-xs text-gray-400 truncate">via {route.summary}</p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="text-gray-400">Distance</span>
          <span className="font-medium">{route.distance}</span>
        </div>
      </div>
    </div>
  );
}
