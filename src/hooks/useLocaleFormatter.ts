import { useTranslation } from "react-i18next";

export const useLocaleFormatter = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language || "ru";

  const formatDate = (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat(locale, options || {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(d);
  };

  const formatTime = (date: Date | string | number) => {
    const d = new Date(date);
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit'
    }).format(d);
  };

  const formatNumber = (num: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(locale, options).format(num);
  };

  const formatCurrency = (amount: number, currency: string = 'RUB') => {
    // For Chinese, we might want to show CNY if that's the context, 
    // but the app seems to use RUB prices. natural formatting for currency is key.
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      currencyDisplay: 'symbol'
    }).format(amount);
  };

  return {
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency,
    locale
  };
};
