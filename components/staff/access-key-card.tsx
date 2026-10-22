"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmButton } from "@/components/confirm-button";
import { CopyButton } from "@/components/copy-button";
import { regenerateAccessKey } from "@/lib/actions/events";

export function AccessKeyCard({ eventId, initialKey }: { eventId: string; initialKey: string }) {
  const [key, setKey] = React.useState(initialKey);
  React.useEffect(() => setKey(initialKey), [initialKey]);

  return (
    <Card className="border-2 border-destructive">
      <CardHeader>
        <CardTitle>Access key</CardTitle>
        <p className="text-xs text-muted-foreground">Paste into the Salesforce invitation. Only works for emails on this event&rsquo;s guest list.</p>
      </CardHeader>
      <CardContent className="grid gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <code aria-live="polite" className="rounded-md border border-hers-blue-light bg-hers-panel px-3 py-1.5 font-mono text-lg font-bold tracking-wider text-primary">
            {key}
          </code>
          <CopyButton value={key} />
        </div>
        <div>
          <ConfirmButton
            label="Regenerate key"
            title="Regenerate the access key?"
            confirmLabel="Regenerate key"
            destructive
            variant="destructive"
            description={<p>The old key stops working immediately. Attendees who haven&rsquo;t signed up yet will need the new key.</p>}
            onConfirm={async () => {
              const res = await regenerateAccessKey(eventId);
              if (res.ok) setKey(res.data.accessKey);
              return res;
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground">Regenerating stops the old key working immediately.</p>
      </CardContent>
    </Card>
  );
}
