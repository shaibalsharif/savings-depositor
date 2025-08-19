"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function DepositsTabsNav() {
    const pathname = usePathname();
    const activeTab = pathname.split('/').pop() || 'deposits';

    return (
        <Tabs value={activeTab}>
            <TabsList>
                <TabsTrigger value="deposits">
                    <Link href="/dashboard/deposits">Upload Receipt</Link>
                </TabsTrigger>
                <TabsTrigger value="mydeposits">
                    <Link href="/dashboard/deposits/mydeposits">Your Deposits</Link>
                </TabsTrigger>
                <TabsTrigger value="alldeposits">
                    <Link href="/dashboard/deposits/alldeposits">All Deposits</Link>
                </TabsTrigger>
                <TabsTrigger value="reviewdeposits">
                    <Link href="/dashboard/deposits/reviewdeposits">Review Deposits</Link>
                </TabsTrigger>
            </TabsList>
        </Tabs>
    );
}