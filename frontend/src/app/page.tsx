"use client";

import { useState } from "react";
import SearchForm from "@/components/SearchForm";
import TrafficChart from "@/components/TrafficChart";
import RouteCard from "@/components/RouteCard";
import TransitCard from "@/components/TransitCard";
import SkeletonChart from "@/components/SkeletonChart";
import SkeletonCard from "@/components/SkeletonCard";
import type { Mode, RoutesResponse } from "@/types/api";

const COLORS = ["#3B82F6", "#22C55E", "#EF4444", "#F59E0B", "#8B5CF6", "#EC4899"];

export default function Page() {
  const [mode, setMode] = useState<Mode>("driving");
  const [result, setResult] = useState<RoutesResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setResult(null);
    setError("");
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl" aria-hidden="true">🚦</span>
          <h1 className="text-3xl font-bold text-gray-900">Jam Oracle</h1>
        </div>
        <p className="text-gray-500">
          See exactly when traffic picks up — plan your commute around it.
        </p>
      </header>

      <div className="mb-5 flex w-fit rounded-lg border border-gray-200 bg-gray-50 p-1">
        <button
          onClick={() => switchMode("driving")}
          className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === "driving"
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          🚗 Drive
        </button>
        <button
          onClick={() => switchMode("transit")}
          className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            mode === "transit"
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          🚌 Transit
        </button>
      </div>

      <SearchForm
        mode={mode}
        onResult={(data) => {
          setResult(data);
          setError("");
        }}
        onError={setError}
        onLoading={setLoading}
      />

      {error && !loading && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex gap-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Could not fetch routes</p>
              <p className="mt-0.5 text-sm text-red-700">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-600"
              aria-label="Dismiss error"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {loading && !result && (
        <div className="mt-8 flex flex-col gap-6">
          <SkeletonChart />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      )}

      {result && (
        <div
          key={result.origin + result.destination + mode}
          className="animate-fade-in mt-8 flex flex-col gap-6"
        >
          <div>
            <div className="mb-3 flex items-start justify-between gap-4">
              <p className="text-sm text-gray-500">
                {result.origin} → {result.destination}
              </p>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <a
                  href={
                    `https://www.google.com/maps/dir/?api=1` +
                    `&origin=${encodeURIComponent(result.origin)}` +
                    `&destination=${encodeURIComponent(result.destination)}` +
                    `&travelmode=${mode}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Open in Google Maps
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <p className="text-xs text-gray-400">Tip: set a departure time in Maps</p>
              </div>
            </div>
            <TrafficChart routes={result.routes} mode={mode} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.routes.map((route) =>
              mode === "transit" ? (
                <TransitCard
                  key={route.index}
                  route={route}
                  color={COLORS[route.index]}
                />
              ) : (
                <RouteCard
                  key={route.index}
                  route={route}
                  color={COLORS[route.index]}
                />
              )
            )}
          </div>
        </div>
      )}
    </main>
  );
}
