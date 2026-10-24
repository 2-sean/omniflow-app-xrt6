import { Copy, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RECHARGE_URL } from '@/lib/dorm';

interface RechargeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RechargeDialog = ({ open, onOpenChange }: RechargeDialogProps) => {
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(RECHARGE_URL);
      toast.success('充值链接已复制');
    } catch {
      toast.error('复制失败，请手动复制：' + RECHARGE_URL);
    }
  };

  const openOfficial = () => {
    const win = window.open(RECHARGE_URL, '_blank', 'noopener,noreferrer');
    if (!win) {
      toast.error('跳转失败，请复制链接到浏览器打开');
    } else {
      onOpenChange(false);
      toast('充值完成后，回来点“刷新余额”确认到账');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-[1.25rem] sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <DialogTitle>前往学校官方充值渠道</DialogTitle>
          <DialogDescription>
            充值由学校官方渠道处理，本应用不涉及支付。完成充值后返回这里，点击“刷新余额”即可确认到账。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:flex-col">
          <Button onClick={openOfficial} className="h-11 w-full bg-blue-500 text-white hover:bg-blue-600">
            <ExternalLink className="mr-2 h-4 w-4" /> 前往学校充值
          </Button>
          <Button variant="outline" onClick={() => void copyLink()} className="h-11 w-full">
            <Copy className="mr-2 h-4 w-4" /> 复制充值链接
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RechargeDialog;
