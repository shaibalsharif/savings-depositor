// types.ts
export interface Deposit {
  id: number | string;
  userId: string;
  month: string;
  amount: number;
  fundId: number | undefined | "" | null;
  transactionId: string | null;
  depositType: "full" | "partial";
  imageUrl?: string | null;
  status: "pending" | "verified" | "rejected";
  updatedBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface AllDeposit {
  id: number;
  month: string;
  amount: number;
  transactionId: string | null;
  createdAt: Date;
  status: "pending" | "verified" | "rejected";
  depositType: "full" | "partial";
  imageUrl: string | null;
  userId: string;
  user: {
    name: string | null;
    email: string;
    picture: string | null;
    mobile: string | null;
  };
}

// FIX: Define and export FullDeposit
export interface FullDeposit extends Deposit {
  user: AllDeposit['user'];
}

export interface DepositFilters {
  email?: string;
  month?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface Fund {
  id: number;
  title: string;
  balance: string; // Drizzle numeric types are strings
  currency: string;
}

export interface WithdrawalUser {
  id: string;
  name: string | null;
  email: string;
  mobile: string | null;
  picture?: string | null;
}

export interface Withdrawal {
  id: number;
  userId: string;
  amount: string;
  fundId: number | null;
  purpose: string;
  details: string | null;
  status: "pending" | "approved" | "rejected";
  reviewedBy: string | null;
  createdAt: Date; // Drizzle's timestamp with timezone typically maps to Date
  reviewedAt: Date | null;
  attachmentUrl: string | null;
  rejectionReason: string | null;
}

// Your FullWithdrawal interface
export interface FullWithdrawal extends Withdrawal {
  user: {
    id: string;
    name: string | null;
    email: string;
    mobile: string | null;
    picture?: string | null;
  } | null;
}