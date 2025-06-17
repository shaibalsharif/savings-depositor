"use client"
interface DepositSetting {
  id?: number;
  monthlyAmount: string;
  dueDay: string;
  reminderDay: string;
  effectiveMonth: string;
}

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DepositSettingsTab() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)

  // Current setting fields
  const [currentSetting, setCurrentSetting] = useState(null);
  const [monthlyAmount, setMonthlyAmount] = useState("");
  const [dueDay, setDueDay] = useState("");
  const [reminderDay, setReminderDay] = useState("");
  const [effectiveMonth, setEffectiveMonth] = useState("");

  // Upcoming settings list
  const [upcomingSettings, setUpcomingSettings] = useState<DepositSetting[]>([]);


  // Track initial state for change detection
  const [initial, setInitial] = useState<DepositSetting | null>(null);

  useEffect(() => {
    fetch("/api/settings/deposit")
      .then((res) => res.json())
      .then((data) => {
        if (data.currentSetting) {
          setCurrentSetting(data.currentSetting);
          setMonthlyAmount(data.currentSetting.monthlyAmount);
          setDueDay(data.currentSetting.dueDay);
          setReminderDay(data.currentSetting.reminderDay);
          setEffectiveMonth(data.currentSetting.effectiveMonth);
          setInitial(data.currentSetting);
        }
        if (data.upcomingSettings) {
          setUpcomingSettings(data.upcomingSettings);
        }
      })
      .catch(() =>
        toast({ title: "Failed to load deposit settings", variant: "destructive" })
      )
      .finally(() => setLoading(false));
  }, [toast]);


  const isDirty =
    monthlyAmount !== (initial?.monthlyAmount ?? "") ||
    dueDay !== (initial?.dueDay ?? "") ||
    reminderDay !== (initial?.reminderDay ?? "") ||
    effectiveMonth !== (initial?.effectiveMonth ?? "");


  const saveSettings = async () => {
    if (!monthlyAmount || !dueDay || !reminderDay || !effectiveMonth) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    try {
      const res = await fetch("/api/settings/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyAmount, dueDay, reminderDay, effectiveMonth }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save deposit settings");
      }
      toast({ title: "Deposit settings saved" });
      setInitial({ monthlyAmount, dueDay, reminderDay, effectiveMonth });
    } catch (e) {
      toast({ title: "Error", description: "Failed to update settings!", variant: "destructive" });
    }
  };

  const deleteUpcomingSetting = async (id: number | null | undefined) => {
    if (id === null || id === undefined)
      return
    if (!confirm("Are you sure you want to delete this upcoming setting?")) return;

    try {
      const res = await fetch(`/api/settings/deposit/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete setting");
      }
      toast({ title: "Upcoming setting deleted" });
      setUpcomingSettings((prev) => prev.filter((s) => s.id !== id));
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Deposit Setting</CardTitle>
        <CardDescription>Configure monthly deposit amount and notification dates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="monthly-amount">Monthly Deposit Amount (৳)</Label>
          <Input
            id="monthly-amount"
            type="number"
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="effective-month">Effective Month</Label>
          <Input
            id="effective-month"
            type="month"
            value={effectiveMonth}
            onChange={(e) => setEffectiveMonth(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="due-day">Due Day</Label>
          <Input
            id="due-day"
            type="number"
            min={1}
            max={28}
            value={dueDay}
            onChange={(e) => setDueDay(e.target.value)}
            disabled={loading}
          />
        </div>
        <div>
          <Label htmlFor="reminder-day">Reminder Day</Label>
          <Input
            id="reminder-day"
            type="number"
            min={1}
            max={28}
            value={reminderDay}
            onChange={(e) => setReminderDay(e.target.value)}
            disabled={loading}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={saveSettings} disabled={loading || !isDirty}>
          Save Changes
        </Button>
      </CardFooter>

      <CardHeader>
        <CardTitle>Upcoming Deposit Settings</CardTitle>
        {upcomingSettings.length === 0 ? <CardDescription>No upcoming settings.</CardDescription> : <></>}
      </CardHeader>
      {upcomingSettings.length !== 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Effective Month</TableHead>
                <TableHead>Monthly Amount</TableHead>
                <TableHead>Due Day</TableHead>
                <TableHead>Reminder Day</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upcomingSettings.map((setting: DepositSetting) => (
                <TableRow key={setting.id}>
                  <TableCell>{setting.effectiveMonth}</TableCell>
                  <TableCell>{setting.monthlyAmount}</TableCell>
                  <TableCell>{setting.dueDay}</TableCell>
                  <TableCell>{setting.reminderDay}</TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      onClick={() => deleteUpcomingSetting(setting.id)}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table></div>
      ) : <></>}
    </Card>
  );
}
