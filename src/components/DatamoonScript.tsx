"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

/**
 * Datamoon analytics tag.
 *
 * Loads app.datamoon.com/script with the NADC request/client id and exposes the
 * global `script()` command queue the vendor snippet defines.
 *
 * Only the production host fires it — keeps dev/preview traffic out of the
 * Datamoon data (same policy as the Reddit pixel).
 */
const REQUEST_ID = process.env.NEXT_PUBLIC_DATAMOON_ID || "nadc";

const PROD_HOST = "nadc.info";

export default function DatamoonScript() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (window.location.hostname === PROD_HOST) setActive(true);
  }, []);

  if (!REQUEST_ID || !active) return null;

  return (
    <Script id="datamoon" strategy="afterInteractive">
      {`(function(s, p, i, c, e) {
    s[e] = s[e] || function() { (s[e].a = s[e].a || []).push(arguments); };
    s[e].l = 1 * new Date();
    var t = new Date().getTime();
    var k = c.createElement("script"), a = c.getElementsByTagName("script")[0];
    k.async = 1, k.src = p + "?request_id=" + i + "&t=" + t, a.parentNode.insertBefore(k, a);
    s.pixelClientId = i;
})(window, "https://app.datamoon.com/script", "${REQUEST_ID}", document, "script");`}
    </Script>
  );
}
