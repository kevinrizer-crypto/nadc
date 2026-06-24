"use client";

import { useEffect } from "react";
import { redditTrack } from "./RedditPixel";

/**
 * Fires a Reddit conversion event once on mount. Dropped onto the email-confirm
 * and donation thank-you pages so cold-ad → conversion is measurable in Reddit
 * Ads Manager. No-ops when the pixel isn't configured.
 */
export default function RedditConversion({
  event,
  value,
  conversionId,
}: {
  event: string;
  value?: number;
  conversionId?: string;
}) {
  useEffect(() => {
    // conversionId must match the server-side CAPI event for Reddit to dedup.
    const opts: Record<string, unknown> = {};
    if (value != null) {
      opts.value = value;
      opts.currency = "USD";
    }
    if (conversionId) opts.conversionId = conversionId;
    redditTrack(event, Object.keys(opts).length ? opts : undefined);
  }, [event, value, conversionId]);
  return null;
}
