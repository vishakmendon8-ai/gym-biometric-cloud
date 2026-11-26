/**
 * Client for connecting the GymPro Admin Panel directly to the deployed
 * ADMS / iClock HTTP Push backend server (adms-server/) to list real
 * devices, live attendance logs, and raw hardware packets.
 */

export interface AdmsServerHealth {
  ok: boolean;
  service?: string;
  database?: string;
  firebaseSyncEnabled?: boolean;
  registeredDevices?: number;
  onlineDevices?: number;
  serverTime?: string;
  error?: string;
}

export interface AdmsDeviceRow {
  id: number;
  serial_number: string;
  name: string;
  location: string;
  last_seen_at: string | null;
  status: 'online' | 'offline';
  is_online: boolean;
  push_version?: string | null;
  ip_address?: string | null;
}

export interface AdmsAttendanceRow {
  id: number;
  device_sn: string;
  employee_code: string;
  punch_time: string;
  punch_state: string;
  punch_state_label?: string;
  verify_mode: string;
  verify_mode_label?: string;
  raw_payload: string;
  created_at: string;
}

export interface AdmsRawLogRow {
  id: number;
  method: string;
  path: string;
  query_string?: string;
  device_sn?: string | null;
  content_type?: string | null;
  remote_ip?: string | null;
  raw_body?: string | null;
  received_at: string;
}

function cleanBase(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

function buildHeaders(apiToken?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  if (apiToken && apiToken.trim()) {
    headers.Authorization = `Bearer ${apiToken.trim()}`;
  }
  return headers;
}

export async function fetchAdmsHealth(baseUrl: string): Promise<AdmsServerHealth> {
  try {
    const resp = await fetch(`${cleanBase(baseUrl)}/health`, {
      headers: { Accept: 'application/json' },
    });
    const data = await resp.json();
    if (!resp.ok) return { ok: false, error: data.error || `HTTP ${resp.status}` };
    return data as AdmsServerHealth;
  } catch (err: any) {
    return {
      ok: false,
      error:
        err?.message ||
        'Cannot reach ADMS backend server. Verify the URL, CORS, and that adms-server is running.',
    };
  }
}

export async function fetchAdmsDevices(
  baseUrl: string,
  apiToken?: string
): Promise<{ ok: boolean; devices: AdmsDeviceRow[]; error?: string }> {
  try {
    const resp = await fetch(`${cleanBase(baseUrl)}/api/devices`, {
      headers: buildHeaders(apiToken),
    });
    const data = await resp.json();
    if (!resp.ok || !data.ok) {
      return { ok: false, devices: [], error: data.error || `HTTP ${resp.status}` };
    }
    return { ok: true, devices: data.devices || [] };
  } catch (err: any) {
    return { ok: false, devices: [], error: err?.message || 'Failed to fetch devices.' };
  }
}

export async function registerAdmsDevice(
  baseUrl: string,
  payload: { serial_number: string; name: string; location: string; ip_address?: string },
  apiToken?: string
): Promise<{ ok: boolean; device?: AdmsDeviceRow; error?: string }> {
  try {
    const resp = await fetch(`${cleanBase(baseUrl)}/api/devices`, {
      method: 'POST',
      headers: buildHeaders(apiToken),
      body: JSON.stringify(payload),
    });
    const data = await resp.json();
    if (!resp.ok || !data.ok) {
      return { ok: false, error: data.error || `HTTP ${resp.status}` };
    }
    return { ok: true, device: data.device };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to register device on ADMS backend.' };
  }
}

export async function fetchAdmsAttendance(
  baseUrl: string,
  filters: { from?: string; to?: string; employee_code?: string; device_sn?: string; limit?: number },
  apiToken?: string
): Promise<{ ok: boolean; total: number; data: AdmsAttendanceRow[]; error?: string }> {
  try {
    const params = new URLSearchParams();
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    if (filters.employee_code) params.set('employee_code', filters.employee_code);
    if (filters.device_sn) params.set('device_sn', filters.device_sn);
    params.set('limit', String(filters.limit || 100));

    const resp = await fetch(`${cleanBase(baseUrl)}/api/attendance?${params.toString()}`, {
      headers: buildHeaders(apiToken),
    });
    const data = await resp.json();
    if (!resp.ok || !data.ok) {
      return { ok: false, total: 0, data: [], error: data.error || `HTTP ${resp.status}` };
    }
    return { ok: true, total: data.total || 0, data: data.data || [] };
  } catch (err: any) {
    return { ok: false, total: 0, data: [], error: err?.message || 'Failed to fetch attendance.' };
  }
}

export async function fetchAdmsRawLogs(
  baseUrl: string,
  apiToken?: string,
  limit = 25
): Promise<{ ok: boolean; logs: AdmsRawLogRow[]; error?: string }> {
  try {
    const resp = await fetch(`${cleanBase(baseUrl)}/api/debug/raw?limit=${limit}`, {
      headers: buildHeaders(apiToken),
    });
    const data = await resp.json();
    if (!resp.ok || !data.ok) {
      return { ok: false, logs: [], error: data.error || `HTTP ${resp.status}` };
    }
    return { ok: true, logs: data.logs || [] };
  } catch (err: any) {
    return { ok: false, logs: [], error: err?.message || 'Failed to fetch raw logs.' };
  }
}
