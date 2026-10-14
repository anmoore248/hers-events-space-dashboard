import { Lock } from "lucide-react";

export function ReadOnlyNotice() {
  return (
    <div className="mb-5 flex items-center gap-2 rounded-md border border-hers-blue-light bg-hers-panel px-4 py-2.5 text-xs text-primary">
      <Lock className="size-3.5" aria-hidden />
      This event has ended. You can still view everything, but changes are closed.
    </div>
  );
}
