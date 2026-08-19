"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Label } from "@/components/ui/Label";

const MAX_SUGGESTIONS = 8;

export function TagInput({
  label,
  values,
  onChange,
  placeholder,
  suggestions,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  // Optional predefined vocabulary shown as a type-ahead dropdown — still
  // free text underneath, this only helps land on a standardized spelling.
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function addValue(value: string) {
    const trimmed = value.trim();
    if (trimmed && !values.includes(trimmed)) {
      onChange([...values, trimmed]);
    }
    setDraft("");
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addValue(draft);
    } else if (e.key === "Backspace" && draft === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  const filteredSuggestions = useMemo(() => {
    if (!suggestions) return [];
    const q = draft.trim().toLowerCase();
    const pool = q ? suggestions.filter((s) => s.toLowerCase().includes(q)) : suggestions;
    return pool.filter((s) => !values.includes(s)).slice(0, MAX_SUGGESTIONS);
  }, [suggestions, draft, values]);

  return (
    <div ref={boxRef} className="relative">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-2 rounded-md border border-line bg-surface p-2 focus-within:border-brand focus-within:ring-1 focus-within:ring-brand">
        {values.map((value) => (
          <span
            key={value}
            className="flex items-center gap-1 rounded-full bg-brand-soft px-2 py-1 text-xs font-medium text-brand"
          >
            {value}
            <button
              type="button"
              onClick={() => onChange(values.filter((v) => v !== value))}
              className="text-brand/70 hover:text-brand"
              aria-label={`Remove ${value}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => addValue(draft)}
          placeholder={placeholder}
          autoComplete="off"
          className="min-w-[8rem] flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
        />
      </div>

      {open && filteredSuggestions.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-line bg-surface py-1 shadow-lg">
          {filteredSuggestions.map((title) => (
            <button
              key={title}
              type="button"
              // onMouseDown (not onClick) fires before the input's onBlur,
              // so the click registers before addValue(draft) empties draft.
              onMouseDown={(e) => {
                e.preventDefault();
                addValue(title);
              }}
              className="block w-full truncate px-3 py-1.5 text-left text-sm text-ink hover:bg-page"
            >
              {title}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
