"use client";

import Script from "next/script";

export function TebexScript() {
  return (
    <Script
      src="https://js.tebex.io/v/1/tebex.js"
      strategy="lazyOnload"
    />
  );
}

declare global {
  interface Window {
    Tebex?: {
      checkout: {
        init: (config: { ident: string; theme?: string }) => void;
        launch: () => void;
      };
    };
  }
}

export function launchTebexCheckout(ident: string) {
  if (!window.Tebex?.checkout) {
    throw new Error("Tebex.js is not loaded yet");
  }
  window.Tebex.checkout.init({ ident, theme: "dark" });
  window.Tebex.checkout.launch();
}
