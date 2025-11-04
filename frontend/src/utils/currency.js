// Currency utility functions

export const currencySymbols = {
  PKR: 'Rs',
  GBP: '£',
  USD: '$'
};

export const formatCurrency = (amount, currency = 'PKR') => {
  const symbol = currencySymbols[currency] || currency;
  const formatted = parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  return `${symbol} ${formatted}`;
};

export const getCurrencySymbol = (currency) => {
  return currencySymbols[currency] || currency;
};
