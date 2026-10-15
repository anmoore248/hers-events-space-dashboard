import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/forms/login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <>
      <h1 className="text-primary mb-6 text-2xl font-bold">Sign in</h1>
      <LoginForm />
      <div className="mt-4 flex flex-wrap justify-between gap-2 text-xs">
        <Link href="/forgot-password" className="text-primary underline">
          Forgot password?
        </Link>
        <Link href="/signup" className="text-primary underline">
          First time? Sign up with an access key
        </Link>
      </div>
      {/* Prototype-only shortcuts. Remove once Better Auth is wired up. */}
      <p className="text-muted-foreground mt-8 text-center text-xs">
        Preview:{" "}
        <Link href="/dashboard" className="text-primary underline">
          attendee side
        </Link>{" "}
        ·{" "}
        <Link href="/admin" className="text-primary underline">
          staff side
        </Link>
      </p>
    </>
  );
}
