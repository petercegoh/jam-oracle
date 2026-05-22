"use client";

import { useEffect, useRef, useState } from "react";
import { fetchSuggestions } from "@/lib/api";
import type { Suggestion } from "@/types/api";

interface Props {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (suggestion: Suggestion) => void;
  placeholder?: string;
  disabled?: boolean;
  variant?: "default" | "minimal";
}

export default function AddressInput({
  label,
  value,
  onChange,
  onSelect,
  placeholder,
  disabled = false,
  variant = "default",
}: Props) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [fetching, setFetching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    onChange(v);
    setSelectedIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setFetching(true);
      const results = await fetchSuggestions(v);
      setSuggestions(results);
      setFetching(false);
    }, 300);
  }

  function handleSelect(suggestion: Suggestion) {
    onSelect(suggestion);
    setSuggestions([]);
    setSelectedIndex(-1);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[selectedIndex]);
    } else if (e.key === "Escape") {
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  }

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setSuggestions([]);
        setSelectedIndex(-1);
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  if (variant === "minimal") {
    return (
      <div ref={containerRef} className="relative w-full">
        <input
          type="text"
          aria-label={label}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {suggestions.length > 0 && (
          <ul className="absolute top-full left-0 z-20 mt-1 w-72 rounded-xl border border-gray-200 bg-white shadow-lg">
            {suggestions.map((s, i) => (
              <li
                key={s.place_id}
                onMouseDown={() => handleSelect(s)}
                aria-selected={i === selectedIndex}
                className={`cursor-pointer px-3 py-2 text-sm ${
                  i === selectedIndex ? "bg-blue-50 text-blue-900" : "hover:bg-gray-50"
                }`}
              >
                {s.description}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 pr-8 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
        />
        {fetching && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-400" />
          </span>
        )}
      </div>
      {suggestions.length > 0 && (
        <ul className="absolute top-full z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
          {suggestions.map((s, i) => (
            <li
              key={s.place_id}
              onMouseDown={() => handleSelect(s)}
              aria-selected={i === selectedIndex}
              className={`cursor-pointer px-3 py-2 text-sm ${
                i === selectedIndex ? "bg-blue-50 text-blue-900" : "hover:bg-blue-50"
              }`}
            >
              {s.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
