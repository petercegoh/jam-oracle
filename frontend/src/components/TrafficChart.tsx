"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import type { ScriptableContext } from "chart.js";
import { Line } from "react-chartjs-2";
import type { RouteResult } from "@/types/api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const COLORS = ["#5B7FF7", "#F97316", "#8B5CF6", "#F59E0B", "#EC4899", "#14B8A6"];

interface Props {
  routes: RouteResult[];
  mode: "driving" | "transit";
  selectedIndex: number | null;
}

const ALL_HOURS = Array.from({ length: 19 }, (_, i) => `${String(i + 5).padStart(2, "0")}:00`);

function fmtHourLabel(h: string): string {
  const n = parseInt(h);
  if (n === 0) return "12am";
  if (n < 12) return `${n}am`;
  if (n === 12) return "12pm";
  return `${n - 12}pm`;
}

const HOUR_LABELS = ALL_HOURS.map(fmtHourLabel);

export default function TrafficChart({ routes, mode, selectedIndex }: Props) {
  const visibleRoutes = selectedIndex === null ? routes : routes.filter((r) => r.index === selectedIndex);

  const datasets = visibleRoutes.map((route) => {
    const byHour = new Map(route.hourly_traffic.map((p) => [p.hour, p.duration_minutes]));
    const data = ALL_HOURS.map((h) => byHour.get(h) ?? null);
    const color = COLORS[route.index] ?? COLORS[0];
    const routeLabel = String.fromCharCode(65 + route.index);

    const pointRadius = mode === "driving"
      ? 0
      : data.map((v, idx) => {
          if (v === null) return 0;
          const prevNull = idx === 0 || data[idx - 1] === null;
          const nextNull = idx === data.length - 1 || data[idx + 1] === null;
          return prevNull && nextNull ? 5 : 0;
        });

    return {
      label: `Route ${routeLabel}`,
      data,
      borderColor: color,
      backgroundColor: (context: ScriptableContext<"line">): string | CanvasGradient => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return color + "20";
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, color + "55");
        gradient.addColorStop(1, color + "00");
        return gradient;
      },
      pointBackgroundColor: color,
      tension: 0.4,
      pointRadius,
      pointHoverRadius: 6,
      borderWidth: 2,
      spanGaps: mode === "driving",
      fill: true,
    };
  });

  return (
    <div className="rounded-2xl bg-gray-50 p-5">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400">
        Travel Time (min) over 24 hours
      </p>
      <div className="h-72">
        <Line
          data={{ labels: HOUR_LABELS, datasets }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
              legend: {
                position: "top",
                align: "end",
                onClick: () => {},
                labels: {
                  boxWidth: 24,
                  boxHeight: 2,
                  padding: 16,
                  font: { size: 12 },
                  color: "#6B7280",
                },
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    if (ctx.parsed.y === null) return;
                    return ` ${ctx.dataset.label}: ${ctx.parsed.y} min`;
                  },
                },
              },
            },
            scales: {
              y: {
                beginAtZero: false,
                grid: { color: "#F3F4F6" },
                border: { display: false },
                ticks: {
                  color: "#9CA3AF",
                  font: { size: 11 },
                  callback: (value) => `${value}m`,
                },
              },
              x: {
                grid: { color: "#F3F4F6" },
                border: { display: false },
                ticks: {
                  color: "#9CA3AF",
                  font: { size: 11 },
                  maxTicksLimit: 10,
                },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
