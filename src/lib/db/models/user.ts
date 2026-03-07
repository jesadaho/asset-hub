import mongoose from "mongoose";

export interface IUser {
  id: string;
  name: string | null;
  image: string | null;
  provider: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new mongoose.Schema<IUser>(
  {
    id: { type: String, required: true, unique: true },
    name: String,
    image: String,
    provider: { type: String, required: true },
  },
  { timestamps: true }
);

UserSchema.index({ id: 1 });

export const User =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
