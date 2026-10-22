import { Card, CardContent } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/forms/change-password-form";

export function AccountPanel({ email, helpEmail }: { email?: string; helpEmail: string }) {
  return (
    <div className="grid gap-4">
      {email && (
        <Card>
          <CardContent className="pt-5 text-sm">
            <p className="text-xs text-muted-foreground">Signed in as</p>
            <p className="mt-1 font-bold">{email}</p>
            <p className="mt-1 text-xs text-muted-foreground">To change your login email, email {helpEmail}.</p>
          </CardContent>
        </Card>
      )}
      <ChangePasswordForm />
    </div>
  );
}
