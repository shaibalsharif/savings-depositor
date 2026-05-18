// Shared notification types

export type PushSubscriptionData = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type NotificationPayload = {
  title: string;
  body: string;
  url?: string;
  icon?: string;
};

export type DepositNotificationData = {
  paymentId: string;
  memberName: string;
  amount: number;
  forMonth: string; // YYYY-MM
  paymentDate: string;
  memberBalance: number;
  totalFundBalance: number;
  recordedAt?: string;
};

export type ReminderNotificationData = {
  memberName: string;
  forMonth: string;
  amountDue: number;
};

export type SummaryNotificationData = {
  forMonth: string;
  totalCollected: number;
  totalExpected: number;
  membersPaid: number;
  totalMembers: number;
  fundBalance: number;
  unpaidMembers: { name: string; due: number }[];
};
