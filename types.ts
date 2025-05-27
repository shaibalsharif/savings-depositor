// types.ts

export interface Deposit {
  id: number | string;
  userEmail: string;
  month: string;
  amount: number;
  transactionId: string;
  depositType: "full" | "partial";
  imageUrl?: string | null;
  status: "pending" | "verified" | "rejected";
  createdAt: string;
  // ...add other fields as needed
}

export interface DepositFilters {
  email?: string;
  month?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface Fund {

}
