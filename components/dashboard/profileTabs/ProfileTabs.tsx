// components/dashboard/profileTabs/ProfileTabs.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { KindeUser, PersonalInfoData, NomineeInfoData } from "@/lib/actions/profile/profile";
// FIX: Use relative paths for components in the same directory
import UserTab from './UserTab';
import NomineeTab from './NomineeTab'
import PersonalInfoTab from './PersonalInfoTab';

// Corrected props interface to allow for null values in given_name and family_name
interface ProfileTabsProps {
  user: {
    id: string;
    given_name: string | null; // <-- FIX: Allow null
    family_name: string | null; // <-- FIX: Allow null
    phone: string | null;
  } | null;
  profileData: KindeUser | { error: string };
  personalInfoData: { personalInfo: PersonalInfoData | null } | { error: string };
  nomineeInfoData: { nomineeInfo: NomineeInfoData | null } | { error: string };
}

export default function ProfileTabs({ user, profileData, personalInfoData, nomineeInfoData }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState("user");

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="user">User</TabsTrigger>
        <TabsTrigger value="personal">Personal Information</TabsTrigger>
        <TabsTrigger value="nominee">Nominee</TabsTrigger>
      </TabsList>

      <TabsContent value="user">
        <UserTab initialProfile={profileData} />
      </TabsContent>

      <TabsContent value="personal">
        <PersonalInfoTab
          initialInfo={personalInfoData}
          kindeUser={{
            given_name: user?.given_name || "",
            family_name: user?.family_name || "",
            phone: user?.phone || null,
          }}
        />
      </TabsContent>

      <TabsContent value="nominee">
        <NomineeTab initialInfo={nomineeInfoData} />
      </TabsContent>
    </Tabs>
  );
}