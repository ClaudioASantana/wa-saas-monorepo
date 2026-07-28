CREATE TABLE IF NOT EXISTS whatsapp_sessions (
  instance_id VARCHAR(255) NOT NULL,
  key_id VARCHAR(255) NOT NULL,
  data JSONB NOT NULL,
  PRIMARY KEY (instance_id, key_id)
);
