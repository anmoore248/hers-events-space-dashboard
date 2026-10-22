import { attendeeCsvRow } from "./schemas";
import { CSV_COLUMNS, parseCsv } from "./csv";

/**
 * The attendee CSV import rules (doc §9, Appendix A). Used by the preview in
 * the browser and again by the server action, so both agree on every row.
 */

export type ImportKind = "new" | "error" | "existing" | "unknown-sub";

export type ImportRow = {
  line: number;
  email: string;
  name: string;
  title?: string;
  organization?: string;
  linkedin?: string;
  subs: string[];
  kind: ImportKind;
  issue?: string;
};

/** Returns null when the file has no email / display_name header. */
export function buildImportPreview(text: string, existingEmails: string[], knownSubcommittees: string[]): ImportRow[] | null {
  const [header = [], ...body] = parseCsv(text.replace(/^﻿/, ""));
  const cols = header.map((h) => h.trim().toLowerCase());
  if (!cols.includes("email") || !cols.includes("display_name")) return null;

  const existing = new Set(existingEmails.map((e) => e.toLowerCase()));
  const knownLower = knownSubcommittees.map((k) => k.toLowerCase());
  const seen = new Map<string, number>();

  return body.map((cells, i): ImportRow => {
    const line = i + 2;
    const raw = Object.fromEntries(CSV_COLUMNS.map((c) => [c, (cells[cols.indexOf(c)] ?? "").trim()])) as Record<(typeof CSV_COLUMNS)[number], string>;
    const subs = raw.subcommittees ? [...new Set(raw.subcommittees.split(";").map((s) => s.trim()).filter(Boolean))] : [];
    const base = { line, email: raw.email || "(blank)", name: raw.display_name, subs };

    const parsed = attendeeCsvRow.safeParse(raw);
    if (!parsed.success) {
      const field = parsed.error.issues[0]?.path[0];
      const issue =
        field === "email" ? "Missing or invalid email — row skipped"
        : field === "linkedin" ? "LinkedIn must be a linkedin.com address — row skipped"
        : field === "display_name" ? "Missing display name — row skipped"
        : "Invalid row — skipped";
      return { ...base, kind: "error", issue };
    }
    const row = parsed.data;
    const email = row.email;
    const full = {
      ...base,
      email,
      title: row.title || undefined,
      organization: row.organization || undefined,
      linkedin: row.linkedin || undefined,
    };
    if (seen.has(email)) return { ...full, kind: "error", issue: `Duplicate of row ${seen.get(email)} — skipped` };
    seen.set(email, line);
    if (existing.has(email)) return { ...full, kind: "existing", issue: "Already on the guest list — existing details kept" };
    const unknown = subs.find((s) => !knownLower.includes(s.toLowerCase()));
    if (unknown) return { ...full, kind: "unknown-sub", issue: `Subcommittee “${unknown}” not found` };
    return { ...full, kind: "new" };
  });
}

/** Subcommittee names in the file that don't match an existing one (case-insensitive). */
export function unknownSubcommittees(rows: ImportRow[], known: string[]) {
  const knownLower = known.map((k) => k.toLowerCase());
  const out: string[] = [];
  for (const r of rows) {
    if (r.kind === "error" || r.kind === "existing") continue;
    for (const s of r.subs) if (!knownLower.includes(s.toLowerCase()) && !out.includes(s)) out.push(s);
  }
  return out;
}
