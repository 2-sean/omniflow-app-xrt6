export type BalanceSource = 'api' | 'manual';
export type BalanceStatus = 'sufficient' | 'low' | 'critical' | 'arrears';

export interface RoomInfo {
  id: string;
  campus: string;
  building: string;
  roomNo: string;
  balance: number;
  balanceSource: BalanceSource;
  balanceUpdatedAt: string;
  memberCount: number;
  maxMembers: number;
  threshold: number;
  alertEnabled: boolean;
  quota: number;
  status: BalanceStatus;
  estimatedDays: number | null;
  refreshAvailableAt: string | null;
}

export interface BindRoomRequest {
  campus: string;
  building: string;
  roomNo: string;
}

export interface ManualBalanceRequest {
  balance: number;
}

export interface UpdateSettingsRequest {
  threshold: number;
  alertEnabled: boolean;
}

export interface HistoryPoint {
  date: string;
  balance: number | null;
  usage: number;
  hasData: boolean;
}

export interface HistoryResponse {
  days: number;
  points: HistoryPoint[];
  totalUsage: number;
  avgDaily: number | null;
  dataDays: number;
}
