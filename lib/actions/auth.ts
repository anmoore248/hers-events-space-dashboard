"use server";

import type { ActionResult } from "@/lib/action-result";
import type {
  ChangePasswordInput,
  LoginInput,
  SignUpCompleteInput,
  SignUpVerifyInput,
  StaffSignUpInput,
  AddEventInput,
} from "@/lib/schemas";
import { notConnected } from "./_not-connected";
import { db } from "@/app";
import { user as usersTable } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/server";

/* Not connected yet: each action below returns notConnected(). See README → "Connecting the backend". */

export async function signIn(
  values: LoginInput,
): Promise<ActionResult<{ redirectTo: string }>> {
  // 1. check inputted value is a user in betterAuth
  const checkBetterAuth = await auth.signIn.email({
    email: values.email,
    password: values.password,
  });

  if (checkBetterAuth.data) {
    // 2. it the user does exist, find the user's role in the Neon DB
    const findUserInNeonDB = await db
      .select({
        userRole: usersTable.role,
      })
      .from(usersTable)
      .where(eq(usersTable.email, checkBetterAuth.data.user.email));

    if (findUserInNeonDB.length <= 0) {
      return {
        ok: false,
        error: "You do not have an account, please sign up.",
      };
    } else if (findUserInNeonDB.length === 1) {
      const { userRole } = findUserInNeonDB[0];

      // 3. route to correct page based on role
      if (userRole?.toLocaleLowerCase() === "admin") {
        return {
          ok: true,
          data: { redirectTo: "/admin" },
        };
      } else if (userRole?.toLocaleLowerCase() === "user") {
        return {
          ok: true,
          data: { redirectTo: "/dashboard" },
        };
      } else {
        return {
          ok: false,
          error: 'You are not designated as a "staff member" or an "attendee".',
        };
      }
    } else {
      return {
        ok: false,
        error:
          "You have more than one account. Please contact HERS at <<hers@hersnetwork.org>> to resolve this issue.",
      };
    }
  } else {
    return { ok: false, error: checkBetterAuth.error.message as string };
  }

  return notConnected();
}

export async function signOut(): Promise<void> {}

export async function verifySignUp(
  values: SignUpVerifyInput,
): Promise<ActionResult<{ eventName: string; returning: boolean }>> {
  void values;
  return notConnected();
}

export async function completeSignUp(
  values: SignUpCompleteInput,
): Promise<ActionResult<{ redirectTo: string }>> {
  void values;
  return notConnected();
}

/**
 * Allows staff to signup using the sign-up form
 * @param token
 * @param values
 * @returns
 */
export async function staffSignUp(
  token: string,
  values: StaffSignUpInput,
): Promise<ActionResult<{ redirectTo: string }>> {
  // void token;
  // void values;
  console.log("TEST token", token, "values", values.name);
  return notConnected();
}

export async function changePassword(
  values: ChangePasswordInput,
): Promise<ActionResult> {
  void values;
  return notConnected();
}

export async function addEventWithKey(
  values: AddEventInput,
): Promise<ActionResult<{ eventId: string }>> {
  void values;
  return notConnected();
}
