/**
 * Акция для организаций: 50% скидка при оформлении подписки до конца года.
 * Скидка применяется автоматически, пока текущая дата не превысила дедлайн.
 */

export const ORG_PROMO_DISCOUNT = 0.5;

/** 31 декабря 2026, 23:59:59 по Москве (UTC+3) */
export const ORG_PROMO_DEADLINE = new Date("2026-12-31T23:59:59+03:00");

export const ORG_BASE_PRICES = {
  monthly: 2500,
  yearly: 25500,
} as const;

export type OrgPlan = keyof typeof ORG_BASE_PRICES;

export const isOrgPromoActive = (now: Date = new Date()): boolean =>
  now.getTime() <= ORG_PROMO_DEADLINE.getTime();

/** Итоговая цена с учётом действующей акции */
export const getOrgPrice = (plan: OrgPlan, now: Date = new Date()): number => {
  const base = ORG_BASE_PRICES[plan];
  return isOrgPromoActive(now) ? Math.round(base * (1 - ORG_PROMO_DISCOUNT)) : base;
};

export const formatPromoDeadline = (): string =>
  ORG_PROMO_DEADLINE.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Moscow",
  });
