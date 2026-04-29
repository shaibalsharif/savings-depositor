import { z } from "zod";

export const CreateDepositSchema = z.object({
  memberId: z.string().min(1, "Member is required"),
  amountReceived: z.coerce.number().positive("Amount must be positive"),
  paymentDate: z.string().min(1, "Payment date is required"),
  note: z.string().max(200).optional(),
});

export const UpdateDepositSchema = CreateDepositSchema;
