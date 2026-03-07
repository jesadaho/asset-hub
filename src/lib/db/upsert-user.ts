import { connectDB } from "@/lib/db/mongodb";
import { User } from "@/lib/db/models/user";

export type UserInput = {
  id: string;
  name: string | null;
  image: string | null;
  provider: string;
};

export async function upsertUser(input: UserInput): Promise<void> {
  await connectDB();
  await User.findOneAndUpdate(
    { id: input.id },
    {
      $set: {
        name: input.name,
        image: input.image,
        provider: input.provider,
      },
    },
    { upsert: true }
  );
}
