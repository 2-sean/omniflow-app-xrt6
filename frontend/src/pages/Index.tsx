import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CreditCard, Loader2, Plus, RefreshCw, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { LOW_QUOTA_LIMIT } from '@shared/campus';
import type { HistoryResponse, RoomInfo } from '@shared/types/dorm';
import { Skeleton } from '@/components/ui/skeleton';
import BalanceHero from '@/components/custom/BalanceHero';
import RechargeDialog from '@/components/custom/RechargeDialog';
import RoomGate from '@/components/custom/RoomGate';
import UsageBars from '@/components/custom/UsageBars';
import { useRoom } from '@/contexts/RoomContext';
import { api, ApiError } from '@/lib/api';

const HomeContent = ({ room }: { room: RoomInfo }) => {
  const navigate = useNavigate();
  const { setRoom } = useRoom();
  const [refreshing, setRefreshing] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);
  const [rechargeOpen, setRechargeOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [historyError, setHistoryError] = useState(false);

  const availableAt = room.refreshAvailableAt ? new Date(room.refreshAvailableAt).getTime() : null;
  const cooldown = availableAt ? Math.max(0, Math.ceil((availableAt - now) / 1000)) : 0;

  useEffect(() => {
    if (!availableAt) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= availableAt) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [availableAt]);

  useEffect(() => {
    let cancelled = false;
    api
      .history(room.id, 7)
      .then((data) => {
        if (!cancelled) {
          setHistory(data);
          setHistoryError(false);
        }
      })
      .catch(() => {
        if (!cancelled) setHistoryError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [room.id, room.balanceUpdatedAt]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const info = await api.refresh(room.id);
      setNow(Date.now());
      setRoom(info);
      toast.success('已更新');
    } catch (err) {
      if (err instanceof ApiError && err.status === 429 && err.refreshAvailableAt) {
        setNow(Date.now());
        setRoom({ ...room, refreshAvailableAt: err.refreshAvailableAt });
      }
      toast.error(err instanceof Error ? err.message : '刷新失败，已保留上次数据');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAuthorize = async () => {
    setAuthorizing(true);
    try {
      const info = await api.addQuota(room.id);
      setRoom(info);
      toast.success(`授权成功，当前剩余可提醒 ${info.quota} 次`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '授权失败，请重试');
    } finally {
      setAuthorizing(false);
    }
  };

  const handleInvite = async () => {
    const text = `快来绑定我们宿舍（${room.campus} ${room.building} ${room.roomNo}室）的电费提醒：${window.location.origin}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('邀请文案已复制，发给室友吧');
    } catch {
      toast.error('复制失败，请手动分享小程序给室友');
    }
  };

  const roomFull = room.memberCount >= room.maxMembers;
  const alertCount = room.alertEnabled ? room.memberCount : 0;
  const summary = history
    ? `近 7 天累计用电约 ${history.totalUsage.toFixed(2)} 元`
    : '用电趋势加载中';

  return (
    <>
      <BalanceHero room={room} />

      <section className="grid grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={refreshing || cooldown > 0}
          className="flex min-h-[56px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-4 font-bold text-blue-500 shadow-sm transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
          {cooldown > 0 ? `刷新余额 (${cooldown}s)` : '刷新余额'}
        </button>
        <button
          type="button"
          onClick={() => setRechargeOpen(true)}
          className="flex min-h-[56px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-500 py-4 font-bold text-white shadow-lg shadow-blue-200 transition-transform active:scale-95"
        >
          <CreditCard className="h-5 w-5" />
          去充值
        </button>
      </section>

      {room.quota < LOW_QUOTA_LIMIT && (
        <section className="flex items-start gap-3 rounded-xl border border-orange-100 bg-orange-50 p-4">
          <div className="rounded-full bg-orange-100 p-2 text-orange-600">
            <Bell className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-orange-800">订阅消息授权不足</h3>
            <p className="mt-1 text-xs text-orange-700">
              当前剩余可提醒次数：{room.quota}。为了确保能及时收到断电预警，请补充授权。
            </p>
            <button
              type="button"
              onClick={() => void handleAuthorize()}
              disabled={authorizing}
              className="mt-1 flex min-h-[44px] cursor-pointer items-center text-sm font-bold text-orange-600 underline disabled:opacity-60"
            >
              {authorizing ? '授权中…' : '立即授权'}
            </button>
          </div>
        </section>
      )}

      <section className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-bold">用电趋势 (近7天)</h3>
          <button
            type="button"
            onClick={() => navigate('/stats')}
            className="flex min-h-[44px] cursor-pointer items-center text-xs font-medium text-blue-500"
          >
            查看详情
          </button>
        </div>
        {history ? (
          history.dataDays < 2 ? (
            <p className="py-8 text-center text-sm text-slate-500">数据还在积累，稍后再来看看</p>
          ) : (
            <UsageBars points={history.points} summary={summary} />
          )
        ) : historyError ? (
          <p className="py-8 text-center text-sm text-slate-500">趋势暂时加载不出来，请稍后刷新重试</p>
        ) : (
          <Skeleton className="h-32 w-full" />
        )}
        <p className="mt-3 text-xs text-slate-500">{summary}</p>
      </section>

      <section className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-bold">
            宿舍成员 ({room.memberCount}/{room.maxMembers})
          </h3>
          <button
            type="button"
            onClick={() => void handleInvite()}
            className="flex min-h-[44px] cursor-pointer items-center gap-1 text-xs font-medium text-blue-500"
          >
            <Share2 className="h-3 w-3" /> 邀请室友
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: room.memberCount }, (_, i) => `member-${i}`).map((id, i) => (
            <div key={id} className="flex flex-col items-center gap-1">
              <div
                className={
                  i === 0
                    ? 'flex h-10 w-10 items-center justify-center rounded-full border-2 border-blue-500 bg-blue-50 text-xs font-bold text-blue-500'
                    : 'flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500'
                }
              >
                {i === 0 ? '我' : '室'}
              </div>
              <span className="text-[10px] text-slate-500">
                {i === 0 ? (room.alertEnabled ? '已开启' : '已关闭') : '已绑定'}
              </span>
            </div>
          ))}
          {!roomFull && (
            <button
              type="button"
              aria-label="邀请室友"
              onClick={() => void handleInvite()}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400"
            >
              <Plus className="h-5 w-5" />
            </button>
          )}
        </div>
        <p className={alertCount === 0 ? 'mt-4 text-sm font-medium text-red-500' : 'mt-4 text-xs text-slate-500'}>
          {alertCount === 0 ? '当前宿舍无人接收预警，去“提醒”里开启吧' : `本宿舍已有 ${alertCount} 人开启提醒`}
        </p>
      </section>

      <RechargeDialog open={rechargeOpen} onOpenChange={setRechargeOpen} />
    </>
  );
};

const Index = () => <RoomGate>{(room) => <HomeContent room={room} />}</RoomGate>;

export default Index;
