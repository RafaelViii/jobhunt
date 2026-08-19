"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";

const MAX_SUGGESTIONS = 8;

// Free text always wins — this is a suggestion list, not a locked dropdown,
// since a predefined title list can never cover every real job title.
export function TitleCombobox({
  value,
  onChange,
  suggestions,
  placeholder,
  required,
}: {
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return suggestions.slice(0, MAX_SUGGESTIONS);
    return suggestions.filter((title) => title.toLowerCase().includes(q)).slice(0, MAX_SUGGESTIONS);
  }, [value, suggestions]);

  return (
    <div ref={boxRef} className="relative">
      <Input
        type="text"
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-line bg-surface py-1 shadow-lg">
          {filtered.map((title) => (
            <button
              key={title}
              type="button"
              onClick={() => {
                onChange(title);
                setOpen(false);
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
