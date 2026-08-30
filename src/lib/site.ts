export const SITE_NAME = "Los Santos Cops and Robbers";
export const SITE_BRAND = "LSCNR";
export const SITE_METADATA_TITLE = "Los Santos Cops and Robbers | Welcome";
export const SITE_METADATA_DESCRIPTION =
  "Support Los Santos Cops and Robbers. VIP memberships with queue priority, exclusive vehicles, VIP Ammunation, and more.";

export const HOME_EYEBROW = "Premium FiveM Store";
export const HOME_HEADLINE = "Cops & Robbers";
export const HOME_SUBTITLE =
  "A PvP cops versus robbers server. VIP memberships add queue priority, exclusive vehicles, and in-game perks.";
export const HERO_BADGE_TEXT = "Cops vs Robbers · FiveM";

export const MAIN_SITE_URL = "https://lscnr.net";
export const FIVEM_CONNECT_URL = "https://cfx.re/join/lscnr";
export const DISCORD_INVITE = "https://discord.gg/lscnr";
export const TEBEX_PAYMENT_HISTORY_URL = "https://checkout.tebex.io/payment-history/";

/** Marketing banner shown across the top of the store. */
export const PROMO_BANNER_TEXT = "Subscription discounts!";

/** Trust stats shown under the hero. */
export const TRUST_STATS: { label: string }[] = [
  { label: "Queue Priority & Membership Perks" },
  { label: "Trusted by the LSCNR Community" },
];

/** "What you get" offering cards: the things players actually buy. */
export const OFFERINGS: {
  icon: "membership" | "queue" | "name" | "gift";
  title: string;
  description: string;
  wip?: boolean;
}[] = [
  {
    icon: "membership",
    title: "Memberships",
    description:
      "Silver, Gold, and Platinum tiers with queue priority, exclusive dealership vehicles, VIP Ammunation discounts, and extra properties.",
  },
  {
    icon: "queue",
    title: "Queue Priority Tokens",
    description: "Skip the line during peak hours when the server is packed.",
    wip: true,
  },
  {
    icon: "name",
    title: "Name Change Tokens",
    description: "Change your in-game identity with a dedicated name change token.",
    wip: true,
  },
  {
    icon: "gift",
    title: "Gift Cards",
    description: "Check your balance and gift perks to friends in the community.",
  },
];

/** Per-package trust badges shown on each card. */
export const PACKAGE_TRUST: {
  icon: "delivery" | "secure" | "support";
  title: string;
  subtitle: string;
}[] = [
  { icon: "delivery", title: "Instant Delivery", subtitle: "Automated delivery via Tebex" },
  { icon: "secure", title: "Secure Transactions", subtitle: "Protected by Tebex Checkout" },
  { icon: "support", title: "Dedicated Support", subtitle: "Join our Discord community" },
];

export const REFUND_POLICY =
  "No refunds. Digital packages are sold through Tebex, and we follow Tebex's refund policy. All purchases are final. If you want a refund, contact Tebex support.";

/** Help-center FAQ shown on the homepage accordion. */
export const HOME_FAQ: { question: string; answer: string }[] = [
  {
    question: "Package upgrading/downgrading",
    answer:
      "Please be aware that upgrading your package does not add to your current subscription time. If you upgrade from, for example, Silver to Bronze, your package will be changed to Bronze immediately, with the time being updated with the time now + 30 days. This limitation is due to our provider, Tebex, and cannot be altered at this time. Please consider this when upgrading your package.",
  },
  {
    question: "Clothing, billboards, car liveries, and other in-game customizations",
    answer:
      "Please join our Discord server and create a payment support ticket in our create a ticket section. We will help you further with your order as we cannot list prices for these customizations before making the customization.",
  },
  {
    question: "How do I claim my perks after purchase?",
    answer:
      "Link your FiveM account at checkout. Most perks are assigned automatically by the Tebex bot once your purchase completes and your account is linked.",
  },
  {
    question: "How long does it take for my role/tokens to apply?",
    answer:
      "The Tebex bot works as fast as it can, but Discord rate limits can cause delays. If it has been over an hour, open a payment support ticket on Discord.",
  },
  {
    question: "Why do I need to login with FiveM?",
    answer:
      "Logging in with FiveM links your purchase to the right account so we can deliver VIP perks in-game.",
  },
  {
    question: "Can I use a coupon or promo code?",
    answer: "Yes. Apply your code on the cart page before you check out.",
  },
  {
    question: "What is the refund policy?",
    answer: REFUND_POLICY,
  },
];

export const FOOTER_COPYRIGHT =
  "Copyright © Los Santos Cops and Robbers 2023. All Rights Reserved. We are not affiliated with Rockstar Games.";

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

export function getPromoCode() {
  return process.env.NEXT_PUBLIC_PROMO_CODE?.trim() || null;
}

export function getPromoBannerText() {
  return process.env.NEXT_PUBLIC_PROMO_BANNER?.trim() || PROMO_BANNER_TEXT;
}

export function getHeroImage() {
  return process.env.NEXT_PUBLIC_HERO_IMAGE?.trim() || null;
}

export function getDiscordInvite() {
  return process.env.NEXT_PUBLIC_DISCORD_INVITE?.trim() || DISCORD_INVITE;
}

export function getSaleEndsAt() {
  const raw = process.env.NEXT_PUBLIC_SALE_ENDS_AT?.trim();
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function getFiveMConnectUrl() {
  return process.env.NEXT_PUBLIC_FIVEM_CONNECT_URL?.trim() || FIVEM_CONNECT_URL;
}

export function getMainSiteUrl() {
  return process.env.NEXT_PUBLIC_MAIN_SITE_URL?.trim() || MAIN_SITE_URL;
}
