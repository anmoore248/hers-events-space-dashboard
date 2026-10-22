import type { Metadata } from "next";
import Link from "next/link";
import { SignUpFlow } from "@/components/forms/sign-up-flow";

export const metadata: Metadata = { title: "Sign up" };

export default function SignUpPage() {
  return (
    <>
      <h1 className="mb-2 text-2xl font-bold text-primary">Sign up</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Use the email address your HERS invitation was sent to and the access key from that email.
      </p>
      <SignUpFlow />
      <Link href="/login" className="mt-6 inline-block text-xs text-primary underline">
        Back to login
      </Link>
    </>
  );
}
