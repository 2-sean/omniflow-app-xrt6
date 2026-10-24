import type { BalanceStatus } from '@shared/types/dorm';
import { STALE_AFTER_MINUTES } from '@shared/campus';

export const RECHARGE_URL = 'https://pay.example-university.edu.cn/electricity';

interface StatusMeta {
  label: string;
  hint: string;
  badgeClass: string;
}

export const STATUS_META: Record<BalanceStatus, StatusMeta> = {
  sufficient: { label: '电费充足', hint: '电费充足，放心用电', badgeClass: 'bg-emerald-500' },
  low: { label: '余额偏低', hint: '电费偏低，建议今晚充值', badgeClass: 'bg-orange-500' },
  critical: { label: '即将断电', hint: '快要用完啦，请尽快充值', badgeClass: 'bg-red-500' },
  arrears: { label: '已欠费', hint: '电费已用完，请立即充值', badgeClass: 'bg-red-600' },
};

const pad = (n: number): string => String(n).padStart(2, '0');

export function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diffDays === 0) return `今天 ${time}`;
  if (diffDays === 1) return `昨天 ${time}`;
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${time}`;
}

export function isStale(iso: string): boolean {
  return Date.now() - new Date(iso).getTime() > STALE_AFTER_MINUTES * 60000;
}

export const formatMoney = (n: number): string => n.toFixed(2);

export const shortDate = (date: string): string => date.slice(5).replace('-', '.');
