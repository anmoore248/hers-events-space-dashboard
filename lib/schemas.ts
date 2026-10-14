import { z } from "zod";

/**
 * Zod schemas shared by the browser (React Hook Form) and the server
 * (server actions, CSV import). Write once, validate in both places.
 */

const password = z.string().min(10, "Use at least 10 characters.");

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const signUpVerifySchema = z.object({
  email: z.email("Enter the email your invitation was sent to."),
  accessKey: z.string().trim().min(4, "Enter the access key from your invitation email."),
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

export const addEventSchema = z.object({
  accessKey: z.string().trim().min(4, "Enter the access key from your invitation email."),
});

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

export const speakerSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  title: z.string().optional(),
  organization: z.string().optional(),
  bio: z.string().optional(),
  email: z.union([z.literal(""), z.email("Enter a valid email.")]).optional(),
  linkedin: linkedinUrl.optional(),
  website: z.union([z.literal(""), z.url("Enter a full link, starting with https://")]).optional(),
});

export const eventLinkSchema = z.object({
  label: z.string().trim().min(1, "Label is required."),
  url: z.url("Enter a full link, starting with https://"),
  visibleFrom: z.string().optional(),
  visibleUntil: z.string().optional(),
});

export const announcementSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  message: z.string().trim().min(1, "Message is required."),
  pinned: z.boolean(),
});

export const settingsSchema = z.object({
  messageStaffGroupMe: z.url("Enter the full GroupMe link."),
  helpEmail: z.email(),
  groupMeCleanupDays: z.coerce.number().int().min(1).max(365),
});

/** One row of the attendee CSV (Appendix A). */
export const attendeeCsvRow = z.object({
  email: z.email(),
  display_name: z.string().trim().min(1),
  title: z.string().optional(),
  organization: z.string().optional(),
  linkedin: linkedinUrl.optional(),
  subcommittees: z.string().optional(), // semicolon-separated
});
