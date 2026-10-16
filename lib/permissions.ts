import { createAccessControl } from "better-auth/plugins/access";
import {
  adminAc,
  defaultStatements,
  userAc,
} from "better-auth/plugins/admin/access";

/** The two roles from the documentation (§2): staff can manage users, attendees can't. */
export const ac = createAccessControl(defaultStatements);
export const staff = ac.newRole({ ...adminAc.statements });
export const attendee = ac.newRole({ ...userAc.statements });
