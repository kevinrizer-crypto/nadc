"use client";

import { useEffect } from "react";
import { redditTrack } from "./RedditPixel";

/**
 * Fires a Reddit conversion event once on mount. Dropped onto the email-confirm
 * and donation thank-you pages so cold-ad → conversion is measurable in Reddit
 * Ads Manager. No-ops when the pixel isn't configured.
 */
export default function RedditConversion({ event, value }: { event: string; value?: number }) {
  useEffect(() => {
    redditTrack(event, value != null ? { value, currency: "USD" } : undefined);
  }, [event, value]);
  return null;
}
