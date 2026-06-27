"use client";

import { DropdownSelect } from "@/components/ui/dropdown-select";

const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function parsePublishedLabel(label: string) {
  const [month = "Jan", year = String(new Date().getFullYear())] = label.split(" ");
  return { month, year };
}

export function PublishMonthYearField({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { month, year } = parsePublishedLabel(value);

  return (
    <div className="flex gap-3">
      <DropdownSelect
        value={month}
        options={months.map((entry) => ({ label: entry, value: entry }))}
        onChange={(nextMonth) => onChange(`${nextMonth} ${year}`)}
        className="w-[110px]"
      />
      <input
        value={year}
        onChange={(event) => onChange(`${month} ${event.target.value}`)}
        className="w-28 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-white outline-none"
      />
    </div>
  );
}
