-- Add reservation_status enum
CREATE TYPE reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  item_id UUID NOT NULL,
  reservation_date DATE NOT NULL,
  time_slots TEXT[] NOT NULL,
  status reservation_status DEFAULT 'pending',
  reason TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_reservations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_reservations_item FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reservations_user ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_item ON reservations(item_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(reservation_date);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);

-- Disable RLS on reservations table (API handles authorization)
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
