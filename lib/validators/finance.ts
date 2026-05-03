import { z } from "zod";

export const ExpenseSchema = z.object({
  expenseDate: z.string().min(1, "Date is required"),
  category: z.string().min(1, "Category is required"),
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

export const UpdateInvestmentSchema = z.object({
  investDate: z.string().min(1, "Date is required"),
  recipient: z.string().min(1, "Recipient is required").max(255),
  principal: z.coerce.number().positive("Amount must be positive"),
  expectedReturnDate: z.string().min(1, "Expected return date is required"),
  actualReturnDate: z.string().optional(),
  status: z.enum(["active", "matured", "defaulted"]),
  note: z.string().max(255).optional(),
});

export const RevenueLossSchema = z.object({
  eventDate: z.string().min(1, "Date is required"),
  sourceType: z.string().min(1, "Source type is required"),
  description: z.string().min(1, "Description is required").max(255),
  amount: z.coerce.number(),
  linkedInvestmentId: z.string().optional(),
});

export const UpdateRevenueLossSchema = z.object({
  eventDate: z.string().min(1, "Date is required"),
  sourceType: z.string().min(1, "Source type is required"),
  description: z.string().min(1, "Description is required").max(255),
  amount: z.coerce.number(),
  linkedInvestmentId: z.string().optional(),
  voided: z.boolean().optional(),
  deleted: z.boolean().optional(),
});
