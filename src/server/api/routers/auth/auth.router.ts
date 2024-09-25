import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "../../trpc";
import {
  changePassword,
  getResetPasswordById,
  register,
  resetPassword,
  signIn,
  signOut,
} from "./auth.service";
import {
  changeResetPasswordSchema,
  registerSchema,
  resetPasswordSchema,
  signInSchema,
} from "./auth.types";

export const authRouter = createTRPCRouter({
  signIn: publicProcedure.input(signInSchema).mutation(async ({ input }) => {
    await signIn(input);
  }),
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ input }) => {
      await register(input);
    }),
  signOut: protectedProcedure.query(async ({ ctx }) => {
    await signOut(ctx.user.id);
  }),
  resetPassword: publicProcedure
    .input(resetPasswordSchema)
    .mutation(async ({ input }) => {
      return await resetPassword(input);
    }),
  changeResetPassword: publicProcedure
    .input(changeResetPasswordSchema)
    .mutation(async ({ input }) => {
      await changePassword(input);
    }),
  getResetPassword: publicProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      return await getResetPasswordById(input);
    }),
});
