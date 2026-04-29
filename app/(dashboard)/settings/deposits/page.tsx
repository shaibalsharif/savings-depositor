import { db } from "@/db/client";
import { depositSettings } from "@/db/schema";
import { requireManager } from "@/lib/auth";
import { SettingsForm } from "./settings-form";
import { desc } from "drizzle-orm";
import { format } from "date-fns";

export default async function DepositSettingsPage() {
  await requireManager();

  const settingsHistory = await db.select().from(depositSettings).orderBy(desc(depositSettings.effectiveMonth));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Deposit Settings</h1>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <SettingsForm />
        </div>
        
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">History</h2>
          <div className="border rounded-md bg-card">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="px-4 py-2">Effective Month</th>
                  <th className="px-4 py-2">Amount (BDT)</th>
                </tr>
              </thead>
              <tbody>
                {settingsHistory.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-mono">{s.effectiveMonth}</td>
                    <td className="px-4 py-3 font-medium">{Number(s.monthlyAmount).toLocaleString()}</td>
                  </tr>
                ))}
                {settingsHistory.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">
                      No settings recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
