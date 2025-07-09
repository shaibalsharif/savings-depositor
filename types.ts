// types.ts

export interface Deposit {
  id: number | string;
  userId: string;
  month: string;
  amount: number;
  fundId: number | undefined | "" | null;
  transactionId: string;
  depositType: "full" | "partial";
  imageUrl?: string | null;
  status: "pending" | "verified" | "rejected";
  updatedBalance: number;
  createdAt: string;
  updatedAt: string;
  // ...add other fields as needed
}

export interface DepositFilters {
  email?: string;
  month?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface Fund {}


export interface Withdrawal {
  id: number | string;
  userId: string;
  username: string;
  useremail: string;
  email: string;
  amount: number;
  purpose: string;
  details: string;
  attachmentUrl: string | null;
  status: "pending";
  createdAt: any;
}
