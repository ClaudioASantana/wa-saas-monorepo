-- Add is_internal column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT false;

-- Optional: Add index for performance if we filter by it often
CREATE INDEX IF NOT EXISTS idx_messages_is_internal ON messages(is_internal);
