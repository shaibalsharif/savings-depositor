import { z } from "zod";

export const ExpenseSchema = z.object({
  expenseDate: z.string().min(1, "Date is required"),
  category: z.enum(["Food", "Event", "Materials", "Bank Charge", "Conveyance", "Other"]),
  description: z.string().min(1, "Description is required").max(255),
  amount: z.coerce.number().positive("Amount must be positive"),
  linkedInvestmentId: z.string().optional(),
});

export const InvestmentSchema = z.object({
  investDate: z.string().min(1, "Date is required"),
  recipient: z.string().min(1, "Recipient is required").max(255),
  principal: z.coerce.number().positive("Amount must be positive"),
  expectedReturnDate: z.string().min(1, "Expected return date is required"),
  note: z.string().max(255).optional(),
});

export const RevenueLossSchema = z.object({
  eventDate: z.string().min(1, "Date is required"),
  sourceType: z.enum(["bank_profit", "investment_return", "business", "loss", "other"]),
  description: z.string().min(1, "Description is required").max(255),
  amount: z.coerce.number(), 
  linkedInvestmentId: z.string().optional(),
});
