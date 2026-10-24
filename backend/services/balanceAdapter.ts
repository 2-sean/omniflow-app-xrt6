// School electricity API adapter.
// This is a simulated adapter: replace the bodies with real calls to the
// school's read-only API once access is authorised.

const ROOM_PATTERN = /^[1-6](0[1-9]|[12]\d|30)$/;

const round2 = (n: number): number => Math.round(n * 100) / 100;

export const balanceAdapter = {
  async verifyRoom(_campus: string, _building: string, roomNo: string): Promise<boolean> {
    return ROOM_PATTERN.test(roomNo);
  },

  async fetchInitialBalance(): Promise<number> {
    return round2(15 + Math.random() * 20);
  },

  async fetchBalance(current: number): Promise<number> {
    const drop = 0.2 + Math.random() * 1.3;
    return round2(Math.max(0, current - drop));
  },
};
