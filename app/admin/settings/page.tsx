import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle } from "@/components/page-title";
import { SettingsForm } from "@/components/staff/settings-form";
import { settings } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <PageTitle
        title="Settings"
        description="Organization-wide values shown across the platform."
      />
      <Card>
        <CardContent className="pt-5">
          <SettingsForm
            defaultValues={settings}
            lastChanged={settings.lastChanged}
          />
        </CardContent>
      </Card>
    </div>
  );
}
