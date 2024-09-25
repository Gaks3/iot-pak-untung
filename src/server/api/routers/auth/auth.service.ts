import { db } from "@/server/db";
import type { RegisterSchema, SignInSchema } from "./auth.types";
import { TRPCError } from "@trpc/server";
import { Argon2id } from "oslo/password";
import { lucia, validateRequest } from "@/server/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

export async function register(values: RegisterSchema) {
  try {
    const hashedPassword = await new Argon2id().hash(values.password);

    const alreadyUse = await getUserByEmail(values.email);
    if (alreadyUse)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Email already in use",
      });

    const user = await db.user.create({
      data: {
        email: values.email,
        username: values.username,
        hashedPassword,
      },
    });

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
      message: "Failed to register",
    });
  }
}

export async function signOut(userId: string) {
  try {
    await lucia.invalidateSession(userId);
    await lucia.deleteExpiredSessions();

    const sessionCookie = lucia.createBlankSessionCookie();
    cookies().set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );
  } catch (error) {
    console.log(error);
    if (error instanceof TRPCError) throw error;

    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to sign out",
    });
  }
}
