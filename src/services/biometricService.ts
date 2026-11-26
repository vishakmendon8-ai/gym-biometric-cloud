import { auth } from '../firebase';
import {
  BiometricConnectionMethod,
  BiometricDevice,
  BiometricDeviceCloudConfig,
  BiometricProtocolStatus,
} from '../types/gym';

const API_BASE = (import.meta.env.VITE_BIOMETRIC_API_BASE || '/api/biometric').replace(/\/+$/, '');

export interface BackendHealthResult {
  ok: boolean;
  mode?: string;
  backend?: string;
  projectId?: string;
  firestoreReachable?: boolean;
  secureyeApiKeyConfigured?: boolean;
  webhookSecretConfigured?: boolean;
  serverTime?: string;
  error?: string;
}

export interface ConnectionTestResult {
  ok: boolean;
  connected: boolean;
  reachable?: boolean;
  authenticated?: boolean;
  connectorOnline?: boolean;
  httpStatus?: number;
  reason: string;
  testedAt?: string;
  error?: string;
}

export interface SaveDevicePayload {
  id?: string;
  name: string;
  model: string;
  serialNumber: string;
  ipAddress: string;
  port: number;
  connectionMethod: BiometricConnectionMethod;
  protocolStatus?: BiometricProtocolStatus;
  protocolType?: string;
  username?: string;
  password?: string;
  cloudConfig?: BiometricDeviceCloudConfig;
}

async function getAdminAuthHeaders(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error(
      'Not signed in to Firebase Authentication. Sign in with an Admin account to perform biometric backend operations.'
    );
  }
  const token = await user.getIdToken();
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function parseJsonResponse(resp: Response) {
  const contentType = resp.headers.get('content-type') || '';
  const text = await resp.text();

  if (!contentType.includes('application/json')) {
    throw new Error(
      `Backend endpoint returned non-JSON response (HTTP ${resp.status}). Deploy Firebase Cloud Functions ("firebase deploy --only functions,hosting") or set VITE_BIOMETRIC_API_BASE.`
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON returned by backend (HTTP ${resp.status}).`);
  }
}

export async function checkBiometricBackendHealth(): Promise<BackendHealthResult> {
  try {
    const resp = await fetch(`${API_BASE}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    const data = await parseJsonResponse(resp);
    if (!resp.ok) {
      return {
        ok: false,
        firestoreReachable: data.firestoreReachable ?? false,
        error: data.error || data.firestoreError || `HTTP ${resp.status}`,
      };
    }
    return data as BackendHealthResult;
  } catch (err: any) {
    return {
      ok: false,
      firestoreReachable: false,
      error: err?.message || 'Unable to reach Firebase biometric backend.',
    };
  }
}

export async function saveBiometricDevice(
  payload: SaveDevicePayload
): Promise<{ ok: boolean; device?: BiometricDevice; error?: string }> {
  try {
    const headers = await getAdminAuthHeaders();
    const resp = await fetch(`${API_BASE}/devices`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const data = await parseJsonResponse(resp);
    if (!resp.ok || !data.ok) {
      return { ok: false, error: data.error || `HTTP ${resp.status}` };
    }
    return { ok: true, device: data.device as BiometricDevice };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to register biometric device.' };
  }
}

export async function deleteBiometricDevice(
  deviceId: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const headers = await getAdminAuthHeaders();
    const resp = await fetch(`${API_BASE}/devices/${encodeURIComponent(deviceId)}`, {
      method: 'DELETE',
      headers,
    });
    const data = await parseJsonResponse(resp);
    if (!resp.ok || !data.ok) {
      return { ok: false, error: data.error || `HTTP ${resp.status}` };
    }
    return { ok: true };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'Failed to delete biometric device.' };
  }
}

export async function testBiometricDeviceConnection(
  deviceId: string
): Promise<ConnectionTestResult> {
  try {
    const headers = await getAdminAuthHeaders();
    const resp = await fetch(`${API_BASE}/test-connection`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ deviceId }),
    });
    const data = await parseJsonResponse(resp);
    if (!resp.ok || !data.ok) {
      return {
        ok: false,
        connected: false,
        reachable: false,
        authenticated: false,
        reason: data.error || `Backend connection test returned HTTP ${resp.status}.`,
        error: data.error || `HTTP ${resp.status}`,
      };
    }
    return data as ConnectionTestResult;
  } catch (err: any) {
    return {
      ok: false,
      connected: false,
      reachable: false,
      authenticated: false,
      reason: err?.message || 'Failed to reach backend connection test endpoint.',
      error: err?.message,
    };
  }
}
