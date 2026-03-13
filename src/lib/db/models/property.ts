import mongoose from "mongoose";

const PROPERTY_TYPES = ["Condo", "House", "Apartment"] as const;
const STATUSES = ["Available", "Occupied", "Draft"] as const;

export type PropertyType = (typeof PROPERTY_TYPES)[number];
export type PropertyStatus = (typeof STATUSES)[number];

export interface IProperty {
  ownerId: string;
  name: string;
  type: PropertyType;
  status: PropertyStatus;
  price: number;
  address: string;
  imageKeys: string[];
  listingType?: string;
  saleWithTenant?: boolean;
  bedrooms?: string;
  bathrooms?: string;
  addressPrivate?: boolean;
  description?: string;
  squareMeters?: string;
  amenities?: string[];
  tenantName?: string;
  tenantLineId?: string;
  agentName?: string;
  agentLineId?: string;
  agentLineAccountId?: string;
  agentInviteSentAt?: Date;
  invitedAgentName?: string;
  lineGroup?: string;
  contractStartDate?: Date;
  openForAgent?: boolean;
  publicListing?: boolean;
  leaseDurationMonths?: number;
  contractKey?: string;
  reservedAt?: Date;
  reservedByName?: string;
  reservedByContact?: string;
  vacancyNotified30DayAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export const PropertySchema = new mongoose.Schema<IProperty>(
  {
    ownerId: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String, required: true, enum: PROPERTY_TYPES },
    status: { type: String, required: true, enum: STATUSES },
    price: { type: Number, required: true },
    address: { type: String, required: true },
    imageKeys: { type: [String], default: [] },
    listingType: String,
    saleWithTenant: Boolean,
    bedrooms: String,
    bathrooms: String,
    addressPrivate: Boolean,
    description: String,
    squareMeters: String,
    amenities: [String],
    tenantName: String,
    tenantLineId: String,
    agentName: String,
    agentLineId: String,
    agentLineAccountId: String,
    agentInviteSentAt: Date,
    invitedAgentName: String,
    lineGroup: String,
    contractStartDate: Date,
    openForAgent: Boolean,
    publicListing: Boolean,
    leaseDurationMonths: Number,
    contractKey: String,
    reservedAt: Date,
    reservedByName: String,
    reservedByContact: String,
    vacancyNotified30DayAt: Date,
  },
  { timestamps: true }
);

PropertySchema.index({ ownerId: 1 });

export function getPropertyModel(connection?: mongoose.Connection) {
  if (connection) {
    return (
      (connection.models.Property as mongoose.Model<IProperty> | undefined) ??
      connection.model<IProperty>("Property", PropertySchema)
    );
  }

  return (
    (mongoose.models.Property as mongoose.Model<IProperty> | undefined) ??
    mongoose.model<IProperty>("Property", PropertySchema)
  );
}

export const Property = getPropertyModel();
