import { API_BASE_URL } from '@/config/constants';
import type { ApiEnvelope } from '@shared/types/api';
import type {
  BindRoomRequest,
  HistoryResponse,
  RoomInfo,
  UpdateSettingsRequest,
} from '@shared/types/dorm';

export class ApiError extends Error {
  status: number;
  refreshAvailableAt?: string;
  constructor(message: string, status: number, refreshAvailableAt?: string) {
    super(message);
    this.status = status;
    this.refreshAvailableAt = refreshAvailableAt;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/rooms${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...init,
    });
  } catch {
    throw new ApiError('网络异常，请检查网络后重试', 0);
  }
  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    body = null;
  }
  if (!res.ok || !body || !body.success) {
    throw new ApiError(
      body?.message ?? '请求失败，请稍后重试',
      res.status,
      body?.refreshAvailableAt
    );
  }
  return body.data;
}

const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  bind: (input: BindRoomRequest) => post<RoomInfo>('/bind', input),
  getRoom: (id: string) => request<RoomInfo>(`/${id}`),
  refresh: (id: string) => post<RoomInfo>(`/${id}/refresh`),
  manualBalance: (id: string, balance: number) => post<RoomInfo>(`/${id}/manual`, { balance }),
  updateSettings: (id: string, input: UpdateSettingsRequest) =>
    request<RoomInfo>(`/${id}/settings`, { method: 'PUT', body: JSON.stringify(input) }),
  addQuota: (id: string) => post<RoomInfo>(`/${id}/quota`),
  unbind: (id: string) => post<null>(`/${id}/unbind`),
  history: (id: string, days: 7 | 30 | 90) => request<HistoryResponse>(`/${id}/history?days=${days}`),
};
