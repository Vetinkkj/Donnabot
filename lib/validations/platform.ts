import { z } from "zod";

export const updateStoreAccessSchema = z.object({
  status: z.enum(["PENDING", "ACTIVE", "SUSPENDED"]).optional(),
  subscriptionExpiresAt: z
    .union([z.string().datetime(), z.null()])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === null ? null : new Date(value))),
});

export type UpdateStoreAccessInput = z.infer<typeof updateStoreAccessSchema>;
