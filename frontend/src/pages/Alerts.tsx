import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { LOW_QUOTA_LIMIT, THRESHOLD_MAX, THRESHOLD_MIN } from '@shared/campus';
import type { RoomInfo } from '@shared/types/dorm';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import RoomGate from '@/components/custom/RoomGate';
import { useRoom } from '@/contexts/RoomContext';
import { api } from '@/lib/api';

const AlertsContent = ({ room }: { room: RoomInfo }) => {
  const { setRoom } = useRoom();
  const location = useLocation();
  const welcome = (location.state as { welcome?: boolean } | null)?.welcome === true;
  const [threshold, setThreshold] = useState(room.threshold);
  const [enabled, setEnabled] = useState(room.alertEnabled);
  const [saving, setSaving] = useState(false);
  const [authorizing, setAuthorizing] = useState(false);

  const dirty = threshold !== room.threshold || enabled !== room.alertEnabled;

  const handleSave = async () => {
    if (!Number.isInteger(threshold) || threshold < THRESHOLD_MIN || threshold > THRESHOLD_MAX) {
      toast.error(`阈值需在 ${THRESHOLD_MIN}-${THRESHOLD_MAX} 元之间`);
      return;
    }
    setSaving(true);
    try {
      const info = await api.updateSettings(room.id, { threshold, alertEnabled: enabled });
      setRoom(info);
      toast.success('设置已保存');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败，请重试');
    } finally {
      setSaving(false);
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

  return (
    <>
      {welcome && (
        <section className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          绑定成功！接下来设置预警阈值并授权消息推送，余额低于阈值时我们会提醒你。
        </section>
      )}

      <section className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-lg font-bold">预警设置</h2>
        <p className="mb-5 text-xs text-slate-500">设置仅对你本人生效，室友可各自设置</p>

        <div className="flex min-h-[44px] items-center justify-between gap-3">
          <div>
            <p className="font-medium">低余额预警</p>
            <p className="text-xs text-slate-500">余额低于阈值时提醒你充值</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="开启或关闭预警" />
        </div>

        <div className={enabled ? 'mt-6' : 'mt-6 opacity-50'}>
          <div className="mb-3 flex items-baseline justify-between">
            <p className="font-medium">预警阈值</p>
            <p className="text-2xl font-bold text-blue-500">{threshold} 元</p>
          </div>
          <Slider
            min={THRESHOLD_MIN}
            max={THRESHOLD_MAX}
            step={1}
            value={[threshold]}
            disabled={!enabled}
            onValueChange={(v) => setThreshold(v[0] ?? threshold)}
            aria-label="预警阈值"
          />
          <div className="mt-2 flex justify-between text-xs text-slate-500">
            <span>{THRESHOLD_MIN} 元</span>
            <span>{THRESHOLD_MAX} 元</span>
          </div>
        </div>

        <Button
          onClick={() => void handleSave()}
          disabled={!dirty || saving}
          className="mt-6 h-12 w-full bg-blue-500 text-base font-bold text-white hover:bg-blue-600"
        >
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          保存设置
        </Button>
      </section>

      <section className="rounded-[1.25rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-orange-100 p-2 text-orange-600">
            <Bell className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold">订阅消息额度</h3>
            <p className="mt-1 text-sm text-slate-600">当前剩余可接收提醒次数：{room.quota} 次</p>
            {room.quota < LOW_QUOTA_LIMIT && (
              <p className="mt-1 text-xs font-medium text-red-500">额度不足，可能错过预警，请补充授权</p>
            )}
            <Button
              variant="outline"
              onClick={() => void handleAuthorize()}
              disabled={authorizing}
              className="mt-3 h-11"
            >
              {authorizing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              补充授权
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

const Alerts = () => <RoomGate>{(room) => <AlertsContent key={room.id} room={room} />}</RoomGate>;

export default Alerts;
