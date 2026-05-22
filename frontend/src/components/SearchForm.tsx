"use client";

import { useState } from "react";
import AddressInput from "./AddressInput";
import { fetchRoutes } from "@/lib/api";
import type { Mode, RoutesResponse } from "@/types/api";

interface Props {
  mode: Mode;
  onResult: (data: RoutesResponse) => void;
  onError: (msg: string) => void;
  onLoading: (v: boolean) => void;
}

export default function SearchForm({ mode, onResult, onError, onLoading }: Props) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!origin.trim() || !destination.trim() || submitting) return;
    setSubmitting(true);
    onLoading(true);
    onError("");
    try {
      const data = await fetchRoutes(origin, destination, mode);
      onResult(data);
    } catch (err) {
      onError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setSubmitting(false);
      onLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AddressInput
          label="Origin"
          value={origin}
          onChange={setOrigin}
          onSelect={setOrigin}
          placeholder="e.g. Orchard Road, Singapore"
          disabled={submitting}
        />
        <AddressInput
          label="Destination"
          value={destination}
          onChange={setDestination}
          onSelect={setDestination}
          placeholder="e.g. Marina Bay Sands"
          disabled={submitting}
        />
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
