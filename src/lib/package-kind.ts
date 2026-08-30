export function isGiftcardName(name?: string | null) {
  return /gift\s*card|giftcard/i.test(String(name ?? ""));
}
