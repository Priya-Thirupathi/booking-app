"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

// Renders nothing when no site key is configured (see lib/turnstile.ts — the server skips
// verification in that case too), so booking works end to end before the Cloudflare account
// exists. Once NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, this renders the real widget.
export function TurnstileWidget({ onToken }: { onToken: (token: string | null) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!siteKey) return;
    const w = window as unknown as {
      turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => void };
    };
    if (!w.turnstile || !containerRef.current) return;
    w.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: (token: string) => onToken(token),
      "expired-callback": () => onToken(null),
    });
    // Intentionally re-runs only when the site key appears/changes, not on every onToken
    // identity change — re-rendering the widget on every render would reset it mid-interaction.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) return null;

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
      <div ref={containerRef} />
    </>
  );
}
