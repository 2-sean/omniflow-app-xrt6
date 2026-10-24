import {
  pgTable,
  text,
  integer,
  boolean,
  doublePrecision,
  timestamp,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const rooms = pgTable(
  'rooms',
  {
    id: text('id').primaryKey(),
    campus: text('campus').notNull(),
    building: text('building').notNull(),
    roomNo: text('room_no').notNull(),
    balance: doublePrecision('balance').notNull(),
    balanceSource: text('balance_source').notNull().default('api'),
    balanceUpdatedAt: timestamp('balance_updated_at').notNull().defaultNow(),
    lastRefreshAt: timestamp('last_refresh_at'),
    memberCount: integer('member_count').notNull().default(0),
    threshold: integer('threshold').notNull().default(20),
    alertEnabled: boolean('alert_enabled').notNull().default(true),
    quota: integer('quota').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('rooms_location_uq').on(t.campus, t.building, t.roomNo),
  ]
);

export const balanceSnapshots = pgTable(
  'balance_snapshots',
  {
    id: text('id').primaryKey(),
    roomId: text('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    balance: doublePrecision('balance').notNull(),
    source: text('source').notNull().default('api'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [index('balance_snapshots_room_time_idx').on(t.roomId, t.createdAt)]
);
