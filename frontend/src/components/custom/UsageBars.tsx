import type { HistoryPoint } from '@shared/types/dorm';
import { shortDate } from '@/lib/dorm';
import { cn } from '@/lib/utils';

interface UsageBarsProps {
  points: HistoryPoint[];
  summary: string;
  heightClass?: string;
}

const UsageBars = ({ points, summary, heightClass = 'h-32' }: UsageBarsProps) => {
  const max = Math.max(...points.map((p) => p.usage), 0.01);
  const compact = points.length <= 7;
  const lastIndex = points.length - 1;
  const labelIdx = [0, Math.floor(lastIndex / 2), lastIndex];

  return (
    <div role="img" aria-label={summary}>
      <div className={cn('flex items-end gap-1 px-1', heightClass)}>
        {points.map((p, i) => {
          const pct = p.hasData ? Math.max((p.usage / max) * 100, 4) : 3;
          return (
            <div key={p.date} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${p.date} 用电 ${p.usage.toFixed(2)} 元`}>
              <div
                className={cn(
                  'w-full rounded-t-sm',
                  i === lastIndex ? 'bg-blue-500' : p.hasData ? 'bg-blue-200' : 'bg-slate-100'
                )}
                style={{ height: `${pct}%` }}
              />
            </div>
          );
        })}
      </div>
      {compact ? (
        <div className="mt-2 flex gap-1 px-1">
          {points.map((p, i) => (
            <span
              key={p.date}
              className={cn(
                'min-w-0 flex-1 text-center text-[10px]',
                i === lastIndex ? 'font-bold text-blue-500' : 'text-slate-500'
              )}
            >
              {i === lastIndex ? '今日' : shortDate(p.date)}
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-2 flex justify-between px-1 text-[10px] text-slate-500">
          {labelIdx.map((idx) => (
            <span key={points[idx].date}>{idx === lastIndex ? '今日' : shortDate(points[idx].date)}</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsageBars;
