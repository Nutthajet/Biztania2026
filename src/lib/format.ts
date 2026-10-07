export const money = (value: number, compact = true) =>
  compact && Math.abs(value) >= 1000
    ? `฿${(value / 1000).toFixed(value >= 100000 ? 0 : 1).replace(/\.0$/, '')}K`
    : `฿${Math.round(value).toLocaleString('en-US')}`;
export const percent = (value: number) => `${Math.round(value * 100)}%`;
export const firstName = (name: string) => name.split(' ')[0];
export const initials = (name: string) =>
  name
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0])
    .join('');
