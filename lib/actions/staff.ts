"use server";

import type { ActionResult } from "@/lib/action-result";
import { notConnected } from "./_not-connected";
import { getCurrentUser, getSessionDetail } from "../data";
import { randomBytes } from "crypto";
import { db } from "@/app";
import { staffInvites as staffInvitesTable } from "@/app/db/schema";

/* Not connected yet: each action below returns notConnected(). See README → "Connecting the backend". */

// FIXME: saves staff invite link to table -- DONE
export async function inviteStaff(
  email: string,
): Promise<ActionResult<{ url: string }>> {
  const currentUser = await getCurrentUser();

  if (currentUser) {
    const token = randomBytes(32).toString("base64url");
    const cancelledAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(staffInvitesTable).values({
      email: currentUser.email.toLocaleLowerCase().trim(),
      token,
      invitedBy: currentUser.id,
      cancelledAt,
    });

    return {
      ok: true,
      data: { url: `${process.env.APP_URL}/staff-signup/${token}` },
    };
  }
  return { ok: false, error: "Not allowed" };
}

export async function cancelStaffInvite(
  inviteId: string,
): Promise<ActionResult> {
  void inviteId;
  return notConnected();
}
