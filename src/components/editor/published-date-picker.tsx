"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(date: Date) {
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function parseDate(dateString: string): Date {
  // Handle special placeholder values (case-insensitive)
  if (!dateString) return new Date();
  const normalized = dateString.trim().toLowerCase();
  if (normalized === "unset" || normalized === "draft") return new Date();
  const parts = dateString.trim().split(/\s+/);
  if (parts.length === 3) {
    const monthIndex = MONTHS.indexOf(parts[1]);
    if (monthIndex !== -1) {
      const d = new Date(Date.UTC(parseInt(parts[2]), monthIndex, parseInt(parts[0])));
      if (!isNaN(d.getTime())) return d;
    }
  }
  return new Date();
}

export function PublishedDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Initialize with the value prop, updating when it changes
  const [selectedDate, setSelectedDate] = useState<Date>(() => parseDate(value));

  // Sync selectedDate when value prop changes (for async data loading)
  useEffect(() => {
    // Debug: log what value we receive
    console.log("[date-picker] value prop:", value, "parsed:", parseDate(value).toISOString());
    setSelectedDate(parseDate(value));
  }, [value]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Get days in month
  const getDaysInMonth = (year: number, month: number) =>
    new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const daysInMonth = getDaysInMonth(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth());
  const firstDay = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), 1)).getUTCDay();

  const handleSelect = (day: number) => {
    const newDate = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), day));
    setSelectedDate(newDate);
    onChange(formatDate(newDate));
    setIsOpen(false);
  };

  const handlePrevMonth = () => {
    setSelectedDate(new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth() - 1, 1)));
  };

  const handleNextMonth = () => {
    setSelectedDate(new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth() + 1, 1)));
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex w-full items-center justify-between rounded-xl border border-white/10",
          "bg-white/[0.02] px-3 py-2 text-sm text-white",
          "hover:bg-white/[0.04] transition-colors",
        )}
      >
        <span className={cn((!value || value?.toLowerCase() === "unset" || value?.toLowerCase() === "draft") && "text-white/42")}>
          {value || "Select date"}
        </span>
        <CalendarIcon className="size-4 text-white/42" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+0.5rem)] z-20 w-full max-h-80 overflow-y-auto rounded-[1.6rem] border border-white/10 bg-[#0c0c0c]/96 p-3 backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 text-white/42 hover:text-white"
            >
              &#8592;
            </button>
            <span className="text-sm font-medium text-white">
              {MONTHS[selectedDate.getUTCMonth()]} {selectedDate.getUTCFullYear()}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 text-white/42 hover:text-white"
            >
              &#8594;
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {["S", "M", "T", "W", "Th", "F", "Sa"].map((d) => (
              <span key={d} className="text-center text-[0.6rem] uppercase text-white/36 py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <span key={`empty-${i}`} className="py-1" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = selectedDate.getUTCDate() === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelect(day)}
                  className={cn(
                    "py-1 text-center text-sm rounded-lg",
                    isSelected
                      ? "bg-white/[0.08] text-white font-medium"
                      : "text-white/72 hover:bg-white/[0.04] hover:text-white",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}