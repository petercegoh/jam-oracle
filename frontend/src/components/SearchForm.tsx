"use client";

import { useState } from "react";
import AddressInput from "./AddressInput";
import { fetchRoutes } from "@/lib/api";
import type { Mode, RoutesResponse, Suggestion } from "@/types/api";
import { PRESET_CACHE } from "@/data/presets";

const _sessionCache = new Map<string, RoutesResponse>(Object.entries(PRESET_CACHE));

const PRESETS = [
  { label: "Orchard Rd → Marina Bay", origin: "Orchard Road, Singapore", destination: "Marina Bay, Singapore" },
  { label: "Dhoby Ghaut → Changi Airport", origin: "Dhoby Ghaut, Singapore", destination: "Changi Airport, Singapore" },
  { label: "MacRitchie → Singapore Zoo", origin: "MacRitchie Reservoir, Singapore", destination: "Singapore Zoo, Singapore" },
];

interface Props {
  mode: Mode;
  onModeChange: (mode: Mode) => void;
  onResult: (data: RoutesResponse) => void;
  onError: (msg: string) => void;
  onLoading: (v: boolean) => void;
  onSearch?: (origin: string, destination: string) => void;
  initialOrigin?: string;
  initialDestination?: string;
}

export default function SearchForm({ mode, onModeChange, onResult, onError, onLoading, onSearch, initialOrigin, initialDestination }: Props) {
  const [origin, setOrigin] = useState(initialOrigin ?? "");
  const [destination, setDestination] = useState(initialDestination ?? "");
  const [originPlaceId, setOriginPlaceId] = useState<string | null>(null);
  const [destinationPlaceId, setDestinationPlaceId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function run(o: string, d: string, oId?: string, dId?: string) {
    onSearch?.(o, d);
    const cacheKey = `${o.trim().toLowerCase()}|${d.trim().toLowerCase()}|${mode}`;
    const cached = _sessionCache.get(cacheKey);
    if (cached) {
      onResult(cached);
      return;
    }
    setSubmitting(true);
    onLoading(true);
    onError("");
    try {
      const data = await fetchRoutes(o, d, mode, oId, dId);
      _sessionCache.set(cacheKey, data);
      onResult(data);
    } catch (err) {
      onError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
      onLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!origin.trim() || !destination.trim() || submitting) return;
    await run(origin, destination, originPlaceId ?? undefined, destinationPlaceId ?? undefined);
  }

  function handlePreset(preset: typeof PRESETS[number]) {
    if (submitting) return;
    setOrigin(preset.origin);
    setDestination(preset.destination);
    setOriginPlaceId(null);
    setDestinationPlaceId(null);
  }

  function handleSwap() {
    setOrigin(destination);
    setDestination(origin);
    setOriginPlaceId(destinationPlaceId);
    setDestinationPlaceId(originPlaceId);
  }

  function handleOriginSelect(s: Suggestion) {
    setOrigin(s.description);
    setOriginPlaceId(s.place_id);
  }

  function handleDestinationSelect(s: Suggestion) {
    setDestination(s.description);
    setDestinationPlaceId(s.place_id);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="rounded-2xl border border-gray-200 bg-gray-50 shadow-sm">
          {/* Origin row */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0 text-gray-400">
              <circle cx="8" cy="8" r="5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <div className="flex-1 min-w-0">
              <AddressInput
                label="Origin"
                value={origin}
                onChange={(v) => { setOrigin(v); setOriginPlaceId(null); }}
                onSelect={handleOriginSelect}
                placeholder="Starting point"
                disabled={submitting}
                variant="minimal"
              />
            </div>
            <button
              type="button"
              onClick={handleSwap}
              disabled={submitting}
              className="shrink-0 rounded-full p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-600 transition-colors disabled:opacity-40"
              aria-label="Swap origin and destination"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-gray-200" />

          {/* Destination row */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <svg viewBox="0 0 16 16" fill="currentColor" className="h-3 w-3 shrink-0 text-gray-800">
              <circle cx="8" cy="8" r="5.5" />
            </svg>
            <div className="flex-1 min-w-0">
              <AddressInput
                label="Destination"
                value={destination}
                onChange={(v) => { setDestination(v); setDestinationPlaceId(null); }}
                onSelect={handleDestinationSelect}
                placeholder="Destination"
                disabled={submitting}
                variant="minimal"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 border-t border-gray-200" />

          {/* Mode + Submit row */}
          <div className="flex items-center gap-2 px-3 py-2.5">
            <button
              type="button"
              onClick={() => onModeChange("driving")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "driving"
                  ? "bg-black text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 14" fill="currentColor">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-15C1.84 5 1.28 5.42 1.08 6.01L0 9v6c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h14v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1V9l-1.08-2.99zM4.5 11.5c-.83 0-1.5-.67-1.5-1.5S3.67 8.5 4.5 8.5 6 9.17 6 10s-.67 1.5-1.5 1.5zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM3 7l1.5-4.5h11L17 7H3z" />
              </svg>
              Car
            </button>

            <button
              type="button"
              onClick={() => onModeChange("transit")}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "transit"
                  ? "bg-black text-white"
                  : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 0C6.686 0 4 .893 4 2v12c0 .55.45 1 1 1h1l-1 2h10l-1-2h1c.55 0 1-.45 1-1V2C16 .893 13.314 0 10 0zM6 13c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm8 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM15 8H5V4h10v4z" />
              </svg>
              Public Transit
            </button>

            <div className="flex-1" />

            <button
              type="submit"
              disabled={!origin.trim() || !destination.trim() || submitting}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black text-white transition-opacity hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {submitting ? (
                <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Presets */}
      <div className="flex flex-wrap justify-center gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => handlePreset(p)}
            disabled={submitting}
            className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50 disabled:opacity-50"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
