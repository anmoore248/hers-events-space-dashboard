import {
  pgSchema,
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
  integer,
  date,
  boolean,
  jsonb,
  index,
  foreignKey,
  primaryKey,
  unique,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const neonAuth = pgSchema("neon_auth");

export const enrollmentStatus = pgEnum("enrollment_status", [
  "invited",
  "active",
  "revoked",
]);

export const accountInNeonAuth = neonAuth.table(
  "account",
  {
    id: uuid().defaultRandom().primaryKey(),
    accountId: text().notNull(),
    providerId: text().notNull(),
    userId: uuid().notNull(),
    accessToken: text(),
    refreshToken: text(),
    idToken: text(),
    accessTokenExpiresAt: timestamp({ withTimezone: true }),
    refreshTokenExpiresAt: timestamp({ withTimezone: true }),
    scope: text(),
    password: text(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userInNeonAuth.id],
      name: "account_userId_fkey",
    }).onDelete("cascade"),
    index("account_userId_idx").using("btree", table.userId.asc().nullsLast()),
  ],
);

export const invitationInNeonAuth = neonAuth.table(
  "invitation",
  {
    id: uuid().defaultRandom().primaryKey(),
    organizationId: uuid().notNull(),
    email: text().notNull(),
    role: text(),
    status: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    inviterId: uuid().notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.inviterId],
      foreignColumns: [userInNeonAuth.id],
      name: "invitation_inviterId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizationInNeonAuth.id],
      name: "invitation_organizationId_fkey",
    }).onDelete("cascade"),
    index("invitation_email_idx").using("btree", table.email.asc().nullsLast()),
    index("invitation_organizationId_idx").using(
      "btree",
      table.organizationId.asc().nullsLast(),
    ),
  ],
);

export const jwksInNeonAuth = neonAuth.table("jwks", {
  id: uuid().defaultRandom().primaryKey(),
  publicKey: text().notNull(),
  privateKey: text().notNull(),
  createdAt: timestamp({ withTimezone: true }).notNull(),
  expiresAt: timestamp({ withTimezone: true }),
  alg: text(),
  crv: text(),
});

export const memberInNeonAuth = neonAuth.table(
  "member",
  {
    id: uuid().defaultRandom().primaryKey(),
    organizationId: uuid().notNull(),
    userId: uuid().notNull(),
    role: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizationInNeonAuth.id],
      name: "member_organizationId_fkey",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userInNeonAuth.id],
      name: "member_userId_fkey",
    }).onDelete("cascade"),
    index("member_organizationId_idx").using(
      "btree",
      table.organizationId.asc().nullsLast(),
    ),
    index("member_userId_idx").using("btree", table.userId.asc().nullsLast()),
  ],
);

export const organizationInNeonAuth = neonAuth.table(
  "organization",
  {
    id: uuid().defaultRandom().primaryKey(),
    name: text().notNull(),
    slug: text().notNull(),
    logo: text(),
    createdAt: timestamp({ withTimezone: true }).notNull(),
    metadata: text(),
  },
  (table) => [unique("organization_slug_key").on(table.slug)],
);

export const projectConfigInNeonAuth = neonAuth.table(
  "project_config",
  {
    id: uuid().defaultRandom().primaryKey(),
    name: text().notNull(),
    endpointId: text("endpoint_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    trustedOrigins: jsonb("trusted_origins").notNull(),
    socialProviders: jsonb("social_providers").notNull(),
    emailProvider: jsonb("email_provider"),
    emailAndPassword: jsonb("email_and_password"),
    allowLocalhost: boolean("allow_localhost").notNull(),
    pluginConfigs: jsonb("plugin_configs"),
    webhookConfig: jsonb("webhook_config"),
  },
  (table) => [unique("project_config_endpoint_id_key").on(table.endpointId)],
);

export const sessionInNeonAuth = neonAuth.table(
  "session",
  {
    id: uuid().defaultRandom().primaryKey(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    token: text().notNull(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true }).notNull(),
    ipAddress: text(),
    userAgent: text(),
    userId: uuid().notNull(),
    impersonatedBy: text(),
    activeOrganizationId: text(),
  },
  (table) => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [userInNeonAuth.id],
      name: "session_userId_fkey",
    }).onDelete("cascade"),
    index("session_userId_idx").using("btree", table.userId.asc().nullsLast()),
    unique("session_token_key").on(table.token),
  ],
);

