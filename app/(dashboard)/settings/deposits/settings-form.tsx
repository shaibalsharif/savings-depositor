"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createDepositSetting } from "@/lib/actions/settings";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function SettingsForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [effectiveMonth, setEffectiveMonth] = useState("");
  const [monthlyAmount, setMonthlyAmount] = useState("");

  const handleSubmit = async () => {
    if (!effectiveMonth || !monthlyAmount) {
      toast.error("Please fill all fields");
      return;
    }

    // validate YYYY-MM
    if (!/^\d{4}-\d{2}$/.test(effectiveMonth)) {
      toast.error("Effective month must be in YYYY-MM format");
      return;
    }

    setLoading(true);
    try {
      await createDepositSetting(Number(monthlyAmount), effectiveMonth);
      toast.success("Settings updated successfully");
      router.refresh();
    } catch (e: any) {
      toast.error(e.message || "Failed to update settings");
    } finally {
      setLoading(false);
      setEffectiveMonth("");
      setMonthlyAmount("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Deposit Requirements</CardTitle>
        <CardDescription>Changes will affect the FIFO allocation for the specified month onwards.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Effective Month (YYYY-MM)</Label>
          <Input 
            placeholder="e.g. 2024-05" 
            value={effectiveMonth} 
            onChange={(e) => setEffectiveMonth(e.target.value)} 
          />
        </div>
        
        <div className="space-y-2">
          <Label>Monthly Required Amount (BDT)</Label>
          <Input 
            type="number" 
            placeholder="3000" 
            value={monthlyAmount} 
            onChange={(e) => setMonthlyAmount(e.target.value)} 
          />
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSubmit} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Setting
        </Button>
      </CardFooter>
    </Card>
  );
}
