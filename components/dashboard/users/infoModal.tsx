// components/dashboard/users/infoModal.tsx

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { getUserDataCompleteness } from "@/lib/actions/users/fetchdata";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export function InfoModal({ userId, open, onOpenChange }: { userId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const [loading, setLoading] = useState(true);
  const [completenessData, setCompletenessData] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && userId) {
      setLoading(true);
      getUserDataCompleteness(userId)
        .then(result => {
          if (result.success) {
            setCompletenessData(result.data);
          } else {
            toast({ title: "Error", description: result.message, variant: "destructive" });
          }
        })
        .catch(error => {
          toast({ title: "Error", description: "Failed to fetch data completeness.", variant: "destructive" });
          console.error(error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, userId, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>User Data Completeness</DialogTitle>
          <DialogDescription>
            {loading ? (
              // FIX: Use a span tag to prevent the div-in-p error
              <span>
                <Skeleton className="h-4 w-48 mt-2" />
              </span>
            ) : (
              <p>
                Status for **{completenessData?.user_name || completenessData?.personal_name || completenessData?.personal_name_bn}**
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : (
          <div>
            {completenessData?.isComplete ? (
              <p className="text-green-600 font-semibold text-lg">
                All required data is provided.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="font-semibold">Missing Information:</p>
                <div className="flex flex-wrap gap-2">
                  {completenessData?.missingFields.map((field: string) => (
                    <Badge key={field} variant="secondary">
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}