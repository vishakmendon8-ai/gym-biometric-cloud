/**
 * ZKTeco ADMS / iClock HTTP Push Protocol Parser & Response Builder
 *
 * Handles:
 *  - GET /iclock/cdata handshake config response
 *  - POST /iclock/cdata?table=ATTLOG (tab-separated attendance records)
 *  - POST /iclock/cdata?table=OPERLOG (operation, user, fingerprint, face logs)
 */

const PUNCH_STATE_LABELS = {
  '0': 'Check-In',
  '1': 'Check-Out',
  '2': 'Break-Out',
  '3': 'Break-In',
  '4': 'OT-In',
  '5': 'OT-Out',
  '255': 'Auto',
};

const VERIFY_MODE_LABELS = {
  '0': 'Password',
  '1': 'Fingerprint',
  '2': 'Card',
  '3': 'Password',
  '4': 'Card',
  '15': 'Face',
  '25': 'Palm',
};

export function getPunchStateLabel(code) {
  return PUNCH_STATE_LABELS[String(code ?? '0')] || `State(${code})`;
}

export function getVerifyModeLabel(code) {
  return VERIFY_MODE_LABELS[String(code ?? '1')] || `Mode(${code})`;
}

/**
 * Build standard ADMS handshake configuration response for GET /iclock/cdata.
 */
export function buildHandshakeResponse(serialNumber, env = process.env) {
  const sn = String(serialNumber || 'UNKNOWN').trim();
  const errorDelay = env.ADMS_ERROR_DELAY || '60';
  const delay = env.ADMS_DELAY || '10';
  const transTimes = env.ADMS_TRANS_TIMES || '00:00;14:05';
  const transInterval = env.ADMS_TRANS_INTERVAL || '1';
  const transFlag = env.ADMS_TRANS_FLAG || '1111000000';
  const timeZone = env.ADMS_TIMEZONE || '5.5';
  const realtime = env.ADMS_REALTIME || '1';
  const encrypt = env.ADMS_ENCRYPT || '0';

  return [
    `GET OPTION FROM: ${sn}`,
    'Stamp=9999',
    'OpStamp=9999',
    'PhotoStamp=9999',
    `ErrorDelay=${errorDelay}`,
    `Delay=${delay}`,
    `TransTimes=${transTimes}`,
    `TransInterval=${transInterval}`,
    `TransFlag=${transFlag}`,
    `TimeZone=${timeZone}`,
    `Realtime=${realtime}`,
    `Encrypt=${encrypt}`,
    '',
  ].join('\n');
}

/**
 * Normalize an ADMS timestamp like "2026-11-26 21:25:17" into ISO-8601 UTC string.
 * Uses ADMS_TIMEZONE offset (default +05:30 for India IST) when the device omits timezone info.
 */
export function normalizeAdmsTimestamp(rawTs, tzOffsetHours = Number(process.env.ADMS_TIMEZONE ?? 5.5)) {
  const trimmed = String(rawTs || '').trim();
  if (!trimmed) return null;

  // Already contains explicit timezone (Z or +/-HH:MM)
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  // Standard ADMS format: YYYY-MM-DD HH:MM:SS (or YYYY/MM/DD HH:MM:SS)
  const match = trimmed.match(
    /^(\d{4})[-/](\d{2})[-/](\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/
  );
  if (match) {
    const [, y, mo, da, h, mi, s] = match;
    const totalMinutes = Math.round((Number.isFinite(tzOffsetHours) ? tzOffsetHours : 0) * 60);
    const sign = totalMinutes >= 0 ? '+' : '-';
    const absMin = Math.abs(totalMinutes);
    const hh = String(Math.floor(absMin / 60)).padStart(2, '0');
    const mm = String(absMin % 60).padStart(2, '0');
    const isoWithOffset = `${y}-${mo}-${da}T${h}:${mi}:${s}${sign}${hh}:${mm}`;
    const d = new Date(isoWithOffset);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback.toISOString();
}

/**
 * Parse POST /iclock/cdata?table=ATTLOG raw body.
 * Each line is tab-delimited:
 *   UserID \t Timestamp \t Status \t VerifyMode \t WorkCode \t Reserved1 \t Reserved2
 */
export function parseAttLogPayload(rawBody) {
  const text = String(rawBody || '');
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const records = [];
  const skipped = [];

  for (const line of lines) {
    const parts = line.split('\t');
    if (parts.length < 2) {
      skipped.push({ line, reason: 'Expected at least 2 tab-separated fields (UserID, Timestamp)' });
      continue;
    }

    const employeeCode = parts[0].trim();
    const rawTime = parts[1].trim();
    const punchTime = normalizeAdmsTimestamp(rawTime);

    if (!employeeCode || !punchTime) {
      skipped.push({ line, reason: 'Invalid UserID or Timestamp' });
      continue;
    }

    const punchState = (parts[2] ?? '0').trim() || '0';
    const verifyMode = (parts[3] ?? '1').trim() || '1';
    const workCode = (parts[4] ?? '0').trim() || '0';

    records.push({
      employeeCode,
      punchTime,
      rawPunchTime: rawTime,
      punchState,
      punchStateLabel: getPunchStateLabel(punchState),
      verifyMode,
      verifyModeLabel: getVerifyModeLabel(verifyMode),
      workCode,
      rawPayload: line,
    });
  }

  return { records, skipped };
}

/**
 * Parse POST /iclock/cdata?table=OPERLOG raw body (OPLOG / USER / FP / FACE / BIODATA).
 */
export function parseOperLogPayload(rawBody) {
  const text = String(rawBody || '');
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const entries = lines.map((line) => {
    const spaceIdx = line.search(/[\t ]/);
    const type = spaceIdx > 0 ? line.slice(0, spaceIdx) : 'UNKNOWN';
    return { type, raw: line };
  });

  return { count: entries.length, entries };
}
