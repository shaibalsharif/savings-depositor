// components/tables/TableFilter.tsx
'use client'
import { useEffect, useState } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parse } from "date-fns";

interface TableFilterProps {
  months: string[];
  filterList: string[];
  onFilter: (filters: {
    user?: string;
    status?: string;
    month?: string;
    startDate?: string;
    endDate?: string;
  }) => void;
}

interface BasicUser {
  id: string;
}

interface User {
  id: string;
  preferred_email: string;
  name: string;
  picture: string;
  avatar?: string;
  username?: string;
}

const fetchUserList = async (
  setter: React.Dispatch<React.SetStateAction<User[]>>
): Promise<void> => {
  try {
    const res = await fetch("/api/users");
    if (!res.ok) throw new Error("Failed to fetch users");
    const data = await res.json();

    const userIds = data.users?.map((user: BasicUser) => user.id) ?? [];
    if (userIds.length === 0) {
      setter([]);
      return;
    }

    const resFull = await fetch("/api/deposits/depositors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds }),
    });

    if (!resFull.ok) throw new Error("Failed to fetch user details");
    const fullData: Record<string, User> = await resFull.json();
    setter(Object.values(fullData));
  } catch (error) {
    console.error("Error fetching user list:", error);
    setter([]);
  }
};



export function TableFilter({

  months,
  onFilter,
  filterList,
}: TableFilterProps) {
  const [user, setUser] = useState("");
  const [userList, setUserList] = useState<User[]>([]);
  const [status, setStatus] = useState("");
  const [month, setMonth] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const statuses = ["pending", "verified", "rejected"]
  const handleApply = () => {
    onFilter({
      user: user || undefined,
      status: status || undefined,
      month: month && month !== "all" ? format(parse(month, "MMMM yyyy", new Date()), "yyyy-MM") : undefined,
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
      endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
    });
  };

  useEffect(() => {
    if (filterList?.includes("user")) {
      fetchUserList(setUserList);
    }
  }, [filterList]);

  // useEffect(() => {
  //   let filtersettings = {
  //     user: user|undefined,
  //     status: undefined,
  //     month: undefined,
  //     startDate: undefined,
  //     endDate: undefined
  //   }
  //   if (user) {
  //     filtersettings.user = user
  //   }
  //   if (status) {
  //     filtersettings.user = status
  //   }
  //   if (month) {
  //     filtersettings.user = month
  //   }
  //   if (startDate) {
  //     filtersettings.user = format(startDate, "yyyy-MM-dd")
  //   }
  //   if (endDate) {
  //     filtersettings.user = format(endDate, "yyyy-MM-dd")
  //   }



  // }, [user, status, month, startDate, endDate])

  return (
    <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-muted/50">
      {/* USER Filter */}
      {filterList?.includes("user") && (
        <Select value={user} onValueChange={setUser}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select user" />
          </SelectTrigger>
          <SelectContent>
            {userList.length > 0 ? (
              userList.map((userItem) => {
                if (!userItem)
                  return <></>
                return (
                  <SelectItem key={userItem.id} value={userItem.id}>
                    <span className="flex items-center space-x-3">
                      <img
                        src={userItem.picture || "/fallback-avatar.png"}
                        alt={userItem.username || "User"}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="flex flex-col items-start">
                        <span className="text-sm font-medium">{userItem.username}</span>
                        <span className="text-xs text-muted-foreground">
                          {userItem.preferred_email}
                        </span>
                      </span>
                    </span>
                  </SelectItem>
                )
              })
            ) : (
              <SelectItem value="loading" disabled>
                Loading...
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      )}

      {/* STATUS Filter */}
      {filterList?.includes("status") && (
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="text-sm">
            <SelectItem  value="all">ALL</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s?.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* MONTH Filter */}
      {filterList?.includes("month") && (
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Months</SelectItem>
            {months.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* START DATE Filter */}
      {filterList?.includes("startDate") && (
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
      )}

      {/* END DATE Filter */}
      {filterList?.includes("endDate") && (
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
      )}

      <Button onClick={handleApply}>Apply</Button>
    </div>
  );
}
