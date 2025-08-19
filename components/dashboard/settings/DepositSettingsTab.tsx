"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { saveDepositSettings, deleteUpcomingSetting, getDepositSettings } from "@/lib/actions/settings/depositSettings";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";

interface DepositSetting {
  id?: number;
  monthlyAmount: string;
  dueDay: string;
  reminderDay: string;
  effectiveMonth: string;
}

interface DepositSettingsTabProps {
  initialSettings: {
    currentSetting: DepositSetting | null;
    upcomingSettings: DepositSetting[];
  } | { error: string };
}

export default function DepositSettingsClientTab({ initialSettings }: DepositSettingsTabProps) {
  const { toast } = useToast();
  const { user } = useKindeAuth();
  const [loading, setLoading] = useState(false);

  const [currentSetting, setCurrentSetting] = useState(
    "error" in initialSettings ? null : initialSettings.currentSetting
  );
  const [upcomingSettings, setUpcomingSettings] = useState(
    "error" in initialSettings ? [] : initialSettings.upcomingSettings
  );

  const [monthlyAmount, setMonthlyAmount] = useState(currentSetting?.monthlyAmount || "");
  const [dueDay, setDueDay] = useState(currentSetting?.dueDay || "");
  const [reminderDay, setReminderDay] = useState(currentSetting?.reminderDay || "");
  const [effectiveMonth, setEffectiveMonth] = useState(currentSetting?.effectiveMonth || "");

  const [initialState, setInitialState] = useState({
    monthlyAmount: currentSetting?.monthlyAmount || "",
    dueDay: currentSetting?.dueDay || "",
    reminderDay: currentSetting?.reminderDay || "",
    effectiveMonth: currentSetting?.effectiveMonth || ""
  });

  const isDirty =
    monthlyAmount !== initialState.monthlyAmount ||
    dueDay !== initialState.dueDay ||
    reminderDay !== initialState.reminderDay ||
    effectiveMonth !== initialState.effectiveMonth;

  const handleSaveSettings = async () => {
    if (!user?.id) {
      toast({ title: "Unauthorized", description: "User not logged in.", variant: "destructive" });
      return;
    }
    if (!monthlyAmount || !dueDay || !reminderDay || !effectiveMonth) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    const data = { monthlyAmount, dueDay, reminderDay, effectiveMonth };
    const result = await saveDepositSettings(data, user.id);

    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Deposit settings saved" });
      setInitialState(data);
      // For simplicity, you might re-fetch all settings after a successful save.
      // A more complex solution would be to update the state optimistically.
      const newSettingsResult = await getDepositSettings();
      if (!("error" in newSettingsResult)) {
        setCurrentSetting(newSettingsResult.currentSetting);
        setUpcomingSettings(newSettingsResult.upcomingSettings);
      }
    }
    setLoading(false);
  };

  const handleDeleteUpcomingSetting = async (id: number | undefined) => {
    if (typeof id !== 'number') return;
    if (!confirm("Are you sure you want to delete this upcoming setting?")) return;

    setLoading(true);
    const result = await deleteUpcomingSetting(id);

    if ("error" in result) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Upcoming setting deleted" });
      setUpcomingSettings((prev) => prev.filter((s) => s.id !== id));
    }
    setLoading(false);
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
        <Button onClick={handleSaveSettings} disabled={loading || !isDirty}>
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
                      onClick={() => handleDeleteUpcomingSetting(setting.id)}
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