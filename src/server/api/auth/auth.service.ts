import { db } from "@/server/db";
import type { SignInSchema } from "./auth.types";
import { TRPCError } from "@trpc/server";
import { Argon2id } from "oslo/password";
import { lucia } from "@/server/auth";
import { cookies } from "next/headers";

export async function getUserByEmail(email: string) {
  return await db.user.findUnique({
    where: {
      email,
    },
  });
}

export async function signIn(values: SignInSchema) {
  try {
    const user = await getUserByEmail(values.email);
    if (!user)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Email or Password is wrong",
      });

    const validPassword = await new Argon2id().verify(
      user.hashedPassword,
      values.password,
    );
    if (!validPassword)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Email or Password is wrong",
      });

    await lucia.deleteExpiredSessions();

    const session = await lucia.createSession(user.id, {});
    const sessionCookie = lucia.createSessionCookie(session.id);
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );
  } catch (error) {
    if (error instanceof TRPCError) throw error;

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to sign in",
    });
  }
}
