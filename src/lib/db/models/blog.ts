import mongoose from "mongoose";

const BLOG_STATUSES = ["draft", "published"] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

const BLOG_TYPES = ["article", "project_review"] as const;
export type BlogType = (typeof BLOG_TYPES)[number];

export interface IBlogPost {
  title: string;
  slug: string;
  content: string;
  status: BlogStatus;
  type?: BlogType;
  authorId?: string;
  metaDescription?: string;
  metaImage?: string;
  createdAt?: Date;
  updatedAt?: Date;
  // project_review only
  projectName?: string;
  developer?: string;
  location?: string;
  yearBuilt?: number | string;
  // 1. Financial Performance
  yieldPercent?: number;
  capitalGainPercent?: number;
  marketRentDisplay?: string;
  pricePerSqm?: number;
  priceMin?: number;
  priceMax?: number;
  avgRentPrice?: number; // kept for backward compat
  // 2. Project Liquidity
  occupancyRatePercent?: number;
  avgDaysOnMarket?: number;
  demandScore?: "high" | "medium" | "low";
  // 3. Operational Insight
  managementQuality?: number;
  parkingRatioPercent?: number;
  commonFeePerSqm?: number;
  // 4. Location Context
  distanceToTransit?: string;
  nearbyCatalyst?: string;
  imageKeys?: string[];
  viewCount?: number;
}

const BlogPostSchema = new mongoose.Schema<IBlogPost>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, default: "" },
    status: { type: String, required: true, enum: BLOG_STATUSES },
    type: { type: String, enum: BLOG_TYPES, default: "article" },
    authorId: String,
    metaDescription: String,
    metaImage: String,
    projectName: String,
    developer: String,
    location: String,
    yearBuilt: mongoose.Schema.Types.Mixed,
    yieldPercent: Number,
    capitalGainPercent: Number,
    marketRentDisplay: String,
    pricePerSqm: Number,
    priceMin: Number,
    priceMax: Number,
    avgRentPrice: Number,
    occupancyRatePercent: Number,
    avgDaysOnMarket: Number,
    demandScore: { type: String, enum: ["high", "medium", "low"] },
    managementQuality: Number,
    parkingRatioPercent: Number,
    commonFeePerSqm: Number,
    distanceToTransit: String,
    nearbyCatalyst: String,
    imageKeys: { type: [String], default: [] },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

BlogPostSchema.index({ slug: 1 });
BlogPostSchema.index({ status: 1 });
BlogPostSchema.index({ type: 1 });

export const BlogPost =
  mongoose.models.BlogPost ??
  mongoose.model<IBlogPost>("BlogPost", BlogPostSchema);
