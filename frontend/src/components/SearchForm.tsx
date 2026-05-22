"use client";

import { useState } from "react";
import AddressInput from "./AddressInput";
import { fetchRoutes } from "@/lib/api";
import type { Mode, RoutesResponse, Suggestion } from "@/types/api";

const _sessionCache = new Map<string, import("@/types/api").RoutesResponse>();

const PRESETS = [
  { label: "Orchard Rd → Marina Bay", origin: "Orchard Road, Singapore", destination: "Marina Bay, Singapore" },
  { label: "Dhoby Ghaut → Changi Airport", origin: "Dhoby Ghaut, Singapore", destination: "Changi Airport, Singapore" },
  { label: "MacRitchie Reservoir → Singapore Zoo", origin: "MacRitchie Reservoir, Singapore", destination: "Singapore Zoo, Singapore" },
];

interface Props {
  mode: Mode;
  onResult: (data: RoutesResponse) => void;
  onError: (msg: string) => void;
  onLoading: (v: boolean) => void;
}

export default function SearchForm({ mode, onResult, onError, onLoading }: Props) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [originPlaceId, setOriginPlaceId] = useState<string | null>(null);
  const [destinationPlaceId, setDestinationPlaceId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function run(o: string, d: string, oId?: string, dId?: string) {
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

  async function handlePreset(preset: typeof PRESETS[number]) {
    if (submitting) return;
    setOrigin(preset.origin);
    setDestination(preset.destination);
    setOriginPlaceId(null);
    setDestinationPlaceId(null);
    await run(preset.origin, preset.destination);
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AddressInput
          label="Origin"
          value={origin}
          onChange={(v) => { setOrigin(v); setOriginPlaceId(null); }}
          onSelect={handleOriginSelect}
          placeholder="e.g. Orchard MRT"
          disabled={submitting}
        />
        <AddressInput
          label="Destination"
          value={destination}
          onChange={(v) => { setDestination(v); setDestinationPlaceId(null); }}
          onSelect={handleDestinationSelect}
          placeholder="e.g. Marina Bay Sands"
          disabled={submitting}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-400">Try:</span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => handlePreset(p)}
            disabled={submitting}
            className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 transition-colors hover:border-blue-300 hover:text-blue-600 disabled:opacity-50"
          >
            {p.label}
          </button>
        ))}
      </div>
      <button
        type="submit"
        disabled={!origin.trim() || !destination.trim() || submitting}
        className="self-start rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Checking…
          </span>
        ) : (
          "Check Traffic"
        )}
      </button>
    </form>
  );
}
