import { Router } from 'express';
import { z } from 'zod';
import { THRESHOLD_MAX, THRESHOLD_MIN } from '../../shared/campus';
import { asyncHandler as handle } from '../middleware/asyncHandler';
import { roomService } from '../services/roomService';

const router = Router();

const bindSchema = z.object({
  campus: z.string().trim().min(1, '请选择校区'),
  building: z.string().trim().min(1, '请选择楼栋'),
  roomNo: z.string().trim().min(1, '请输入房间号'),
});

const manualSchema = z.object({
  balance: z
    .number({ invalid_type_error: '请输入有效的余额数字' })
    .min(0, '余额不能为负数')
    .max(2000, '余额超出合理范围，请检查后重新输入'),
});

const settingsSchema = z.object({
  threshold: z
    .number()
    .int('阈值需为整数')
    .min(THRESHOLD_MIN, `阈值需在 ${THRESHOLD_MIN}-${THRESHOLD_MAX} 元之间`)
    .max(THRESHOLD_MAX, `阈值需在 ${THRESHOLD_MIN}-${THRESHOLD_MAX} 元之间`),
  alertEnabled: z.boolean(),
});

const historySchema = z.object({
  days: z.enum(['7', '30', '90']).default('7'),
});

router.post(
  '/bind',
  handle(async (req, res) => {
    const input = bindSchema.parse(req.body);
    const data = await roomService.bind({
      campus: String(input.campus),
      building: String(input.building),
      roomNo: String(input.roomNo),
    });
    res.status(201).json({ success: true, data });
  })
);

router.get(
  '/:id',
  handle(async (req, res) => {
    const data = await roomService.get(req.params.id);
    res.json({ success: true, data });
  })
);

router.post(
  '/:id/refresh',
  handle(async (req, res) => {
    const data = await roomService.refresh(req.params.id);
    res.json({ success: true, data, message: '已更新' });
  })
);

router.post(
  '/:id/manual',
  handle(async (req, res) => {
    const input = manualSchema.parse(req.body);
    const data = await roomService.manualBalance(req.params.id, input.balance);
    res.json({ success: true, data });
  })
);

router.put(
  '/:id/settings',
  handle(async (req, res) => {
    const input = settingsSchema.parse(req.body);
    const data = await roomService.updateSettings(req.params.id, input.threshold, input.alertEnabled);
    res.json({ success: true, data });
  })
);

router.post(
  '/:id/quota',
  handle(async (req, res) => {
    const data = await roomService.addQuota(req.params.id);
    res.json({ success: true, data });
  })
);

router.post(
  '/:id/unbind',
  handle(async (req, res) => {
    await roomService.unbind(req.params.id);
    res.json({ success: true, data: null });
  })
);

router.get(
  '/:id/history',
  handle(async (req, res) => {
    const { days } = historySchema.parse(req.query);
    const data = await roomService.history(req.params.id, Number(days));
    res.json({ success: true, data });
  })
);

export default router;
