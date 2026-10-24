import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CAMPUS_DICT } from '@shared/campus';
import type { RoomInfo } from '@shared/types/dorm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { useRoom } from '@/contexts/RoomContext';

interface BindRoomFormProps {
  previousRoomId?: string;
  submitLabel: string;
  onBound: (room: RoomInfo) => void;
}

const BindRoomForm = ({ previousRoomId, submitLabel, onBound }: BindRoomFormProps) => {
  const { bindTo } = useRoom();
  const [campus, setCampus] = useState('');
  const [building, setBuilding] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildings = campus ? CAMPUS_DICT[campus] : [];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!campus || !building || !roomNo.trim()) {
      setError('请先选择校区、楼栋并填写房间号');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const info = await api.bind({ campus, building, roomNo: roomNo.trim() });
      if (previousRoomId && previousRoomId !== info.id) {
        await api.unbind(previousRoomId).catch(() => undefined);
      }
      bindTo(info);
      toast.success('绑定成功');
      onBound(info);
    } catch (err) {
      setError(err instanceof Error ? err.message : '绑定失败，请重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="campus">校区</Label>
        <Select
          value={campus}
          onValueChange={(v) => {
            setCampus(v);
            setBuilding('');
          }}
        >
          <SelectTrigger id="campus" className="h-12 w-full">
            <SelectValue placeholder="选择校区" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(CAMPUS_DICT).map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="building">楼栋</Label>
        <Select value={building} onValueChange={setBuilding} disabled={!campus}>
          <SelectTrigger id="building" className="h-12 w-full">
            <SelectValue placeholder={campus ? '选择楼栋' : '请先选择校区'} />
          </SelectTrigger>
          <SelectContent>
            {buildings.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="roomNo">房间号</Label>
        <Input
          id="roomNo"
          inputMode="numeric"
          maxLength={4}
          placeholder="例如 502"
          className="h-12"
          value={roomNo}
          onChange={(e) => setRoomNo(e.target.value.replace(/\D/g, ''))}
        />
      </div>
      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      <Button type="submit" disabled={submitting} className="h-12 w-full bg-blue-500 text-base font-bold text-white hover:bg-blue-600">
        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitting ? '正在校验房间…' : submitLabel}
      </Button>
    </form>
  );
};

export default BindRoomForm;
