"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { captureAttribution } from "@/lib/attribution";

/**
 * Reddit conversion pixel + first-touch attribution capture.
 *
 * Inert unless NEXT_PUBLIC_REDDIT_PIXEL_ID is set (the Advertiser/Pixel ID from
 * Reddit Ads Manager → Events Manager). With no ID, this only captures UTM
 * params locally — no third-party script loads, no tracking.
 *
 * Events fired elsewhere via the helpers below:
 *   - redditTrack("SignUp")            on confirmed email opt-in
 *   - redditTrack("Purchase", {value}) on completed donation
 */
declare global {
  interface Window {
    rdt?: (...args: unknown[]) => void;
  }
}

// Pixel ID is public by design (sent to every browser). Hardcoded so it ships
// without an env-var round-trip; override via env if it ever changes.
const PIXEL_ID = process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID || "a2_j84cq3mymigf";

// Only the production host fires the pixel — keeps dev/preview traffic out of
// Reddit's conversion data.
const PROD_HOST = "nadc.info";

export function redditTrack(event: string, opts?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.rdt === "function") {
    window.rdt("track", event, opts);
  }
}

export default function RedditPixel() {
  const [active, setActive] = useState(false);

  // Always capture attribution (cheap, first-party, no third-party code).
  // Activate the Reddit pixel only on the production host.
  useEffect(() => {
    captureAttribution();
    if (window.location.hostname === PROD_HOST) setActive(true);
  }, []);

  if (!PIXEL_ID || !active) return null;

  return (
    <Script id="reddit-pixel" strategy="afterInteractive">
      {`!function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js";t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);rdt('init','${PIXEL_ID}');rdt('track','PageVisit');`}
    </Script>
  );
}
