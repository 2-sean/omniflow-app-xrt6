import { useEffect, useState } from 'react';
import type { HistoryResponse, RoomInfo } from '@shared/types/dorm';
import { Skeleton } from '@/components/ui/skeleton';
import RoomGate from '@/components/custom/RoomGate';
import UsageBars from '@/components/custom/UsageBars';
import { api } from '@/lib/api';
import { formatMoney } from '@/lib/dorm';
import { cn } from '@/lib/utils';

const RANGES = [7, 30, 90] as const;
type Range = (typeof RANGES)[number];

interface Result {
  days: Range;
  data: HistoryResponse | null;
}

const StatsContent = ({ room }: { room: RoomInfo }) => {
  const [days, setDays] = useState<Range>(7);
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .history(room.id, days)
      .then((data) => {
        if (!cancelled) setResult({ days, data });
      })
      .catch(() => {
        if (!cancelled) setResult({ days, data: null });
      });
    return () => {
      cancelled = true;
    };
  }, [room.id, days]);

  const current = result && result.days === days ? result : null;
  const loading = current === null;
  const data = current ? current.data : null;
  const summary = data
    ? `近 ${days} 天累计用电约 ${formatMoney(data.totalUsage)} 元，日均${data.avgDaily === null ? '数据不足' : `约 ${formatMoney(data.avgDaily)} 元`}`
    : '';

  return (
    <>
      <section className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">用电统计</h2>
          <div className="flex rounded-full bg-slate-100 p-1" role="tablist" aria-label="统计范围">
            {RANGES.map((r) => (
              <button
                key={r}
                type="button"
                role="tab"
                aria-selected={days === r}
                onClick={() => setDays(r)}
                className={cn(
                  'min-h-[40px] cursor-pointer rounded-full px-3 text-sm font-medium',
                  days === r ? 'bg-white text-blue-500 shadow-sm' : 'text-slate-500'
                )}
              >
                近{r}天
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : !data ? (
          <p className="py-10 text-center text-sm text-slate-500">统计数据暂时加载不出来，请稍后重试</p>
        ) : data.dataDays < 2 ? (
          <p className="py-10 text-center text-sm text-slate-500">数据还在积累中，过几天再来看看吧</p>
        ) : (
          <>
            <UsageBars points={data.points} summary={summary} heightClass="h-48" />
            <p className="mt-4 text-sm text-slate-600">{summary}</p>
          </>
        )}
      </section>

      {data && data.dataDays >= 2 && (
        <section className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">累计用电 (元)</p>
            <p className="mt-1 text-2xl font-bold">{formatMoney(data.totalUsage)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs text-slate-500">日均用电 (元)</p>
            <p className="mt-1 text-2xl font-bold">{data.avgDaily === null ? '--' : formatMoney(data.avgDaily)}</p>
          </div>
        </section>
      )}
      <p className="text-xs text-slate-500">日用电由相邻余额快照差值推算，已剔除充值带来的余额上升。以学校官方数据为准。</p>
    </>
  );
};

const Stats = () => <RoomGate>{(room) => <StatsContent room={room} />}</RoomGate>;

export default Stats;
