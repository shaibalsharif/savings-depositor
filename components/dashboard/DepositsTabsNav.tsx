"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";

export function DepositsTabsNav() {
    const pathname = usePathname();
    const activeTab = pathname.split('/').pop() || 'deposits';
    const { getPermissions } = useKindeAuth()
    const permissions = getPermissions()
   
    
    const isAdmin = permissions.permissions?.includes("admin")
    const isManager = permissions.permissions?.includes("manager")

    return (
        <Tabs value={activeTab} className="w-full">
            {/* This wrapper allows the TabsList to scroll horizontally on small screens */}
            <div className="w-full overflow-x-auto pb-1">
                <TabsList className="min-w-max">
                    <TabsTrigger value="deposits">
                        <Link href="/dashboard/deposits">Upload Receipt</Link>
                    </TabsTrigger>
                    <TabsTrigger value="mydeposits">
                        <Link href="/dashboard/deposits/mydeposits">Your Deposits</Link>
                    </TabsTrigger>
                    {isAdmin || isManager ? (<TabsTrigger value="alldeposits">
                        <Link href="/dashboard/deposits/alldeposits">All Deposits</Link>
                    </TabsTrigger>) : <></>}
                    {isAdmin || isManager ? (<TabsTrigger value="reviewdeposits">
                        <Link href="/dashboard/deposits/reviewdeposits">Review Deposits</Link>
                    </TabsTrigger>) : <></>}
                </TabsList>
            </div>
        </Tabs>
    );
}