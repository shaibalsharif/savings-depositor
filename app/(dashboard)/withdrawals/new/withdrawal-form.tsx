"use client";

import { createWithdrawal } from "@/lib/actions/withdrawals";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Member = { userId: string; name: string };
type Fund = { id: number; title: string; currency: string; balance: string };

export function WithdrawalForm({ members, funds }: { members: Member[]; funds: Fund[] }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      await createWithdrawal(formData);
      router.push("/withdrawals");
    } catch (err: any) {
      setError(err.message || "Failed to create withdrawal");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="p-3 rounded bg-red-500/10 text-red-500 text-sm">{error}</div>}

      <div className="space-y-2">
        <label className="text-sm font-medium">Member</label>
        <select
          name="memberId"
          required
          className="w-full h-10 px-3 rounded-md bg-background border"
          style={{ borderColor: "hsl(var(--border))" }}
          defaultValue=""
        >
          <option value="" disabled>Select a member...</option>
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>{m.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount (BDT)</label>
          <input
            type="number"
            name="amount"
            required
            min="1"
            className="w-full h-10 px-3 rounded-md bg-background border"
            style={{ borderColor: "hsl(var(--border))" }}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select
            name="status"
            required
            className="w-full h-10 px-3 rounded-md bg-background border"
            style={{ borderColor: "hsl(var(--border))" }}
            defaultValue="pending"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Fund Source</label>
        <select
          name="fundId"
          required
          className="w-full h-10 px-3 rounded-md bg-background border"
          style={{ borderColor: "hsl(var(--border))" }}
          defaultValue={funds.length > 0 ? funds[0].id : ""}
        >
          {funds.map((f) => (
            <option key={f.id} value={f.id}>{f.title} (Bal: {Number(f.balance).toLocaleString()})</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Purpose</label>
        <input
          type="text"
          name="purpose"
          required
          className="w-full h-10 px-3 rounded-md bg-background border"
          style={{ borderColor: "hsl(var(--border))" }}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Details (Optional)</label>
        <textarea
          name="details"
          className="w-full p-3 rounded-md bg-background border min-h-[100px]"
          style={{ borderColor: "hsl(var(--border))" }}
        />
      </div>

      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 rounded-lg font-semibold"
          style={{
            background: "var(--teal)",
            color: "hsl(222 47% 7%)",
            opacity: isSubmitting ? 0.7 : 1,
          }}
        >
          {isSubmitting ? "Saving..." : "Save Withdrawal"}
        </button>
      </div>
    </form>
  );
}