export const userInNeonAuth = neonAuth.table(
  "user",
  {
    id: uuid().defaultRandom().primaryKey(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean().notNull(),
    image: text(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    role: text(),
    banned: boolean(),
    banReason: text(),
    banExpires: timestamp({ withTimezone: true }),
  },
  (table) => [unique("user_email_key").on(table.email)],
);

export const verificationInNeonAuth = neonAuth.table(
  "verification",
  {
    id: uuid().defaultRandom().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  },
  (table) => [
    index("verification_identifier_idx").using(
      "btree",
      table.identifier.asc().nullsLast(),
    ),
  ],
);

export const account = pgTable(
  "account",
  {
    id: text().primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text(),
    password: text(),
    createdAt: timestamp("created_at")
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp("updated_at").notNull(),
  },
  (table) => [
    index("account_userId_idx").using("btree", table.userId.asc().nullsLast()),
  ],
);

export const activityLog = pgTable(
  "activity_log",
  {
    id: uuid().defaultRandom().primaryKey(),
    actorId: text("actor_id").references(() => user.id),
    action: text().notNull(),
    details: text().notNull(),
    eventId: uuid("event_id").references(() => events.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    index("activity_log_created_at_index").using(
      "btree",
      table.createdAt.asc().nullsLast(),
    ),
  ],
);

export const announcementReads = pgTable(
  "announcement_reads",
  {
    announcementId: uuid("announcement_id")
      .notNull()
      .references(() => announcements.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.announcementId, table.userId],
      name: "announcement_reads_pkey",
    }),
  ],
);

export const announcements = pgTable("announcements", {
  id: uuid().defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  title: text().notNull(),
  body: text().notNull(),
  pinned: boolean().default(false).notNull(),
  sentBy: text("sent_by")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
});

export const checkInPoints = pgTable("check_in_points", {
  id: uuid().defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  label: text().default("Arrival").notNull(),
  date: date(),
});

export const checkIns = pgTable(
  "check_ins",
  {
    id: uuid().defaultRandom().primaryKey(),
    pointId: uuid("point_id")
      .notNull()
      .references(() => checkInPoints.id, { onDelete: "cascade" }),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    checkedInBy: text("checked_in_by")
      .notNull()
      .references(() => user.id),
  },
  (table) => [
    unique("check_ins_point_id_enrollment_id_unique").on(
      table.pointId,
      table.enrollmentId,
    ),
  ],
);

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid().defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => user.id),
    invitedEmail: text("invited_email").notNull(),
    status: enrollmentStatus().default("invited").notNull(),
    individualExpiry: date("individual_expiry"),
    displayName: text("display_name").notNull(),
    title: text(),
    organization: text(),
    linkedin: text(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    index("enrollments_user_id_index").using(
      "btree",
      table.userId.asc().nullsLast(),
    ),
    unique("enrollments_event_id_invited_email_unique").on(
      table.eventId,
      table.invitedEmail,
    ),
  ],
);

export const eventLinks = pgTable("event_links", {
  id: uuid().defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  label: text().notNull(),
  url: text().notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  visibleFrom: timestamp("visible_from", { withTimezone: true }),
  visibleUntil: timestamp("visible_until", { withTimezone: true }),
});

export const events = pgTable(
  "events",
  {
    id: uuid().defaultRandom().primaryKey(),
    name: text().notNull(),
    description: text().default("").notNull(),
    startDate: date("start_date").notNull(),
    endDate: date("end_date").notNull(),
    timeZone: text("time_zone").notNull(),
    location: text(),
    virtualDetails: text("virtual_details"),
    accessExpiry: date("access_expiry").notNull(),
    accessKey: text("access_key").notNull(),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [unique("events_access_key_key").on(table.accessKey)],
);

export const session = pgTable(
  "session",
  {
    id: text().primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text().notNull(),
    createdAt: timestamp("created_at")
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [
    index("session_userId_idx").using("btree", table.userId.asc().nullsLast()),
    unique("session_token_key").on(table.token),
  ],
);

export const sessionSpeakers = pgTable(
  "session_speakers",
  {
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessionsAgenda.id, { onDelete: "cascade" }),
    speakerId: uuid("speaker_id")
      .notNull()
      .references(() => speakers.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").default(0).notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.sessionId, table.speakerId],
      name: "session_speakers_pkey",
    }),
  ],
);

export const sessionsAgenda = pgTable(
  "sessions_agenda",
  {
    id: uuid().defaultRandom().primaryKey(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    trackId: uuid("track_id").references(() => tracks.id, {
      onDelete: "set null",
    }),
    title: text().notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    location: text(),
    virtualLink: text("virtual_link"),
    description: text().default("").notNull(),
  },
  (table) => [
    index("sessions_agenda_event_id_starts_at_index").using(
      "btree",
      table.eventId.asc().nullsLast(),
      table.startsAt.asc().nullsLast(),
    ),
  ],
);

export const settings = pgTable("settings", {
  key: text().primaryKey(),
  value: text().notNull(),
  updatedBy: text("updated_by").references(() => user.id),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
});

export const speakers = pgTable("speakers", {
  id: uuid().defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text().notNull(),
  title: text(),
  organization: text(),
  bio: text().default("").notNull(),
  email: text(),
  linkedin: text(),
  website: text(),
});

export const staffInvites = pgTable(
  "staff_invites",
  {
    id: uuid().defaultRandom().primaryKey(),
    email: text().notNull(),
    token: text().notNull(),
    invitedBy: text("invited_by")
      .notNull()
      .references(() => user.id),
    usedAt: timestamp("used_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [unique("staff_invites_token_key").on(table.token)],
);

export const subcommitteeMembers = pgTable(
  "subcommittee_members",
  {
    subcommitteeId: uuid("subcommittee_id")
      .notNull()
      .references(() => subcommittees.id, { onDelete: "cascade" }),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => enrollments.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({
      columns: [table.subcommitteeId, table.enrollmentId],
      name: "subcommittee_members_pkey",
    }),
  ],
);

export const subcommittees = pgTable("subcommittees", {
  id: uuid().defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text().notNull(),
  groupMeUrl: text("group_me_url").notNull(),
});

export const tracks = pgTable("tracks", {
  id: uuid().defaultRandom().primaryKey(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id, { onDelete: "cascade" }),
  name: text().notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
});

export const user = pgTable(
  "user",
  {
    id: text().primaryKey(),
    name: text().notNull(),
    email: text().notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    image: text(),
    createdAt: timestamp("created_at")
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`now()`)
      .notNull(),
    role: text(),
    banned: boolean().default(false),
    banReason: text("ban_reason"),
    banExpires: timestamp("ban_expires"),
    passwordCleared: boolean("password_cleared").default(false).notNull(),
  },
  (table) => [unique("user_email_key").on(table.email)],
);

export const verification = pgTable(
  "verification",
  {
    id: text().primaryKey(),
    identifier: text().notNull(),
    value: text().notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at")
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    index("verification_identifier_idx").using(
      "btree",
      table.identifier.asc().nullsLast(),
    ),
  ],
);
