"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

type Member = { userId: string; name: string };

export function DepositsFilter({
  members,
  currentMember,
  currentMonth,
  currentStatus,
}: {
  members: Member[];
  currentMember: string;
  currentMonth: string;
  currentStatus: string;
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

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Member filter */}
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

      {(currentMember || currentMonth || currentStatus) && (
        <button
          onClick={() => router.push(pathname)}
          className="px-3 py-2 text-sm rounded-md font-medium"
          style={{ background: "hsl(var(--accent))", color: "hsl(var(--muted-foreground))" }}
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
