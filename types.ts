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


// Assuming this is your base Withdrawal type
export interface Withdrawal {
    id: number;
    userId: string;
    amount: string; // Drizzle's numeric maps to string in TypeScript by default
    fundId: number | null;
    purpose: string;
    details: string | null;
    // HERE IS THE CHANGE: Define status as a union of literal strings
    status: 'pending' | 'approved' | 'rejected';
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
        name?: string;
        mobile?: string;
        // ... any other fields from personalInfo you're joining
    } | null;
}