"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs"
import UserTab from "@/components/dashboard/profileTabs/usertab"
import PersonalInfoTab from "@/components/dashboard/profileTabs/personal-infoTab"
import NomineeTab from "@/components/dashboard/profileTabs/nomineeTab"

export default function ProfilePage() {
  const { user, isLoading } = useKindeAuth()
  const [activeTab, setActiveTab] = useState("user")

  if (isLoading || !user) return <div>Loading...</div>

  return (
    <div className="container py-8">
       <h1 className="text-2xl font-bold mb-2">Profile</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="user">User</TabsTrigger>
          <TabsTrigger value="personal">Personal Information</TabsTrigger>
          <TabsTrigger value="nominee">Nominee</TabsTrigger>
        </TabsList>

        <TabsContent value="user">
          <UserTab user={user} />
        </TabsContent>

        <TabsContent value="personal">
          <PersonalInfoTab user={user} />
        </TabsContent>

        <TabsContent value="nominee">
          <NomineeTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
