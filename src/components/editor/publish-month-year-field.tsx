"use client";

import { DropdownSelect } from "@/components/ui/dropdown-select";

const months = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// Generate days 1-31
const days = Array.from({ length: 31 }, (_, i) => String(i + 1));

// Generate years from current year going back 5 years
const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => String(currentYear - i));

export function parsePublishedAtDate(dateString: string) {
  // Format: "DD Mon YYYY" (e.g., "15 Jan 2025")
  const parts = dateString.trim().split(/\s+/);
  const day = parts[0] ?? String(new Date().getDate());
  const month = months.includes(parts[1] ?? "") ? parts[1] : months[new Date().getMonth()];
  const year = years.includes(parts[2] ?? "") ? parts[2] : String(currentYear);
  return { day, month, year };
}

export function PublishMonthYearField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { day, month, year } = parsePublishedAtDate(value);

  return (
    <div className="flex gap-2">
      <DropdownSelect
        value={day}
        options={days.map((d) => ({ label: d, value: d }))}
        onChange={(nextDay) => onChange(`${nextDay} ${month} ${year}`)}
        className="w-[70px]"
      />
      <DropdownSelect
        value={month}
        options={months.map((m) => ({ label: m, value: m }))}
        onChange={(nextMonth) => onChange(`${day} ${nextMonth} ${year}`)}
        className="w-[100px]"
      />
      <DropdownSelect
        value={year}
        options={years.map((y) => ({ label: y, value: y }))}
        onChange={(nextYear) => onChange(`${day} ${month} ${nextYear}`)}
        className="w-[80px]"
      />
    </div>
  );
}
