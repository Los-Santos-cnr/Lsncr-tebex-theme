"use client";

import Tebex from "@tebexio/tebex.js";

declare global {
  interface Window {
    Tebex?: typeof Tebex;
  }
}

export function TebexScript() {
  return null;
}

function hostedCheckoutUrl(ident: string, checkoutUrl?: string | null) {
  if (checkoutUrl && /^https?:\/\//i.test(checkoutUrl)) return checkoutUrl;
  return `https://pay.tebex.io/${ident}`;
}

export async function launchTebexCheckout(
  ident: string,
  options?: { onPaid?: () => void; checkoutUrl?: string | null }
) {
  const fallback = hostedCheckoutUrl(ident, options?.checkoutUrl);

  try {
    Tebex.checkout.init({
      ident,
      theme: "dark",
      launchTimeout: 4000,
    });
    if (options?.onPaid) {
      Tebex.checkout.on("payment:complete", options.onPaid);
    }
    await Tebex.checkout.launch();
  } catch {
    window.location.assign(fallback);
  }
}
