import React from "react";
import { Button } from "@/components/ui/button";

export default function ActionBar({
  primaryText,
  onPrimary,
  secondaryText,
  onSecondary,
  busy,
}: {
  primaryText: string;
  onPrimary?: (e: React.MouseEvent) => void;
  secondaryText?: string;
  onSecondary?: (e: React.MouseEvent) => void;
  busy?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2">
      {secondaryText && (
        <Button type="button" variant="outline" onClick={onSecondary} disabled={busy}>
          {secondaryText}
        </Button>
      )}
      <Button type="submit" onClick={onPrimary} disabled={busy} aria-busy={busy}>
        {busy ? "Procesando…" : primaryText}
      </Button>
    </div>
  );
}
