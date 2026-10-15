import { z } from "zod";

export const ProductStatusSchema = z.enum([
  "draft",
  "active",
  "postponed",
  "closed",
  "executed",
  "cancelled",
]);

export type ProductStatus = z.infer<typeof ProductStatusSchema>;

export const LubProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional().default(""),
  imageUrl: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  status: ProductStatusSchema.or(z.string()),
  entranceFee: z.coerce.number(),
  minBidValue: z.coerce.number().optional().default(0.01),
  maxBidValue: z.coerce.number().optional().nullable(),
  startAt: z.string().optional().nullable(),
  closeAt: z.string().optional().nullable(),
  executedAt: z.string().optional().nullable(),
  winnerId: z.string().optional().nullable(),
  winnerBidValue: z.coerce.number().optional().nullable(),
  winnerName: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type LubProduct = z.infer<typeof LubProductSchema>;

export const LubProductsListSchema = z.object({
  items: z.array(LubProductSchema),
  total: z.coerce.number().optional().default(0),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
});

export type LubProductsList = z.infer<typeof LubProductsListSchema>;

export const BidEntrySchema = z.object({
  id: z.string(),
  productId: z.string(),
  participantId: z.string().optional(),
  bidValue: z.coerce.number(),
  isUnique: z.boolean().optional().default(false),
  isWinner: z.boolean().optional().default(false),
  placedAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type BidEntry = z.infer<typeof BidEntrySchema>;

export const LubParticipationSchema = z.object({
  id: z.string(),
  productId: z.string(),
  participantId: z.string().optional(),
  feePaid: z.coerce.number().optional(),
  status: z.string().optional(),
  joinedAt: z.string().optional(),
  transactionId: z.string().optional(),
});

export type LubParticipation = z.infer<typeof LubParticipationSchema>;
