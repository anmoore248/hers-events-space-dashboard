"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FormError } from "@/components/form-error";
import { useAction } from "@/hooks/use-action";
import { importAttendees } from "@/lib/actions/attendees";
import { Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CSV_COLUMNS } from "@/lib/csv";
import { buildImportPreview, unknownSubcommittees, type ImportRow } from "@/lib/import";
import { cn } from "@/lib/utils";

const template = `${CSV_COLUMNS.join(",")}\n`;

export function AttendeeImport({ eventId, existingEmails, subcommitteeNames }: { eventId: string; existingEmails: string[]; subcommitteeNames: string[] }) {
  const router = useRouter();
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [csvText, setCsvText] = React.useState("");
  const [fileError, setFileError] = React.useState<string | null>(null);
  const { run, pending, error } = useAction();
  const [rows, setRows] = React.useState<ImportRow[]>([]);
  const [mapping, setMapping] = React.useState<Record<string, string>>({});
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function load(file: File) {
    const text = await file.text();
    const preview = buildImportPreview(text, existingEmails, subcommitteeNames);
    setMapping({});
    if (!preview) {
      setFileName(null);
      setRows([]);
      setFileError(`“${file.name}” needs an email and a display_name column. Download the template to see the layout.`);
      return;
    }
    setFileError(null);
    setFileName(file.name);
    setCsvText(text);
    setRows(preview);
  }

  const unknownSubs = unknownSubcommittees(rows, subcommitteeNames);
  const counts = {
    new: rows.filter((r) => r.kind === "new" || r.kind === "unknown-sub").length,
    existing: rows.filter((r) => r.kind === "existing").length,
    errors: rows.filter((r) => r.kind === "error").length,
  };
  const step = !fileName ? 1 : 2;
  const unresolved = unknownSubs.some((s) => !mapping[s]);

  return (
    <div className="grid max-w-4xl gap-5">
      <ol className="flex gap-2" aria-label="Import steps">
        {["Upload", "Preview", "Confirm"].map((s, i) => (
          <li key={s}><Badge variant={i + 1 === step ? "solid" : "default"} aria-current={i + 1 === step ? "step" : undefined}>{i + 1} {s}</Badge></li>
        ))}
      </ol>

      <Card>
        <CardHeader><CardTitle>1. Upload CSV</CardTitle></CardHeader>
        <CardContent>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) load(f); }}
            className={cn("flex flex-wrap items-center justify-center gap-3 rounded-lg border-2 border-dashed border-hers-blue-light bg-hers-panel px-4 py-8 text-sm", dragging && "border-primary bg-secondary")}
          >
            {fileName ? <span><strong>{fileName}</strong> loaded.</span> : <span>Drag a CSV exported from Salesforce here, or</span>}
            <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>{fileName ? "Choose another file" : "Choose file"}</Button>
            <input ref={inputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => e.target.files?.[0] && load(e.target.files[0])} />
          </div>
          <FormError message={fileError} className="mt-2 text-xs font-medium text-destructive" />
          <p className="mt-2 text-xs text-muted-foreground">
            Columns: email*, display_name*, title, organization, linkedin, subcommittees (separated by ;).{" "}
            <a download="attendee-template.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent(template)}`} className="text-primary underline">Download template</a>
          </p>
        </CardContent>
      </Card>

      {fileName && (
        <Card>
          <CardHeader>
            <CardTitle>2. Preview — {fileName}</CardTitle>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge>{counts.new} new</Badge>
              <Badge variant="muted">{counts.existing} already invited</Badge>
              {counts.errors > 0 && <Badge variant="coral">{counts.errors} errors</Badge>}
              {unknownSubs.length > 0 && <Badge>{unknownSubs.length} unknown subcommittee{unknownSubs.length > 1 ? "s" : ""}</Badge>}
            </div>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><span className="sr-only">Result</span></TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Subcommittees</TableHead>
                  <TableHead>Issue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.line} className={r.kind === "error" ? "bg-destructive/5" : undefined}>
                    <TableCell aria-label={r.kind} className="font-bold">
                      {r.kind === "new" ? <Check className="size-4 text-primary" /> : r.kind === "error" ? <span className="text-destructive">!</span> : r.kind === "existing" ? "=" : "?"}
                    </TableCell>
                    <TableCell>{r.email}</TableCell>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.subs.join("; ")}</TableCell>
                    <TableCell className={r.kind === "error" ? "text-destructive" : "text-muted-foreground"}>{r.issue}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {unknownSubs.map((s) => (
              <div key={s} className="rounded-lg border border-hers-blue-light bg-hers-panel p-4">
                <p className="mb-2 text-sm font-bold text-primary">Unknown subcommittee: &ldquo;{s}&rdquo;</p>
                <div className="max-w-xs">
                  <NativeSelect aria-label={`Resolve ${s}`} value={mapping[s] ?? ""} onChange={(e) => setMapping((m) => ({ ...m, [s]: e.target.value }))}>
                    <option value="">Choose…</option>
                    {subcommitteeNames.map((n) => <option key={n} value={n}>Map to existing: {n}</option>)}
                    <option value="__create">Create new subcommittee &ldquo;{s}&rdquo;</option>
                  </NativeSelect>
                </div>
              </div>
            ))}

            {rows.length === 0 && <p className="text-sm text-muted-foreground">This file has a header row but no attendees.</p>}
            <FormError message={error} />
            <div className="flex gap-3">
              <Button
                disabled={!counts.new || unresolved || pending}
                onClick={async () => {
                  const res = await run(() => importAttendees(eventId, csvText, mapping));
                  if (res.ok) router.push(`/admin/events/${eventId}/attendees`);
                }}
              >
                {pending ? "Importing…" : `Import ${counts.new} attendee${counts.new === 1 ? "" : "s"}`}
              </Button>
              <Button variant="outline" onClick={() => { setFileName(null); setRows([]); setCsvText(""); }}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
