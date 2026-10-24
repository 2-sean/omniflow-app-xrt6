import { and, asc, eq, gte, sql } from 'drizzle-orm';
import { db } from '../db';
import { balanceSnapshots, rooms } from '../db/schema';

export type RoomRow = typeof rooms.$inferSelect;
export type RoomInsert = typeof rooms.$inferInsert;
export type SnapshotRow = typeof balanceSnapshots.$inferSelect;
export type SnapshotInsert = typeof balanceSnapshots.$inferInsert;

export const roomRepository = {
  async findById(id: string): Promise<RoomRow | null> {
    const result = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    return result[0] ?? null;
  },

  async findByLocation(
    campus: string,
    building: string,
    roomNo: string
  ): Promise<RoomRow | null> {
    const result = await db
      .select()
      .from(rooms)
      .where(
        and(
          eq(rooms.campus, campus),
          eq(rooms.building, building),
          eq(rooms.roomNo, roomNo)
        )
      )
      .limit(1);
    return result[0] ?? null;
  },

  async create(values: RoomInsert): Promise<void> {
    await db.insert(rooms).values(values).onConflictDoNothing();
  },

  async update(id: string, values: Partial<RoomInsert>): Promise<RoomRow | null> {
    const result = await db
      .update(rooms)
      .set(values)
      .where(eq(rooms.id, id))
      .returning();
    return result[0] ?? null;
  },

  async tryJoin(id: string, maxMembers: number): Promise<boolean> {
    const result = await db
      .update(rooms)
      .set({ memberCount: sql`${rooms.memberCount} + 1` })
      .where(and(eq(rooms.id, id), sql`${rooms.memberCount} < ${maxMembers}`))
      .returning({ id: rooms.id });
    return result.length > 0;
  },

  async leave(id: string): Promise<void> {
    await db
      .update(rooms)
      .set({ memberCount: sql`GREATEST(${rooms.memberCount} - 1, 0)` })
      .where(eq(rooms.id, id));
  },

  async addQuota(id: string, amount: number): Promise<RoomRow | null> {
    const result = await db
      .update(rooms)
      .set({ quota: sql`${rooms.quota} + ${amount}` })
      .where(eq(rooms.id, id))
      .returning();
    return result[0] ?? null;
  },

  async addSnapshots(rows: SnapshotInsert[]): Promise<void> {
    if (rows.length === 0) return;
    await db.insert(balanceSnapshots).values(rows);
  },

  async listSnapshots(roomId: string, since: Date): Promise<SnapshotRow[]> {
    return db
      .select()
      .from(balanceSnapshots)
      .where(
        and(
          eq(balanceSnapshots.roomId, roomId),
          gte(balanceSnapshots.createdAt, since)
        )
      )
      .orderBy(asc(balanceSnapshots.createdAt));
  },
};
