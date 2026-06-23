"use client";

import Script from "next/script";
import { useEffect } from "react";
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

const PIXEL_ID = process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID;

export function redditTrack(event: string, opts?: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.rdt === "function") {
    window.rdt("track", event, opts);
  }
}

export default function RedditPixel() {
  // Always capture attribution (cheap, no third-party code).
  useEffect(() => {
    captureAttribution();
  }, []);

  if (!PIXEL_ID) return null;

  return (
    <Script id="reddit-pixel" strategy="afterInteractive">
      {`!function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js";t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);rdt('init','${PIXEL_ID}');rdt('track','PageVisit');`}
    </Script>
  );
}
