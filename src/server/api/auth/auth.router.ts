import { createTRPCRouter, publicProcedure } from "../trpc";
import { register, signIn } from "./auth.service";
import { registerSchema, signInSchema } from "./auth.types";

export const authRouter = createTRPCRouter({
  signIn: publicProcedure.input(signInSchema).mutation(async ({ input }) => {
    await signIn(input);
  }),
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      await register(input);
    }),
});
