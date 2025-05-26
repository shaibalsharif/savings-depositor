// components/tables/TableFilter.tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";

interface TableFilterProps {
  statuses: string[];
  months: string[];
  onFilter: (filters: {
    email?: string;
    status?: string;
    month?: string;
    startDate?: string;
    endDate?: string;
  }) => void;
}

export function TableFilter({ statuses, months, onFilter }: TableFilterProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [month, setMonth] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();

  const handleApply = () => {
    onFilter({
      email: email || undefined,
      status: status || undefined,
      month: month || undefined,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
    });
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
      <Input
        placeholder="Filter by email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          {statuses.map((s) => (
            <SelectItem key={s} value={s}>{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={month} onValueChange={setMonth}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Month" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Months</SelectItem>
          {months.map((m) => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[120px]">
            {startDate ? format(startDate, "MMM dd") : "Start date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={setStartDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-[120px]">
            {endDate ? format(endDate, "MMM dd") : "End date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={setEndDate}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      <Button onClick={handleApply}>Apply</Button>
    </div>
  );
}
