import { z } from "zod";

export const AuctionStatusSchema = z.enum([
  "draft",
  "active",
  "postponed",
  "closed",
  "executed",
  "cancelled",
]);

export type AuctionStatus = z.infer<typeof AuctionStatusSchema>;

export const AuctionCardTagSchema = z.enum(["hot", "new", "almost_unlocked"]);

/** Public list/card payload  deliberately excludes bid values. */
export const PublicAuctionCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional().default(""),
  imageUrl: z.string().optional().nullable(),
  imageUrls: z
    .array(z.string())
    .nullish()
    .transform((v) => v ?? []),
  videoUrl: z.string().optional().nullable(),
  status: AuctionStatusSchema.or(z.string()),
  entranceFee: z.coerce.number(),
  retailValue: z.coerce.number().optional().default(0),
  minParticipants: z.coerce.number().optional().default(10),
  participantCount: z.coerce.number().optional().default(0),
  userHasJoined: z.boolean().optional().default(false),
  prizeUnlocked: z.boolean().optional().default(false),
  tag: AuctionCardTagSchema.or(z.string()).optional().nullable(),
  closeAt: z.string().optional().nullable(),
  endsAt: z.string().optional().nullable(),
  createdAt: z.string().optional(),
  winnerName: z.string().optional().nullable(),
});

export type PublicAuctionCard = z.infer<typeof PublicAuctionCardSchema>;

export const AuctionSchema = PublicAuctionCardSchema.extend({
  minBidValue: z.coerce.number().optional().default(0.01),
  maxBidValue: z.coerce.number().optional().nullable(),
  startAt: z.string().optional().nullable(),
  executedAt: z.string().optional().nullable(),
  winnerBidId: z.string().optional().nullable(),
  winnerParticipantId: z.string().optional().nullable(),
  winnerBidValue: z.coerce.number().optional().nullable(),
  totalBids: z.coerce.number().optional().default(0),
  updatedAt: z.string().optional(),
});

export type Auction = z.infer<typeof AuctionSchema>;

export const AuctionsListSchema = z.object({
  items: z.array(AuctionSchema),
  total: z.coerce.number().optional().default(0),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
});

export type AuctionsList = z.infer<typeof AuctionsListSchema>;

export const PublicAuctionsListSchema = z.object({
  items: z.array(PublicAuctionCardSchema),
  total: z.coerce.number().optional().default(0),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(12),
  totalPages: z.coerce.number().optional().default(1),
  hasMore: z.boolean().optional().default(false),
  statusCounts: z
    .record(z.string(), z.coerce.number())
    .optional()
    .default({}),
});

export type PublicAuctionsList = z.infer<typeof PublicAuctionsListSchema>;

export const BidSchema = z.object({
  id: z.string(),
  auctionId: z.string(),
  participantId: z.string().optional(),
  bidValue: z.coerce.number(),
  isUnique: z.boolean().optional().default(false),
  isWinner: z.boolean().optional().default(false),
  placedAt: z.string().optional(),
  updatedAt: z.string().optional(),
  updateCount: z.coerce.number().optional().default(0),
  canUpdate: z.boolean().optional(),
});

export type Bid = z.infer<typeof BidSchema>;

export const AuctionParticipationSchema = z.object({
  id: z.string(),
  auctionId: z.string(),
  participantId: z.string().optional(),
  feePaid: z.coerce.number().optional(),
  status: z.string().optional(),
  createdAt: z.string().optional(),
  transactionId: z.string().optional(),
});

export type AuctionParticipation = z.infer<typeof AuctionParticipationSchema>;

export const AuctionAuditEntrySchema = z.object({
  bidValue: z.coerce.number(),
  count: z.coerce.number(),
  isUnique: z.boolean(),
  isWinner: z.boolean(),
});

export type AuctionAuditEntry = z.infer<typeof AuctionAuditEntrySchema>;

export const AuctionAuditSchema = z.object({
  auctionId: z.string(),
  title: z.string(),
  status: z.string(),
  winnerBidValue: z.coerce.number().optional().nullable(),
  winnerName: z.string().optional().nullable(),
  totalBids: z.coerce.number(),
  uniqueBidsCount: z.coerce.number(),
  duplicatedBidsCount: z.coerce.number(),
  minBidValue: z.coerce.number(),
  maxBidValue: z.coerce.number().optional().nullable(),
  entries: z.array(AuctionAuditEntrySchema),
});

export type AuctionAudit = z.infer<typeof AuctionAuditSchema>;
