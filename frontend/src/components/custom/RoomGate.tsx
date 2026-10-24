import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, DoorOpen } from 'lucide-react';
import type { RoomInfo } from '@shared/types/dorm';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import BindRoomForm from '@/components/custom/BindRoomForm';
import { useRoom } from '@/contexts/RoomContext';

interface RoomGateProps {
  children: (room: RoomInfo) => ReactNode;
}

const RoomGate = ({ children }: RoomGateProps) => {
  const { room, state, error, reload } = useRoom();
  const navigate = useNavigate();

  if (state === 'loading') {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-72 w-full rounded-[1.25rem]" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-[1.25rem]" />
      </div>
    );
  }

  if (state === 'unbound') {
    return (
      <section className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500">
            <DoorOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">绑定你的宿舍</h2>
            <p className="text-sm text-slate-500">选择校区、楼栋和房间号，电费低了我们提醒你</p>
          </div>
        </div>
        <BindRoomForm
          submitLabel="绑定宿舍"
          onBound={() => navigate('/alerts', { state: { welcome: true } })}
        />
        <p className="mt-4 text-xs text-slate-500">同一房间最多 8 人绑定，每人同时只能绑定 1 间宿舍。本应用不涉及任何支付。</p>
      </section>
    );
  }

  if (state === 'error' || !room) {
    return (
      <section className="rounded-[1.25rem] border border-red-200 bg-white p-6 text-center shadow-sm">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-500" />
        <h2 className="text-lg font-bold">暂时没能加载数据</h2>
        <p className="mt-1 text-sm text-slate-500">{error ?? '请检查网络后重试'}</p>
        <Button onClick={() => void reload()} className="mt-4 h-11 bg-blue-500 text-white hover:bg-blue-600">
          重新加载
        </Button>
      </section>
    );
  }

  return <>{children(room)}</>;
};

export default RoomGate;
