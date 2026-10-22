"use server";

import type { ActionResult } from "@/lib/action-result";
import type { ChangePasswordInput, LoginInput, SignUpCompleteInput, SignUpVerifyInput, StaffSignUpInput, AddEventInput } from "@/lib/schemas";
import { notConnected } from "./_not-connected";

/* Not connected yet: each action below returns notConnected(). See README → "Connecting the backend". */

export async function signIn(values: LoginInput): Promise<ActionResult<{ redirectTo: string }>> { void values; return notConnected(); }

export async function signOut(): Promise<void> {}

export async function verifySignUp(values: SignUpVerifyInput): Promise<ActionResult<{ eventName: string; returning: boolean }>> { void values; return notConnected(); }

export async function completeSignUp(values: SignUpCompleteInput): Promise<ActionResult<{ redirectTo: string }>> { void values; return notConnected(); }

export async function staffSignUp(token: string, values: StaffSignUpInput): Promise<ActionResult<{ redirectTo: string }>> { void token; void values; return notConnected(); }

export async function changePassword(values: ChangePasswordInput): Promise<ActionResult> { void values; return notConnected(); }

export async function addEventWithKey(values: AddEventInput): Promise<ActionResult<{ eventId: string }>> { void values; return notConnected(); }
