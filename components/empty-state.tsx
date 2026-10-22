import { cn } from "@/lib/utils";

/** The message shown wherever a list or page has nothing to show yet. */
export function EmptyState({ title, children, className }: { title: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-dashed bg-card px-6 py-8 text-center", className)}>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">{children}</p>}
    </div>
  );
}
