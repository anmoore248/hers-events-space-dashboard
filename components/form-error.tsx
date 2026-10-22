/** An action's error message, announced to screen readers. */
export function FormError({ message, className }: { message?: string | null; className?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className={className ?? "rounded-md border border-destructive bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"}>
      {message}
    </p>
  );
}
