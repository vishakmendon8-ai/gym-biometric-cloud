/**
 * Database layer for ADMS server.
 * - Uses PostgreSQL (pg) in production when DATABASE_URL is configured.
 * - Automatically falls back to Node 22 built-in SQLite (node:sqlite) for single-host / local runs.
 * Enforces composite UNIQUE(device_sn, employee_code, punch_time) to prevent duplicate punches.
 */

import fs from 'fs';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;

export class AdmsDatabase {
  constructor() {
    this.mode = null; // 'postgres' | 'sqlite'
    this.pool = null;
    this.sqlite = null;
  }

  async init() {
    const dbUrl = (process.env.DATABASE_URL || '').trim();
    if (dbUrl && /^postgres(ql)?:\/\//i.test(dbUrl)) {
      this.mode = 'postgres';
      this.pool = new Pool({
        connectionString: dbUrl,
        ssl:
          process.env.DATABASE_SSL === 'true'
            ? { rejectUnauthorized: false }
            : undefined,
      });

      const schemaPath = path.resolve(new URL('../schema.sql', import.meta.url).pathname);
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await this.pool.query(schemaSql);
      console.log('[DB] Connected to PostgreSQL and verified schema.');
      return;
    }

    // Built-in Node 22 SQLite fallback
    const { DatabaseSync } = await import('node:sqlite');
    const sqlitePath = path.resolve(process.env.SQLITE_PATH || './data/adms.db');
    fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });

    this.mode = 'sqlite';
    this.sqlite = new DatabaseSync(sqlitePath);
    this.sqlite.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serial_number TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL DEFAULT 'Unassigned Secureye Device',
        location TEXT NOT NULL DEFAULT 'Main Entrance',
        last_seen_at TEXT,
        status TEXT NOT NULL DEFAULT 'offline',
        push_version TEXT,
        ip_address TEXT,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_devices_serial_number ON devices (serial_number);
      CREATE INDEX IF NOT EXISTS idx_devices_last_seen_at ON devices (last_seen_at DESC);

      CREATE TABLE IF NOT EXISTS attendance_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        device_sn TEXT NOT NULL,
        employee_code TEXT NOT NULL,
        punch_time TEXT NOT NULL,
        punch_state TEXT NOT NULL DEFAULT '0',
        verify_mode TEXT NOT NULL DEFAULT '1',
        work_code TEXT DEFAULT '0',
        raw_payload TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        UNIQUE(device_sn, employee_code, punch_time)
      );

      CREATE INDEX IF NOT EXISTS idx_attendance_punch_time ON attendance_logs (punch_time DESC);
      CREATE INDEX IF NOT EXISTS idx_attendance_employee_code ON attendance_logs (employee_code);
      CREATE INDEX IF NOT EXISTS idx_attendance_device_sn ON attendance_logs (device_sn);

      CREATE TABLE IF NOT EXISTS raw_request_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        query_string TEXT,
        device_sn TEXT,
        content_type TEXT,
        remote_ip TEXT,
        raw_body TEXT,
        response_status INTEGER NOT NULL DEFAULT 200,
        received_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_raw_request_logs_received_at ON raw_request_logs (received_at DESC);
    `);

    console.log(`[DB] Connected to SQLite at ${sqlitePath}`);
  }

  async upsertDeviceHeartbeat({ serialNumber, ipAddress = null, pushVersion = null }) {
    const sn = String(serialNumber || '').trim();
    if (!sn) return null;
    const nowIso = new Date().toISOString();

    if (this.mode === 'postgres') {
      const res = await this.pool.query(
        `
        INSERT INTO devices (serial_number, last_seen_at, status, push_version, ip_address, updated_at)
        VALUES ($1, $2, 'online', $3, $4, $2)
        ON CONFLICT (serial_number)
        DO UPDATE SET
          last_seen_at = EXCLUDED.last_seen_at,
          status = 'online',
          push_version = COALESCE(EXCLUDED.push_version, devices.push_version),
          ip_address = COALESCE(EXCLUDED.ip_address, devices.ip_address),
          updated_at = EXCLUDED.updated_at
        RETURNING *;
        `,
        [sn, nowIso, pushVersion, ipAddress]
      );
      return res.rows[0];
    }

    this.sqlite
      .prepare(
        `
        INSERT INTO devices (serial_number, last_seen_at, status, push_version, ip_address, updated_at)
        VALUES (?, ?, 'online', ?, ?, ?)
        ON CONFLICT(serial_number)
        DO UPDATE SET
          last_seen_at = excluded.last_seen_at,
          status = 'online',
          push_version = COALESCE(excluded.push_version, devices.push_version),
          ip_address = COALESCE(excluded.ip_address, devices.ip_address),
          updated_at = excluded.updated_at
        `
      )
      .run(sn, nowIso, pushVersion, ipAddress, nowIso);

    return this.sqlite
      .prepare('SELECT * FROM devices WHERE serial_number = ?')
      .get(sn);
  }

  async listDevices(onlineThresholdSec = Number(process.env.DEVICE_ONLINE_THRESHOLD_SEC || 120)) {
    const rows =
      this.mode === 'postgres'
        ? (await this.pool.query('SELECT * FROM devices ORDER BY last_seen_at DESC NULLS LAST, id DESC')).rows
        : this.sqlite
            .prepare('SELECT * FROM devices ORDER BY last_seen_at DESC, id DESC')
            .all();

    const nowMs = Date.now();
    const windowMs = onlineThresholdSec * 1000;

    return rows.map((row) => {
      const lastSeenMs = row.last_seen_at ? new Date(row.last_seen_at).getTime() : 0;
      const isOnline = lastSeenMs > 0 && nowMs - lastSeenMs <= windowMs;
      return {
        ...row,
        status: isOnline ? 'online' : 'offline',
        is_online: isOnline,
      };
    });
  }

  async registerDevice({ serialNumber, name, location, ipAddress = null }) {
    const sn = String(serialNumber || '').trim();
    if (!sn) throw new Error('serial_number is required');
    const cleanName = String(name || 'Secureye Biometric Terminal').trim();
    const cleanLocation = String(location || 'Main Entrance').trim();
    const nowIso = new Date().toISOString();

    if (this.mode === 'postgres') {
      const res = await this.pool.query(
        `
        INSERT INTO devices (serial_number, name, location, ip_address, status, updated_at)
        VALUES ($1, $2, $3, $4, 'offline', $5)
        ON CONFLICT (serial_number)
        DO UPDATE SET
          name = EXCLUDED.name,
          location = EXCLUDED.location,
          ip_address = COALESCE(EXCLUDED.ip_address, devices.ip_address),
          updated_at = EXCLUDED.updated_at
        RETURNING *;
        `,
        [sn, cleanName, cleanLocation, ipAddress || null, nowIso]
      );
      return res.rows[0];
    }

    this.sqlite
      .prepare(
        `
        INSERT INTO devices (serial_number, name, location, ip_address, status, updated_at)
        VALUES (?, ?, ?, ?, 'offline', ?)
        ON CONFLICT(serial_number)
        DO UPDATE SET
          name = excluded.name,
          location = excluded.location,
          ip_address = COALESCE(excluded.ip_address, devices.ip_address),
          updated_at = excluded.updated_at
        `
      )
      .run(sn, cleanName, cleanLocation, ipAddress || null, nowIso);

    return this.sqlite
      .prepare('SELECT * FROM devices WHERE serial_number = ?')
      .get(sn);
  }

  async updateDeviceMeta(serialNumber, { name, location }) {
    const sn = String(serialNumber || '').trim();
    const nowIso = new Date().toISOString();

    if (this.mode === 'postgres') {
      const res = await this.pool.query(
        `
        UPDATE devices
        SET
          name = COALESCE($2, name),
          location = COALESCE($3, location),
          updated_at = $4
        WHERE serial_number = $1
        RETURNING *;
        `,
        [sn, name || null, location || null, nowIso]
      );
      return res.rows[0] || null;
    }

    this.sqlite
      .prepare(
        `
        UPDATE devices
        SET
          name = COALESCE(?, name),
          location = COALESCE(?, location),
          updated_at = ?
        WHERE serial_number = ?
        `
      )
      .run(name || null, location || null, nowIso, sn);

    return (
      this.sqlite.prepare('SELECT * FROM devices WHERE serial_number = ?').get(sn) || null
    );
  }

  async insertAttendancePunch({
    deviceSn,
    employeeCode,
    punchTime,
    punchState = '0',
    verifyMode = '1',
    workCode = '0',
    rawPayload,
  }) {
    if (this.mode === 'postgres') {
      const res = await this.pool.query(
        `
        INSERT INTO attendance_logs
          (device_sn, employee_code, punch_time, punch_state, verify_mode, work_code, raw_payload)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (device_sn, employee_code, punch_time) DO NOTHING
        RETURNING *;
        `,
        [deviceSn, employeeCode, punchTime, punchState, verifyMode, workCode, rawPayload]
      );
      if (res.rowCount === 0) {
        return { inserted: false, duplicate: true, record: null };
      }
      return { inserted: true, duplicate: false, record: res.rows[0] };
    }

    const info = this.sqlite
      .prepare(
        `
        INSERT OR IGNORE INTO attendance_logs
          (device_sn, employee_code, punch_time, punch_state, verify_mode, work_code, raw_payload)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(deviceSn, employeeCode, punchTime, punchState, verifyMode, workCode, rawPayload);

    if (info.changes === 0) {
      return { inserted: false, duplicate: true, record: null };
    }

    const record = this.sqlite
      .prepare('SELECT * FROM attendance_logs WHERE id = ?')
      .get(Number(info.lastInsertRowid));
    return { inserted: true, duplicate: false, record };
  }

  async queryAttendance({ from, to, employeeCode, deviceSn, limit = 100, offset = 0 }) {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 1000);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const conditions = [];
    const params = [];

    if (from) {
      const fromIso = from.length === 10 ? `${from}T00:00:00.000Z` : new Date(from).toISOString();
      params.push(fromIso);
      conditions.push(
        this.mode === 'postgres' ? `punch_time >= $${params.length}` : 'punch_time >= ?'
      );
    }

    if (to) {
      const toIso = to.length === 10 ? `${to}T23:59:59.999Z` : new Date(to).toISOString();
      params.push(toIso);
      conditions.push(
        this.mode === 'postgres' ? `punch_time <= $${params.length}` : 'punch_time <= ?'
      );
    }

    if (employeeCode) {
      params.push(String(employeeCode).trim());
      conditions.push(
        this.mode === 'postgres' ? `employee_code = $${params.length}` : 'employee_code = ?'
      );
    }

    if (deviceSn) {
      params.push(String(deviceSn).trim());
      conditions.push(
        this.mode === 'postgres' ? `device_sn = $${params.length}` : 'device_sn = ?'
      );
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    if (this.mode === 'postgres') {
      const countRes = await this.pool.query(
        `SELECT COUNT(*)::int AS total FROM attendance_logs ${whereClause}`,
        params
      );
      const dataParams = [...params, safeLimit, safeOffset];
      const rowsRes = await this.pool.query(
        `
        SELECT * FROM attendance_logs
        ${whereClause}
        ORDER BY punch_time DESC, id DESC
        LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
        `,
        dataParams
      );
      return { total: countRes.rows[0].total, rows: rowsRes.rows };
    }

    const countRow = this.sqlite
      .prepare(`SELECT COUNT(*) AS total FROM attendance_logs ${whereClause}`)
      .get(...params);

    const rows = this.sqlite
      .prepare(
        `
        SELECT * FROM attendance_logs
        ${whereClause}
        ORDER BY punch_time DESC, id DESC
        LIMIT ? OFFSET ?
        `
      )
      .all(...params, safeLimit, safeOffset);

    return { total: Number(countRow.total || 0), rows };
  }

  async logRawRequest({
    method,
    reqPath,
    queryString,
    deviceSn,
    contentType,
    remoteIp,
    rawBody,
    responseStatus = 200,
  }) {
    const truncatedBody = String(rawBody || '').slice(0, 8000);
    if (this.mode === 'postgres') {
      await this.pool.query(
        `
        INSERT INTO raw_request_logs
          (method, path, query_string, device_sn, content_type, remote_ip, raw_body, response_status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [method, reqPath, queryString, deviceSn, contentType, remoteIp, truncatedBody, responseStatus]
      );
      return;
    }

    this.sqlite
      .prepare(
        `
        INSERT INTO raw_request_logs
          (method, path, query_string, device_sn, content_type, remote_ip, raw_body, response_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .run(method, reqPath, queryString, deviceSn, contentType, remoteIp, truncatedBody, responseStatus);
  }

  async listRawRequests(limit = 50) {
    const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    if (this.mode === 'postgres') {
      const res = await this.pool.query(
        'SELECT * FROM raw_request_logs ORDER BY id DESC LIMIT $1',
        [safeLimit]
      );
      return res.rows;
    }
    return this.sqlite
      .prepare('SELECT * FROM raw_request_logs ORDER BY id DESC LIMIT ?')
      .all(safeLimit);
  }
}
