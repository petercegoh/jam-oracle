"use client";

import { useState } from "react";
import SearchForm from "@/components/SearchForm";
import TrafficChart from "@/components/TrafficChart";
import RouteCard from "@/components/RouteCard";
import TransitCard from "@/components/TransitCard";
import SkeletonChart from "@/components/SkeletonChart";
import SkeletonCard from "@/components/SkeletonCard";
import type { Mode, RoutesResponse } from "@/types/api";

const COLORS = ["#5B7FF7", "#F97316", "#8B5CF6", "#F59E0B", "#EC4899", "#14B8A6"];

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black">
        <svg className="h-4 w-4 text-white" viewBox="0 0 22 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="0,7 3,7 5,1 8,13 11,4 14,10 17,6 19,7 22,7" />
        </svg>
      </div>
      <span className="text-sm font-semibold text-gray-900">RushMap</span>
    </div>
  );
}

export default function Page() {
  const [mode, setMode] = useState<Mode>("driving");
  const [result, setResult] = useState<RoutesResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [lastSearch, setLastSearch] = useState<{ origin: string; destination: string } | null>(null);

  const showLanding = !result && !loading;

  function handleModeChange(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setResult(null);
    setSelectedIndex(null);
    setError("");
  }

  function handleBack() {
    setResult(null);
    setError("");
    setSelectedIndex(null);
  }

  function handleRouteClick(index: number) {
    setSelectedIndex((prev) => (prev === index ? null : index));
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Nav */}
      <nav className="px-6 py-4">
        <Logo />
      </nav>

      {showLanding ? (
        /* Landing — vertically centred hero + search form */
        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-20">
          <h1 className="mb-2 text-center text-4xl font-bold tracking-tight text-gray-900">
            Outsmart rush hour.
          </h1>
          <p className="mb-10 text-center text-sm leading-relaxed text-gray-400">
            Compare journey times across the day.<br />
            Find your best window before you head out.
          </p>
          <div className="w-full max-w-lg">
            <SearchForm
              mode={mode}
              onModeChange={handleModeChange}
              onResult={(data) => { setResult(data); setSelectedIndex(null); setError(""); }}
              onError={setError}
              onLoading={setLoading}
              onSearch={(o, d) => setLastSearch({ origin: o, destination: d })}
              initialOrigin={lastSearch?.origin}
              initialDestination={lastSearch?.destination}
            />
          </div>
          {error && !loading && (
            <div className="mt-4 w-full max-w-lg rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex gap-3">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Could not fetch routes</p>
                  <p className="mt-0.5 text-sm text-red-700">{error}</p>
                </div>
                <button onClick={() => setError("")} className="text-red-400 hover:text-red-600">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Results / Loading */
        <div className="mx-auto w-full max-w-5xl px-6 py-8">
          {loading && !result && (
            <div className="flex flex-col gap-6">
              <SkeletonChart />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <SkeletonCard /><SkeletonCard /><SkeletonCard />
              </div>
            </div>
          )}

          {result && (
            <>
              {/* Header row: Back + route pill + Maps link */}
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <span className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-900">
                  {result.origin} → {result.destination}
                </span>
                <div className="ml-auto flex flex-col items-end gap-0.5">
                  <a
                    href={
                      `https://www.google.com/maps/dir/?api=1` +
                      `&origin=${encodeURIComponent(result.origin)}` +
                      `&destination=${encodeURIComponent(result.destination)}` +
                      `&travelmode=${mode}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-gray-400 transition-colors hover:text-gray-600"
                  >
                    Open in Maps
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                  <p className="text-xs text-gray-400">Tip: set a departure time in Maps</p>
                </div>
              </div>

              <div
                key={result.origin + result.destination + mode}
                className="animate-fade-in flex flex-col gap-6"
              >
                <TrafficChart routes={result.routes} mode={mode} selectedIndex={selectedIndex} />
                <p className="text-xs text-gray-400">Tip: select a route to highlight</p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {result.routes.map((route) =>
                    mode === "transit" ? (
                      <TransitCard
                        key={route.index}
                        route={route}
                        color={COLORS[route.index] ?? COLORS[0]}
                        selected={selectedIndex === route.index}
                        dimmed={selectedIndex !== null && selectedIndex !== route.index}
                        onClick={() => handleRouteClick(route.index)}
                      />
                    ) : (
                      <RouteCard
                        key={route.index}
                        route={route}
                        color={COLORS[route.index] ?? COLORS[0]}
                        selected={selectedIndex === route.index}
                        dimmed={selectedIndex !== null && selectedIndex !== route.index}
                        onClick={() => handleRouteClick(route.index)}
                      />
                    )
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
