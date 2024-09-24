import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().trim().min(1, { message: "Password required" }),
});

export type SignInSchema = z.infer<typeof signInSchema>;
