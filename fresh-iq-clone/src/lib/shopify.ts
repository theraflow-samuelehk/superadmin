export const SHOPIFY_DOMAIN = 'rovidashop.com';

export const VARIANTS = {
  blue: '57024644809079',
  mint: '57024644841847',
  pink: '57024644874615',
  orange: '57024644907383',
} as const;

export type VariantKey = keyof typeof VARIANTS;

export const DEFAULT_VARIANT: VariantKey = 'blue';

export function checkoutUrl(variantId: string, quantity = 1): string {
  return `https://${SHOPIFY_DOMAIN}/cart/${variantId}:${quantity}`;
}

export function buyNow(variantKey: VariantKey = DEFAULT_VARIANT, quantity = 1): void {
  window.location.href = checkoutUrl(VARIANTS[variantKey], quantity);
}
