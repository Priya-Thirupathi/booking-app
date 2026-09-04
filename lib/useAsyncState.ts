"use client";

import { useEffect, useState } from "react";

/**
 * Fetch-on-mount-and-on-deps-change, plus a manual refresh — the pattern both the slot list and
 * My Bookings use. `loader` must be pure (no setState inside it): state only ever changes here,
 * inside a `.then()` callback, never synchronously in the effect body, which is what satisfies
 * react-hooks/set-state-in-effect. The mount effect also guards against a slow response for a
 * since-changed dependency overwriting a newer one.
 */
export function useAsyncState<T>(loader: () => Promise<T>, loadingState: T, deps: unknown[]) {
  const [state, setState] = useState<T>(loadingState);

  useEffect(() => {
    let cancelled = false;
    loader().then((result) => {
      if (!cancelled) setState(result);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `deps` is the caller's own dep list
  }, deps);

  function refresh() {
    setState(loadingState);
    loader().then(setState);
  }

  return { state, setState, refresh };
}
