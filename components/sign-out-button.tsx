import { signOut } from "@/lib/actions/auth";

/** "Log out" in the header. A form, so it works before JavaScript loads. */
export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="whitespace-nowrap border-b-2 border-transparent px-3 py-2 text-[13px] font-semibold text-foreground hover:text-primary"
      >
        Log out
      </button>
    </form>
  );
}
