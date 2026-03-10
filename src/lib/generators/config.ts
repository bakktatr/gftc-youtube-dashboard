/**
 * 콘텐츠 생성기 설정
 * gftc-script-generator/config.py에서 포팅
 */

export const PRODUCTS = {
  lead_magnet: {
    name: "무료 기초이론 PDF",
    landing_url: "https://link-sell.com/landing",
    description: "투자 초보자를 위한 무료 기초이론 PDF 제공",
  },
  seminar: {
    name: "GFTC 오프라인 세미나",
    landing_url: "https://link-sell.com/landing-v2",
    description: "글로벌트레이더협회 오프라인 투자 세미나",
  },
} as const;

export type ProductKey = keyof typeof PRODUCTS;

export function formatProductsInfo(cta: ProductKey): string {
  const product = PRODUCTS[cta];
  return `상품명: ${product.name}\n랜딩페이지: ${product.landing_url}\n설명: ${product.description}`;
}
