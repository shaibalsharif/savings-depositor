"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Member = { userId: string; name: string | null };

export function DepositsFilter({
  members,
  currentMember,
  currentMonth,
  currentStatus,
  showMemberFilter,
}: {
  members: Member[];
  currentMember: string;
  currentMonth: string;
  currentStatus: string;
  showMemberFilter: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("member");
    params.delete("month");
    params.delete("status");
    router.push(`${pathname}?${params.toString()}`);
  };

  const setAllTime = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("month");
    router.push(`${pathname}?${params.toString()}`);
  };

  const hasFilters = currentMember || currentMonth || currentStatus;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {/* Member filter — only for manager all-members view */}
      {showMemberFilter && (
        <select
          value={currentMember}
          onChange={(e) => update("member", e.target.value)}
          className="rounded-md px-3 py-2 text-sm outline-none"
          style={{
            background: "hsl(var(--muted))",
            border: "1px solid hsl(var(--border))",
            color: "hsl(var(--foreground))",
          }}
        >
          <option value="">All Members</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>{m.name}</option>
          ))}
        </select>
      )}

      {/* Month filter */}
      <input
        type="month"
        value={currentMonth}
        onChange={(e) => update("month", e.target.value)}
        className="rounded-md px-3 py-2 text-sm outline-none"
        style={{
          background: "hsl(var(--muted))",
          border: "1px solid hsl(var(--border))",
          color: "hsl(var(--foreground))",
          colorScheme: "dark",
        }}
      />

      {/* All Time shortcut */}
      {currentMonth && (
        <button
          onClick={setAllTime}
          className="px-3 py-2 text-sm rounded-md font-medium whitespace-nowrap"
          style={{ background: "hsl(var(--accent))", color: "hsl(var(--foreground))", border: "1px solid hsl(var(--border))" }}
        >
          All Time
        </button>
      )}

      {/* Status filter */}
      <select
        value={currentStatus}
        onChange={(e) => update("status", e.target.value)}
        className="rounded-md px-3 py-2 text-sm outline-none"
        style={{
          background: "hsl(var(--muted))",
          border: "1px solid hsl(var(--border))",
          color: "hsl(var(--foreground))",
        }}
      >
        <option value="">All Status</option>
        <option value="valid">Valid Only</option>
        <option value="voided">Voided Only</option>
      </select>

      {hasFilters && (
        <button
          onClick={clearAll}
          className="px-3 py-2 text-sm rounded-md font-medium"
          style={{ background: "hsl(var(--accent))", color: "hsl(var(--muted-foreground))" }}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
