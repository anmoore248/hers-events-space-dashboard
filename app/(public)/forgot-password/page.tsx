import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { settings } from "@/lib/mock-data";

export const metadata: Metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  const email = settings.helpEmail;
  return (
    <>
      <h1 className="text-primary mb-6 text-2xl font-bold">
        Forgot your password?
      </h1>
      <Card>
        <CardContent className="grid gap-4 pt-5 text-sm leading-relaxed">
          <p>
            Email <strong>{email}</strong> from the address you sign in with. A
            staff member will reset your password and reply.
          </p>
          <p>
            Then go to{" "}
            <Link href="/signup" className="text-primary underline">
              Sign up
            </Link>
            , enter your email and the access key for any event you&rsquo;re
            enrolled in, and choose a new password. Your events and profile are
            kept.
          </p>
          <Button asChild className="w-full">
            <a href={`mailto:${email}?subject=Password%20reset`}>
              Email {email}
            </a>
          </Button>
        </CardContent>
      </Card>
      <Link
        href="/login"
        className="text-primary mt-6 inline-block text-xs underline"
      >
        Back to login
      </Link>
    </>
  );
}
