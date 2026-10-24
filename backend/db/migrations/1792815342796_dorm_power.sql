CREATE TABLE IF NOT EXISTS rooms (
  id text PRIMARY KEY,
  campus text NOT NULL,
  building text NOT NULL,
  room_no text NOT NULL,
  balance double precision NOT NULL,
  balance_source text NOT NULL DEFAULT 'api',
  balance_updated_at timestamp NOT NULL DEFAULT now(),
  last_refresh_at timestamp,
  member_count integer NOT NULL DEFAULT 0,
  threshold integer NOT NULL DEFAULT 20,
  alert_enabled boolean NOT NULL DEFAULT true,
  quota integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS rooms_location_uq ON rooms (campus, building, room_no);

CREATE TABLE IF NOT EXISTS balance_snapshots (
  id text PRIMARY KEY,
  room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  balance double precision NOT NULL,
  source text NOT NULL DEFAULT 'api',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS balance_snapshots_room_time_idx ON balance_snapshots (room_id, created_at);
