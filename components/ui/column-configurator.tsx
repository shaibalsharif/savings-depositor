"use client";

import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";

export type ColumnDef = {
  id: string;
  label: string;
  defaultHidden?: boolean;
};

interface ColumnConfiguratorProps {
  tableId: string;
  columns: ColumnDef[];
}

export function ColumnConfigurator({ tableId, columns }: ColumnConfiguratorProps) {
  const [hiddenCols, setHiddenCols] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    columns.forEach(c => {
      if (c.defaultHidden) initial.add(c.id);
    });
    return initial;
  });

  // Toggle column visibility
  const toggleCol = (id: string) => {
    setHiddenCols(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <>
      <style suppressHydrationWarning>
        {Array.from(hiddenCols)
          .map(colId => `#${tableId} .col-${colId} { display: none !important; }`)
          .join("\\n")}
      </style>
      <Popover>
        <PopoverTrigger render={<Button variant="outline" size="sm" className="ml-auto flex items-center gap-2" />}>
          <Settings2 size={16} />
          View
        </PopoverTrigger>
        <PopoverContent align="end" className="w-[200px] p-3">
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Toggle Columns</h4>
            <div className="space-y-2">
              {columns.map(col => {
                const isChecked = !hiddenCols.has(col.id);
                return (
                  <label key={col.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded">
                    <input 
                      type="checkbox" 
                      className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                      checked={isChecked}
                      onChange={() => toggleCol(col.id)}
                    />
                    {col.label}
                  </label>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
