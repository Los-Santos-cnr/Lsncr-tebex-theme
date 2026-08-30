export interface TebexCategory {
  id: number;
  name: string;
  slug: string | null;
  description: string;
  order: number;
  display_type?: string;
  packages?: TebexPackage[];
  parent?: TebexCategory | null;
}

export interface TebexPackageOption {
  name: string;
  description?: string;
  type?: string;
  required?: boolean;
}

export interface TebexPackage {
  id: number;
  name: string;
  description: string;
  image: string | null;
  type: string;
  category: { id: number; name: string };
  base_price: number;
  sales_tax: number;
  total_price: number;
  /** Pre-sale total when a live Plugin sale was applied on top of Headless. */
  original_price?: number | null;
  currency: string;
  discount: number;
  disable_quantity: boolean;
  disable_gifting: boolean;
  expiration_date: string | null;
  created_at: string;
  updated_at: string;
  order: number;
  options?: TebexPackageOption[];
  variables?: unknown[];
  sale?: {
    active: boolean;
    discount: number;
  } | null;
}

export interface TebexBasketPackage {
  id: number;
  name?: string;
  description?: string;
  image?: string | null;
  slug?: string | null;
  type?: string;
  qty?: number;
  in_basket?: {
    quantity?: number;
    price?: number;
    type?: string;
    gift_username?: string | null;
    gift_username_id?: string | null;
  };
  /** Older nested shape still returned by some basket mutations. */
  package?: TebexPackage;
}

export interface TebexBasket {
  ident: string;
  complete: boolean;
  id: number;
  email: string;
  country: string;
  ip: string;
  username_id: string | number | null;
  username: string | null;
  cancel_url: string;
  complete_url: string;
  complete_auto_redirect: boolean;
  base_price: number;
  sales_tax: number;
  total_price: number;
  currency: string;
  packages: TebexBasketPackage[];
  coupons?: { coupon_code: string }[];
  giftcards?: { card_number: string }[];
  creator_code?: string | null;
  links?: {
    checkout?: string;
    payment?: string;
  };
}

export interface TebexAuthProvider {
  name: string;
  url: string;
}

export interface TebexApiResponse<T> {
  data: T;
}
