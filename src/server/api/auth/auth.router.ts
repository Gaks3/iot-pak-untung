import { createTRPCRouter, publicProcedure } from "../trpc";
import { signIn } from "./auth.service";
import { signInSchema } from "./auth.types";

export const authRouter = createTRPCRouter({
  signIn: publicProcedure.input(signInSchema).mutation(async ({ input }) => {
    await signIn(input);
  }),
});
