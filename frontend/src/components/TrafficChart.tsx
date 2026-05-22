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

const COLORS = ["#3B82F6", "#22C55E", "#EF4444"];

interface Props {
  routes: RouteResult[];
}

export default function TrafficChart({ routes }: Props) {
  const labels = routes[0].hourly_traffic.map((p) => p.hour);

  const datasets = routes.map((route, i) => ({
    label: `Route ${route.index + 1} (${route.summary})`,
    data: route.hourly_traffic.map((p) => p.duration_minutes),
    borderColor: COLORS[i],
    backgroundColor: COLORS[i] + "20",
    tension: 0.4,
    pointRadius: 0,
    borderWidth: 2,
  }));

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-medium text-gray-600">24-Hour Traffic Forecast</h2>
      <div className="h-72">
        <Line
          data={{ labels, datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
              legend: { position: "top" },
              tooltip: {
                callbacks: {
                  label: (ctx) =>
                    ` ${ctx.dataset.label?.split(" (")[0]}: ${ctx.parsed.y} min`,
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
