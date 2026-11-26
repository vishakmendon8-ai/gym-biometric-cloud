-- Production PostgreSQL Schema for Secureye / ZKTeco ADMS (iClock) Backend

CREATE TABLE IF NOT EXISTS devices (
  id SERIAL PRIMARY KEY,
  serial_number VARCHAR(128) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL DEFAULT 'Unassigned Secureye Device',
  location VARCHAR(255) NOT NULL DEFAULT 'Main Entrance',
  last_seen_at TIMESTAMPTZ,
  status VARCHAR(32) NOT NULL DEFAULT 'offline',
  push_version VARCHAR(64),
  ip_address VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_devices_serial_number ON devices (serial_number);
CREATE INDEX IF NOT EXISTS idx_devices_last_seen_at ON devices (last_seen_at DESC);

CREATE TABLE IF NOT EXISTS attendance_logs (
  id BIGSERIAL PRIMARY KEY,
  device_sn VARCHAR(128) NOT NULL,
  employee_code VARCHAR(128) NOT NULL,
  punch_time TIMESTAMPTZ NOT NULL,
  punch_state VARCHAR(32) NOT NULL DEFAULT '0',
  verify_mode VARCHAR(32) NOT NULL DEFAULT '1',
  work_code VARCHAR(64) DEFAULT '0',
  raw_payload TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_attendance_device_user_time UNIQUE (device_sn, employee_code, punch_time)
);

CREATE INDEX IF NOT EXISTS idx_attendance_punch_time ON attendance_logs (punch_time DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_code ON attendance_logs (employee_code);
CREATE INDEX IF NOT EXISTS idx_attendance_device_sn ON attendance_logs (device_sn);

CREATE TABLE IF NOT EXISTS raw_request_logs (
  id BIGSERIAL PRIMARY KEY,
  method VARCHAR(16) NOT NULL,
  path VARCHAR(255) NOT NULL,
  query_string TEXT,
  device_sn VARCHAR(128),
  content_type VARCHAR(128),
  remote_ip VARCHAR(64),
  raw_body TEXT,
  response_status INTEGER NOT NULL DEFAULT 200,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_raw_request_logs_received_at ON raw_request_logs (received_at DESC);
