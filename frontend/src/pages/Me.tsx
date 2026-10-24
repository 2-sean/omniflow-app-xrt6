import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { RoomInfo } from '@shared/types/dorm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BindRoomForm from '@/components/custom/BindRoomForm';
import RoomGate from '@/components/custom/RoomGate';
import { useRoom } from '@/contexts/RoomContext';
import { api } from '@/lib/api';
import { formatMoney, formatUpdatedAt } from '@/lib/dorm';

const MeContent = ({ room }: { room: RoomInfo }) => {
  const navigate = useNavigate();
  const { setRoom, clearBinding } = useRoom();
  const [changeOpen, setChangeOpen] = useState(false);
  const [unbindOpen, setUnbindOpen] = useState(false);
  const [unbinding, setUnbinding] = useState(false);
  const [manual, setManual] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleManual = async (e: FormEvent) => {
    e.preventDefault();
    const value = Number(manual);
    if (manual.trim() === '' || !Number.isFinite(value) || value < 0) {
      toast.error('请输入有效的余额（不能为负数）');
      return;
    }
    setSubmitting(true);
    try {
      const info = await api.manualBalance(room.id, value);
      setRoom(info);
      setManual('');
      toast.success('已按手动余额更新');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '录入失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnbind = async () => {
    setUnbinding(true);
    try {
      await api.unbind(room.id);
      clearBinding();
      setUnbindOpen(false);
      toast.success('已解绑，不再收到该宿舍的提醒');
      navigate('/');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '解绑失败，请重试');
    } finally {
      setUnbinding(false);
    }
  };

  return (
    <>
      <section className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-sm font-medium text-slate-500">当前绑定宿舍</h2>
        <p className="text-xl font-bold">
          {room.campus} · {room.building} · {room.roomNo}室
        </p>
        <p className="mt-1 text-sm text-slate-500">
          宿舍成员 {room.memberCount}/{room.maxMembers} · 预警阈值 {room.threshold} 元
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-11" onClick={() => setChangeOpen(true)}>
            更换宿舍
          </Button>
          <Button
            variant="outline"
            className="h-11 border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => setUnbindOpen(true)}
          >
            解除绑定
          </Button>
        </div>
      </section>

      <section className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-bold">手动录入余额</h3>
        <p className="mt-1 text-xs text-slate-500">
          学校接口异常时，可录入你在学校官方渠道看到的余额，预警将据此判定。
        </p>
        <p className="mt-2 text-sm text-slate-600">
          当前余额 {formatMoney(room.balance)} 元 · {room.balanceSource === 'manual' ? '手动录入' : '接口获取'} ·{' '}
          {formatUpdatedAt(room.balanceUpdatedAt)}
        </p>
        <form onSubmit={(e) => void handleManual(e)} className="mt-4 flex items-end gap-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Label htmlFor="manual-balance">余额 (元)</Label>
            <Input
              id="manual-balance"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              className="h-12"
              placeholder="例如 18.50"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={submitting} className="h-12 bg-blue-500 px-5 font-bold text-white hover:bg-blue-600">
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            提交
          </Button>
        </form>
      </section>

      <p className="text-xs text-slate-500">
        本应用不提供充值与支付，不获取任何校园账号密码，仅保存校区、楼栋、房间号。
      </p>

      <Dialog open={changeOpen} onOpenChange={setChangeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>更换宿舍</DialogTitle>
            <DialogDescription>绑定成功后会自动解绑旧宿舍；失败则保持原绑定不变。</DialogDescription>
          </DialogHeader>
          <BindRoomForm
            previousRoomId={room.id}
            submitLabel="确认更换"
            onBound={() => {
              setChangeOpen(false);
              navigate('/');
            }}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={unbindOpen} onOpenChange={setUnbindOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认解除绑定？</AlertDialogTitle>
            <AlertDialogDescription>
              解绑后将立即停止收到「{room.building}{room.roomNo}室」的电费提醒。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>再想想</AlertDialogCancel>
            <AlertDialogAction
              disabled={unbinding}
              onClick={(e) => {
                e.preventDefault();
                void handleUnbind();
              }}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {unbinding ? '解绑中…' : '确认解绑'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const Me = () => <RoomGate>{(room) => <MeContent room={room} />}</RoomGate>;

export default Me;
