"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/useCartStore";

export function ClearPaidCart() {
  useEffect(() => {
    useCartStore.getState().clearPaidCart();
  }, []);
  return null;
}
