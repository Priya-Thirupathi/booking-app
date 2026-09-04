import { Button } from "@/components/ui/button";

/**
 * The two shapes every error state in the app uses (PRD: every list/action needs an error
 * state, not a generic failure). `compact` is for inline form errors with no retry action;
 * the default is for a list that failed to load, with a "Try again" button.
 */
export function ErrorBanner({
  message,
  onRetry,
  compact = false,
}: {
  message: string;
  onRetry?: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        {message}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <p className="text-sm text-destructive">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
