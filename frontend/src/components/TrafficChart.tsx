"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { RouteResult } from "@/types/api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const COLORS = ["#3B82F6", "#22C55E", "#EF4444", "#F59E0B", "#8B5CF6", "#EC4899"];

interface Props {
  routes: RouteResult[];
  mode: "driving" | "transit";
  selectedIndex: number | null;
}

const ALL_HOURS = Array.from({ length: 19 }, (_, i) => `${String(i + 5).padStart(2, "0")}:00`);

export default function TrafficChart({ routes, mode, selectedIndex }: Props) {
  const visibleRoutes = selectedIndex === null ? routes : routes.filter((r) => r.index === selectedIndex);
  const datasets = visibleRoutes.map((route) => {
    const byHour = new Map(route.hourly_traffic.map((p) => [p.hour, p.duration_minutes]));
    const data = ALL_HOURS.map((h) => byHour.get(h) ?? null);
    const pointRadius = mode === "driving"
      ? 0
      : data.map((v, idx) => {
          if (v === null) return 0;
          const prevNull = idx === 0 || data[idx - 1] === null;
          const nextNull = idx === data.length - 1 || data[idx + 1] === null;
          return prevNull && nextNull ? 5 : 0;
        });
    return {
      label: `Route ${route.index + 1} (${route.summary})`,
      data,
      borderColor: COLORS[route.index],
      backgroundColor: COLORS[route.index] + "20",
      pointBackgroundColor: COLORS[route.index],
      tension: 0.4,
      pointRadius,
      pointHoverRadius: 6,
      borderWidth: 2,
      spanGaps: mode === "driving",
    };
  });

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-medium text-gray-600">24-Hour Traffic Forecast</h2>
      <div className="h-72">
        <Line
          data={{ labels: ALL_HOURS, datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
              legend: { position: "top", onClick: () => {} },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    if (ctx.parsed.y === null) return;
                    return ` ${ctx.dataset.label?.split(" (")[0]}: ${ctx.parsed.y} min`;
                  },
                },
              },
            },
            scales: {
              y: {
                title: { display: true, text: "Duration (minutes)" },
                beginAtZero: false,
              },
              x: {
                ticks: { maxTicksLimit: 12 },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
