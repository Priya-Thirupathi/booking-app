/**
 * Cloudflare Turnstile verification, stubbed until the Cloudflare account/site key exist.
 *
 * With no login on this app, a captcha challenge is one of four cheap abuse barriers (PRD:
 * "Abuse"). Without TURNSTILE_SECRET_KEY set, verification is skipped rather than the booking
 * flow being blocked on an account that doesn't exist yet — wiring in the real key later is a
 * one-line env change, nothing in the route handler changes.
 */
export async function verifyTurnstile(token: string | null, ip: string | null): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) {
    return true; // not configured yet — skip rather than block
  }
  if (!token) {
    return false;
  }

  const body = new URLSearchParams({ secret: secretKey, response: token });
  if (ip) body.set("remoteip", ip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}
