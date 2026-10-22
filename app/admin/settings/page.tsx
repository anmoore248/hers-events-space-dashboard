import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle } from "@/components/page-title";
import { SettingsForm } from "@/components/staff/settings-form";
import { getSettings, requireStaffPage } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireStaffPage();
  const s = await getSettings();
  const lastChanged = s.updatedByName && s.updatedAt ? `${s.updatedByName} · ${formatDate(s.updatedAt)}` : undefined;
  return (
    <div className="max-w-2xl">
      <PageTitle title="Settings" description="Organization-wide values shown across the platform." />
      <Card>
        <CardContent className="pt-5">
          <SettingsForm
            defaultValues={{ messageStaffGroupMe: s.messageStaffGroupMe, helpEmail: s.helpEmail, groupMeCleanupDays: s.groupMeCleanupDays }}
            lastChanged={lastChanged}
          />
        </CardContent>
      </Card>
    </div>
  );
}
