"use client";

import * as React from "react";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";
import { Calendar as CalendarIcon, X } from "lucide-react";

interface FlatpickrDatePickerProps {
  value?: Date | string | number | null;
  onChange: (selectedDate: Date | null, dateStr: string) => void;
  placeholder?: string;
  className?: string;
  minDate?: Date | string;
  maxDate?: Date | string;
  enableTime?: boolean;
}

export function FlatpickrDatePicker({
  value,
  onChange,
  placeholder = "Select date...",
  className = "",
  minDate,
  maxDate,
  enableTime = false,
}: FlatpickrDatePickerProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const fpRef = React.useRef<flatpickr.Instance | null>(null);

  React.useEffect(() => {
    if (!inputRef.current) return;

    fpRef.current = flatpickr(inputRef.current, {
      defaultDate: value ? new Date(value) : undefined,
      enableTime,
      dateFormat: enableTime ? "F j, Y at h:i K" : "F j, Y",
      minDate: minDate ? new Date(minDate) : undefined,
      maxDate: maxDate ? new Date(maxDate) : undefined,
      disableMobile: true,
      onChange: (selectedDates, dateStr) => {
        onChange(selectedDates[0] || null, dateStr);
      },
    });

    return () => {
      fpRef.current?.destroy();
      fpRef.current = null;
    };
  }, [minDate, maxDate, enableTime]);

  React.useEffect(() => {
    if (fpRef.current) {
      if (value) {
        fpRef.current.setDate(new Date(value), false);
      } else {
        fpRef.current.clear();
      }
    }
  }, [value]);

  return (
    <div className="relative flex items-center w-full min-w-[200px]">
      {/* Calendar Icon */}
      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground z-10 flex items-center justify-center">
        <CalendarIcon className="h-3.5 w-3.5" />
      </div>

      {/* Clean Single Input Element */}
      <input
        ref={inputRef}
        placeholder={placeholder}
        readOnly
        className={`flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-8 py-1 text-xs text-foreground shadow-2xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer ${className}`}
      />

      {/* Clear Button */}
      {value && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fpRef.current?.clear();
            onChange(null, "");
          }}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10 p-0.5 rounded cursor-pointer transition-colors"
          title="Clear date"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
