import { z } from "zod";

/**
 * Zod schemas shared by the browser (React Hook Form) and the server
 * (server actions, CSV import). Write once, validate in both places.
 */

const password = z.string().min(10, "Use at least 10 characters.").max(128, "Use 128 characters or fewer.");
const email = (message = "Enter a valid email address.") =>
  z.string().trim().toLowerCase().pipe(z.email(message));

export const loginSchema = z.object({
  email: email(),
  password: z.string().min(1, "Enter your password."),
});

const accessKey = z.string().trim().toUpperCase().min(4, "Enter the access key from your invitation email.");

export const signUpVerifySchema = z.object({
  email: email("Enter the email your invitation was sent to."),
  accessKey,
});

export const setPasswordSchema = z
  .object({ password, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match.",
  });

export const staffSignUpSchema = z
  .object({ name: z.string().trim().min(1, "Enter your name."), password, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match.",
  });

export const changePasswordSchema = z
  .object({ currentPassword: z.string().min(1, "Enter your current password."), newPassword: password, confirmPassword: z.string() })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match.",
  });

/** Step 2 of sign-up, checked again on the server together with step 1. */
export const signUpCompleteSchema = signUpVerifySchema
  .extend({ password, confirmPassword: z.string() })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "Passwords don't match." });

export const addEventSchema = z.object({ accessKey });

/** linkedin.com addresses only; https:// is added if missing (doc §10). */
export const linkedinUrl = z
  .string()
  .trim()
  .transform((v) => (v && !/^https?:\/\//.test(v) ? `https://${v}` : v))
  .refine((v) => v === "" || /^https:\/\/(www\.)?linkedin\.com\//i.test(v), "Must be a linkedin.com address.");

export const profileSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required."),
  title: z.string().trim().optional(),
  organization: z.string().trim().optional(),
  linkedin: linkedinUrl.optional(),
});

export const eventSchema = z
  .object({
    name: z.string().trim().min(1, "Event name is required."),
    description: z.string().optional(),
    startDate: z.string().min(1, "Choose a start date."),
    endDate: z.string().min(1, "Choose an end date."),
    timeZone: z.string().min(1),
    accessExpiry: z.string().optional(),
    location: z.string().optional(),
    virtualDetails: z.string().optional(),
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
    path: ["endDate"],
    message: "End date must be on or after the start date.",
  });

export const sessionSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required."),
    date: z.string().min(1, "Choose a date."),
    trackId: z.string().optional(),
    start: z.string().min(1, "Choose a start time."),
    end: z.string().min(1, "Choose an end time."),
    location: z.string().optional(),
    virtualLink: z.union([z.literal(""), z.url("Enter a full link, starting with https://")]).optional(),
    description: z.string().optional(),
  })
  .refine((d) => !d.start || !d.end || d.end > d.start, { path: ["end"], message: "End must be after start." });

export const sessionWithSpeakersSchema = sessionSchema.and(z.object({ speakerIds: z.array(z.string()) }));

export const speakerSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  title: z.string().optional(),
  organization: z.string().optional(),
  bio: z.string().optional(),
  email: z.union([z.literal(""), email("Enter a valid email.")]).optional(),
  linkedin: linkedinUrl.optional(),
  website: z.union([z.literal(""), z.url("Enter a full link, starting with https://")]).optional(),
});

export const eventLinkSchema = z
  .object({
    label: z.string().trim().min(1, "Label is required."),
    url: z.url({ protocol: /^https?$/, error: "Enter a full link, starting with https://" }),
    visibleFrom: z.string().optional(),
    visibleUntil: z.string().optional(),
  })
  .refine((d) => !d.visibleFrom || !d.visibleUntil || d.visibleUntil > d.visibleFrom, {
    path: ["visibleUntil"],
    message: "Must be after “Visible from”.",
  });

export const announcementSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  message: z.string().trim().min(1, "Message is required."),
  pinned: z.boolean(),
});

export const settingsSchema = z.object({
  messageStaffGroupMe: z.union([z.literal(""), z.url({ protocol: /^https?$/, error: "Enter the full GroupMe link." })]),
  helpEmail: email(),
  groupMeCleanupDays: z.coerce.number().int().min(1).max(365),
});

/** One row of the attendee CSV (Appendix A). */
export const attendeeCsvRow = z.object({
  email: email(),
  display_name: z.string().trim().min(1),
  title: z.string().optional(),
  organization: z.string().optional(),
  linkedin: linkedinUrl.optional(),
  subcommittees: z.string().optional(), // semicolon-separated
});

/** Staff editing one attendee's enrollment. */
export const attendeeSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required."),
  email: email(),
  title: z.string().trim().optional(),
  organization: z.string().trim().optional(),
  linkedin: linkedinUrl.optional(),
  individualExpiry: z.string().optional(),
  subcommitteeIds: z.array(z.string()),
});

/** Staff adding one person to the guest list without a CSV. */
export const addAttendeeSchema = z.object({
  email: email(),
  displayName: z.string().trim().min(1, "Display name is required."),
  title: z.string().trim().optional(),
  organization: z.string().trim().optional(),
});

export const subcommitteeSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  groupMeUrl: z.union([z.literal(""), z.url({ protocol: /^https?$/, error: "Enter the full GroupMe link." })]),
});

export const nameSchema = z.string().trim().min(1, "Enter a name.").max(80, "Use 80 characters or fewer.");

export const checkInPointSchema = z.object({ label: nameSchema, date: z.string().optional() });

export const emailOnlySchema = z.object({ email: email() });

export type LoginInput = z.input<typeof loginSchema>;
export type SignUpVerifyInput = z.input<typeof signUpVerifySchema>;
export type SignUpCompleteInput = z.input<typeof signUpCompleteSchema>;
export type StaffSignUpInput = z.input<typeof staffSignUpSchema>;
export type ChangePasswordInput = z.input<typeof changePasswordSchema>;
export type AddEventInput = z.input<typeof addEventSchema>;
export type ProfileInput = z.input<typeof profileSchema>;
export type EventInput = z.input<typeof eventSchema>;
export type SessionInput = z.input<typeof sessionWithSpeakersSchema>;
export type SpeakerInput = z.input<typeof speakerSchema>;
export type EventLinkInput = z.input<typeof eventLinkSchema>;
export type AnnouncementInput = z.input<typeof announcementSchema>;
export type SettingsInput = z.input<typeof settingsSchema>;
export type AttendeeInput = z.input<typeof attendeeSchema>;
export type AddAttendeeInput = z.input<typeof addAttendeeSchema>;
export type SubcommitteeInput = z.input<typeof subcommitteeSchema>;
export type CheckInPointInput = z.input<typeof checkInPointSchema>;
