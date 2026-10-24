import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { RoomInfo } from '@shared/types/dorm';
import { STATUS_META, formatMoney, formatUpdatedAt, isStale } from '@/lib/dorm';

const BalanceHero = ({ room }: { room: RoomInfo }) => {
  const meta = STATUS_META[room.status];
  const stale = isStale(room.balanceUpdatedAt);
  const StatusIcon = room.status === 'sufficient' ? CheckCircle2 : AlertTriangle;

  return (
    <section className="relative overflow-hidden rounded-[1.25rem] bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-xl">
      <div className="relative z-10">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-medium opacity-80">当前绑定宿舍</h2>
            <p className="text-lg font-bold sm:text-xl">
              {room.campus} · {room.building} · {room.roomNo}室
            </p>
          </div>
          <span className="shrink-0 rounded-md bg-white/20 px-2 py-1 text-xs backdrop-blur-sm">
            {room.alertEnabled ? '已开启预警' : '预警已关闭'}
          </span>
        </div>

        <div className="mt-6 flex flex-col items-center">
          <span className="mb-1 text-sm opacity-80">剩余电费 (元)</span>
          <div className="flex items-baseline gap-1">
            <span className="text-5xl font-bold tracking-tighter">{formatMoney(room.balance)}</span>
            <span className="text-xl opacity-80">¥</span>
          </div>
          <div className={`mt-4 flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold ${meta.badgeClass}`}>
            <StatusIcon className="h-4 w-4" />
            {meta.label} · {meta.hint}
          </div>
          {stale && (
            <p className="mt-3 rounded-md bg-white/20 px-3 py-1 text-xs">数据可能延迟，可点“刷新余额”获取最新数据</p>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
          <div className="text-center">
            <p className="text-xs opacity-70">更新时间{room.balanceSource === 'manual' ? '（手动录入）' : ''}</p>
            <p className="text-sm font-medium">{formatUpdatedAt(room.balanceUpdatedAt)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs opacity-70">预计可用</p>
            <p className="text-sm font-medium">
              {room.estimatedDays === null ? '数据积累中' : `约 ${room.estimatedDays} 天`}
            </p>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
    </section>
  );
};

export default BalanceHero;
