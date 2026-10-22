import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage() {
  const { helpEmail } = await getSettings();
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-primary">Forgot your password?</h1>
      <Card>
        <CardContent className="grid gap-4 pt-5 text-sm leading-relaxed">
          <p>
            Email <strong>{helpEmail}</strong> from the address you sign in with. A staff member will reset your password and reply.
          </p>
          <p>
            Then go to <Link href="/signup" className="text-primary underline">Sign up</Link>, enter your email and the access key for any event you&rsquo;re enrolled in, and choose a new password. Your events and profile are kept.
          </p>
          <Button asChild className="w-full">
            <a href={`mailto:${helpEmail}?subject=Password%20reset`}>Email {helpEmail}</a>
          </Button>
        </CardContent>
      </Card>
      <Link href="/login" className="mt-6 inline-block text-xs text-primary underline">
        Back to login
      </Link>
    </>
  );
}
