import { randomUUID } from 'crypto';
import {
  CAMPUS_DICT,
  MAX_MEMBERS,
  REFRESH_COOLDOWN_SECONDS,
  DEFAULT_THRESHOLD,
} from '../../shared/campus';
import type {
  BalanceStatus,
  BindRoomRequest,
  HistoryPoint,
  HistoryResponse,
  RoomInfo,
  BalanceSource,
} from '../../shared/types/dorm';
import {
  roomRepository,
  type RoomRow,
  type SnapshotRow,
} from '../repositories/roomRepository';
import { balanceAdapter } from './balanceAdapter';

const DAY_MS = 86400000;
const CN_OFFSET_MS = 8 * 3600000;

export class AppError extends Error {
  status: number;
  extra?: Record<string, unknown>;
  constructor(status: number, message: string, extra?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

const dayKey = (d: Date): string =>
  new Date(d.getTime() + CN_OFFSET_MS).toISOString().slice(0, 10);

function computeStatus(balance: number, threshold: number): BalanceStatus {
  if (balance <= 0) return 'arrears';
  if (balance < threshold / 2) return 'critical';
  if (balance < threshold) return 'low';
  return 'sufficient';
}

function dailyUsage(snaps: SnapshotRow[]): { spanDays: number; used: number } {
  if (snaps.length < 2) return { spanDays: 0, used: 0 };
  let used = 0;
  for (let i = 1; i < snaps.length; i++) {
    const diff = snaps[i - 1].balance - snaps[i].balance;
    if (diff > 0) used += diff; // balance increases are recharges, ignored
  }
  const spanDays =
    (snaps[snaps.length - 1].createdAt.getTime() - snaps[0].createdAt.getTime()) / DAY_MS;
  return { spanDays, used };
}

function estimateDays(snaps: SnapshotRow[], balance: number): number | null {
  const { spanDays, used } = dailyUsage(snaps);
  if (spanDays < 3) return null;
  const daily = used / spanDays;
  if (daily < 0.01) return null;
  return Math.max(0, Math.floor(balance / daily));
}

async function toInfo(room: RoomRow): Promise<RoomInfo> {
  const snaps = await roomRepository.listSnapshots(
    room.id,
    new Date(Date.now() - 7 * DAY_MS - 3600000)
  );
  const availableAt = room.lastRefreshAt
    ? new Date(room.lastRefreshAt.getTime() + REFRESH_COOLDOWN_SECONDS * 1000)
    : null;
  return {
    id: room.id,
    campus: room.campus,
    building: room.building,
    roomNo: room.roomNo,
    balance: room.balance,
    balanceSource: room.balanceSource as BalanceSource,
    balanceUpdatedAt: room.balanceUpdatedAt.toISOString(),
    memberCount: room.memberCount,
    maxMembers: MAX_MEMBERS,
    threshold: room.threshold,
    alertEnabled: room.alertEnabled,
    quota: room.quota,
    status: computeStatus(room.balance, room.threshold),
    estimatedDays: estimateDays(snaps, room.balance),
    refreshAvailableAt:
      availableAt && availableAt.getTime() > Date.now() ? availableAt.toISOString() : null,
  };
}

async function requireRoom(id: string): Promise<RoomRow> {
  const room = await roomRepository.findById(id);
  if (!room) throw new AppError(404, '未找到该宿舍，请重新绑定');
  return room;
}

export const roomService = {
  async bind(input: BindRoomRequest): Promise<RoomInfo> {
    const buildings = CAMPUS_DICT[input.campus];
    if (!buildings || !buildings.includes(input.building)) {
      throw new AppError(400, '校区或楼栋不在可选范围内');
    }
    if (!/^\d{3,4}$/.test(input.roomNo)) {
      throw new AppError(400, '房间号格式不正确，请输入 3-4 位数字，例如 502');
    }
    const exists = await balanceAdapter.verifyRoom(input.campus, input.building, input.roomNo);
    if (!exists) {
      throw new AppError(404, '房间不存在，请检查楼层和房间号后重试');
    }

    let room = await roomRepository.findByLocation(input.campus, input.building, input.roomNo);
    if (!room) {
      const roomId = randomUUID();
      const now = Date.now();
      let balance = await balanceAdapter.fetchInitialBalance();
      const snapshots = [{ id: randomUUID(), roomId, balance, source: 'api', createdAt: new Date(now) }];
      for (let i = 1; i <= 7; i++) {
        balance = round2(balance + 3 + Math.random() * 5);
        snapshots.push({
          id: randomUUID(),
          roomId,
          balance,
          source: 'api',
          createdAt: new Date(now - i * DAY_MS),
        });
      }
      await roomRepository.create({
        id: roomId,
        campus: input.campus,
        building: input.building,
        roomNo: input.roomNo,
        balance: snapshots[0].balance,
        balanceSource: 'api',
        balanceUpdatedAt: new Date(now),
        threshold: DEFAULT_THRESHOLD,
      });
      room = await roomRepository.findByLocation(input.campus, input.building, input.roomNo);
      if (room && room.id === roomId) {
        await roomRepository.addSnapshots(snapshots);
      }
    }
    if (!room) throw new AppError(500, '绑定失败，请稍后重试');

    const joined = await roomRepository.tryJoin(room.id, MAX_MEMBERS);
    if (!joined) {
      throw new AppError(409, `该宿舍已满员（${MAX_MEMBERS}/${MAX_MEMBERS}），请联系室友确认房间号`);
    }
    return toInfo(await requireRoom(room.id));
  },

  async get(id: string): Promise<RoomInfo> {
    return toInfo(await requireRoom(id));
  },

  async refresh(id: string): Promise<RoomInfo> {
    const room = await requireRoom(id);
    if (room.lastRefreshAt) {
      const availableAt = room.lastRefreshAt.getTime() + REFRESH_COOLDOWN_SECONDS * 1000;
      if (availableAt > Date.now()) {
        throw new AppError(429, '刷新太频繁了，请稍后再试', {
          refreshAvailableAt: new Date(availableAt).toISOString(),
        });
      }
    }
    const balance = await balanceAdapter.fetchBalance(room.balance);
    const now = new Date();
    await roomRepository.addSnapshots([
      { id: randomUUID(), roomId: id, balance, source: 'api', createdAt: now },
    ]);
    const updated = await roomRepository.update(id, {
      balance,
      balanceSource: 'api',
      balanceUpdatedAt: now,
      lastRefreshAt: now,
    });
    return toInfo(updated ?? room);
  },

  async manualBalance(id: string, balance: number): Promise<RoomInfo> {
    const room = await requireRoom(id);
    const value = round2(balance);
    const now = new Date();
    await roomRepository.addSnapshots([
      { id: randomUUID(), roomId: id, balance: value, source: 'manual', createdAt: now },
    ]);
    const updated = await roomRepository.update(id, {
      balance: value,
      balanceSource: 'manual',
      balanceUpdatedAt: now,
    });
    return toInfo(updated ?? room);
  },

  async updateSettings(id: string, threshold: number, alertEnabled: boolean): Promise<RoomInfo> {
    const room = await requireRoom(id);
    const updated = await roomRepository.update(id, { threshold, alertEnabled });
    return toInfo(updated ?? room);
  },

  async addQuota(id: string): Promise<RoomInfo> {
    await requireRoom(id);
    const updated = await roomRepository.addQuota(id, 1);
    if (!updated) throw new AppError(404, '未找到该宿舍');
    return toInfo(updated);
  },

  async unbind(id: string): Promise<void> {
    await requireRoom(id);
    await roomRepository.leave(id);
  },

  async history(id: string, days: number): Promise<HistoryResponse> {
    await requireRoom(id);
    const now = new Date();
    const since = new Date(now.getTime() - days * DAY_MS);
    const snaps = await roomRepository.listSnapshots(id, since);

    const byDay = new Map<string, { balance: number; usage: number }>();
    for (let i = 0; i < snaps.length; i++) {
      const key = dayKey(snaps[i].createdAt);
      const entry = byDay.get(key) ?? { balance: snaps[i].balance, usage: 0 };
      entry.balance = snaps[i].balance;
      if (i > 0) {
        const diff = snaps[i - 1].balance - snaps[i].balance;
        if (diff > 0) entry.usage += diff;
      }
      byDay.set(key, entry);
    }

    const points: HistoryPoint[] = [];
    let totalUsage = 0;
    let dataDays = 0;
    for (let i = days - 1; i >= 0; i--) {
      const key = dayKey(new Date(now.getTime() - i * DAY_MS));
      const entry = byDay.get(key);
      if (entry) {
        dataDays++;
        totalUsage += entry.usage;
        points.push({ date: key, balance: round2(entry.balance), usage: round2(entry.usage), hasData: true });
      } else {
        points.push({ date: key, balance: null, usage: 0, hasData: false });
      }
    }
    const { spanDays, used } = dailyUsage(snaps);
    return {
      days,
      points,
      totalUsage: round2(totalUsage),
      avgDaily: spanDays >= 1 ? round2(used / spanDays) : null,
      dataDays,
    };
  },
};
