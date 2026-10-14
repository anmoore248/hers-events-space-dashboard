"use client";

import { Button } from "@/components/ui/button";
import { SearchableList } from "./searchable-list";

type Row = { id: string; displayName: string; title?: string; organization?: string; linkedin?: string };

/** Name, title, organization, LinkedIn. Emails are never shown (doc §10). */
export function DirectoryList({ people }: { people: Row[] }) {
  return (
    <SearchableList
      title="Participants"
      items={people}
      getKey={(p) => p.id}
      placeholder="Search name, title, organization"
      searchText={(p) => `${p.displayName} ${p.title ?? ""} ${p.organization ?? ""}`}
      renderItem={(p) => (
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div>
            <p className="font-bold">{p.displayName}</p>
            <p className="text-xs text-muted-foreground">{[p.title, p.organization].filter(Boolean).join(" · ")}</p>
          </div>
          {p.linkedin && (
            <Button asChild variant="outline" size="sm">
              <a href={p.linkedin} target="_blank" rel="noreferrer" className="no-underline" aria-label={`${p.displayName} on LinkedIn`}>
                LinkedIn
              </a>
            </Button>
          )}
        </div>
      )}
    />
  );
}
