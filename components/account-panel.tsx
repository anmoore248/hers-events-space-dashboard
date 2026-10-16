import { Card, CardContent } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/forms/change-password-form";
import { settings } from "@/lib/mock-data";

export function AccountPanel({ user_name, email }: { user_name: string, email: string }) {
  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="pt-5 text-sm">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="mt-1 font-bold">{user_name}, {email}</p>
          <p className="mt-1 text-xs text-muted-foreground">To change your login email, email {settings.helpEmail}.</p>
        </CardContent>
      </Card>
      <ChangePasswordForm />
    </div>
  );
}
