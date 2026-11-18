// Shared formatter helpers using Intl.NumberFormat('en-IN')

const currencyFmt = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const pointsFmt = new Intl.NumberFormat('en-IN');

const dateFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const shortDateFmt = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
});

export const formatCurrency = (value: number): string =>
  currencyFmt.format(value);

export const formatPoints = (value: number): string =>
  pointsFmt.format(value);

export const formatDate = (dateStr: string): string =>
  dateFmt.format(new Date(dateStr));

export const formatShortDate = (dateStr: string): string =>
  shortDateFmt.format(new Date(dateStr));
