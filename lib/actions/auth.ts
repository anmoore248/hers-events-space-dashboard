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

// FIXME: Signin -- DONE
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

      // 3. route to correct page based on role (admin = HERS staff, user = attendee)
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
          error:
            'You are not designated as a "staff member" or an "attendee". Please contact HERS at <<hers@hersnetwork.org>> to resolve this issue.',
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
    const errorMessage = checkBetterAuth.error.message as string;
    return {
      ok: false,
      error: `${errorMessage}. Please contact HERS at <<hers@hersnetwork.org>> to resolve this issue.`,
    };
  }
}

export async function signOut(): Promise<void> {
  // const {data: session} = await auth.revokeSession(); ??
}

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

export async function staffSignUp(
  token: string,
  values: StaffSignUpInput,
): Promise<ActionResult<{ redirectTo: string }>> {
  console.log("values", values, "token", token);
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
