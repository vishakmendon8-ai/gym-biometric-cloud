/**
 * Built-in Biometric Server & Hardware Configuration.
 *
 * Managed inside the app (and optionally overridden at build/deploy time via
 * Vite environment variables) so gym clients never have to enter or maintain
 * server URLs, WebSocket endpoints, or API tokens.
 */

const rawServerUrl = (
  import.meta.env.VITE_BIOMETRIC_SERVER_URL ||
  import.meta.env.VITE_ADMS_API_URL ||
  'https://dream-gym-1.onrender.com'
)
  .trim()
  .replace(/\/+$/, '');

function deriveWssUrl(httpUrl: string): string {
  const customWs = (import.meta.env.VITE_BIOMETRIC_WS_URL || '').trim();
  if (customWs) return customWs;
  const wsBase = httpUrl.replace(/^https:\/\//i, 'wss://').replace(/^http:\/\//i, 'ws://');
  return `${wsBase}/biometric`;
}

export const BIOMETRIC_CONFIG = {
  /** Pre-configured cloud biometric backend URL (no client setup required). */
  serverUrl: rawServerUrl,

  /** Derived WebSocket URL for compatible Secureye / Cloud WebSocket terminals. */
  wsUrl: deriveWssUrl(rawServerUrl),

  /**
   * Optional build-time API secret (set VITE_BIOMETRIC_API_SECRET in Vercel /
   * GitHub Actions env vars — never asked from gym clients in the UI).
   */
  apiToken: (import.meta.env.VITE_BIOMETRIC_API_SECRET || '').trim(),

  /** Verified physical Secureye terminal details. */
  defaultTerminal: {
    name: import.meta.env.VITE_BIOMETRIC_DEVICE_NAME || 'Main Entrance Secureye Terminal',
    serialNumber: import.meta.env.VITE_BIOMETRIC_DEVICE_SN || '102026020002110',
    p2pCloudId: import.meta.env.VITE_BIOMETRIC_P2P_ID || 'BD77B4BE-3765DCD',
    ipAddress: import.meta.env.VITE_BIOMETRIC_DEVICE_IP || '192.168.1.101',
    p2pPort: 4000,
  },
} as const;
