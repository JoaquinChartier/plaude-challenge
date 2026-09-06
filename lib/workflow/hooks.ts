import { defineHook } from "workflow";
import { z } from "zod";

export const approvalDecisionSchema = z.object({
  approved: z.boolean(),
  note: z.string().optional(),
  by: z.string().optional(),
});

export type ApprovalDecision = z.infer<typeof approvalDecisionSchema>;

export const approvalHook = defineHook<ApprovalDecision>({
  schema: approvalDecisionSchema,
});
