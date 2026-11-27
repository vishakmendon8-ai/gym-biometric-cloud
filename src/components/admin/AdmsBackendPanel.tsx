import React, { useEffect, useState } from 'react';
import {
  AdmsAttendanceRow,
  AdmsDeviceRow,
  AdmsRawLogRow,
  AdmsServerHealth,
  fetchAdmsAttendance,
  fetchAdmsDevices,
  fetchAdmsHealth,
  fetchAdmsRawLogs,
  registerAdmsDevice,
} from '../../services/admsBackendClient';
import { BIOMETRIC_CONFIG } from '../../config/biometricConfig';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Database,
  Fingerprint,
  Plus,
  RefreshCw,
  Server,
  Settings2,
  Terminal,
  Wifi,
  WifiOff,
} from 'lucide-react';

function fmtTime(iso?: string | null) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export const AdmsBackendPanel: React.FC = () => {
  const [serverUrl, setServerUrl] = useState<string>(BIOMETRIC_CONFIG.serverUrl);
  const [apiToken, setApiToken] = useState<string>(BIOMETRIC_CONFIG.apiToken);
  const [showServerOverride, setShowServerOverride] = useState(false);
  const [copiedWss, setCopiedWss] = useState(false);
  const [loading, setLoading] = useState(false);

  const [health, setHealth] = useState<AdmsServerHealth | null>(null);
  const [devices, setDevices] = useState<AdmsDeviceRow[]>([]);
  const [attendance, setAttendance] = useState<AdmsAttendanceRow[]>([]);
  const [attendanceTotal, setAttendanceTotal] = useState(0);
  const [rawLogs, setRawLogs] = useState<AdmsRawLogRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters for GET /api/attendance
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const [filterEmp, setFilterEmp] = useState('');
  const [filterSn, setFilterSn] = useState('');

  // Quick register device on ADMS backend (status stays offline until real heartbeat)
  const [regSn, setRegSn] = useState<string>(BIOMETRIC_CONFIG.defaultTerminal.serialNumber);
  const [regName, setRegName] = useState<string>(
    `${BIOMETRIC_CONFIG.defaultTerminal.name} (${BIOMETRIC_CONFIG.defaultTerminal.p2pCloudId})`
  );
  const [regLocation, setRegLocation] = useState('Main Entrance');
  const [regIp, setRegIp] = useState<string>(BIOMETRIC_CONFIG.defaultTerminal.ipAddress);
  const [regSaving, setRegSaving] = useState(false);
  const [regMsg, setRegMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const derivedWssUrl = `${serverUrl
    .trim()
    .replace(/\/+$/, '')
    .replace(/^https:\/\//i, 'wss://')
    .replace(/^http:\/\//i, 'ws://')}/biometric`;

  const handleCopyWss = async () => {
    try {
      await navigator.clipboard.writeText(derivedWssUrl);
      setCopiedWss(true);
      setTimeout(() => setCopiedWss(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const loadAll = async (targetUrl = serverUrl) => {
    const cleaned = targetUrl.trim();
    if (!cleaned) return;
    setLoading(true);
    setErrorMsg(null);

    const h = await fetchAdmsHealth(cleaned);
    setHealth(h);

    if (!h.ok) {
      setErrorMsg(h.error || 'Unable to connect to biometric backend server.');
      setDevices([]);
      setAttendance([]);
      setRawLogs([]);
      setLoading(false);
      return;
    }

    const [devRes, attRes, rawRes] = await Promise.all([
      fetchAdmsDevices(cleaned, apiToken),
      fetchAdmsAttendance(
        cleaned,
        {
          from: filterFrom || undefined,
          to: filterTo || undefined,
          employee_code: filterEmp.trim() || undefined,
          device_sn: filterSn.trim() || undefined,
          limit: 100,
        },
        apiToken
      ),
      fetchAdmsRawLogs(cleaned, apiToken, 20),
    ]);

    if (devRes.ok) {
      setDevices(devRes.devices);
    }

    if (attRes.ok) {
      setAttendance(attRes.data);
      setAttendanceTotal(attRes.total);
    }

    if (rawRes.ok) {
      setRawLogs(rawRes.logs);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleRegisterDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegSaving(true);
    setRegMsg(null);
    const res = await registerAdmsDevice(
      serverUrl,
      {
        serial_number: regSn.trim(),
        name: regName.trim(),
        location: regLocation.trim(),
        ip_address: regIp.trim() || undefined,
      },
      apiToken
    );
    if (!res.ok) {
      setRegMsg({ ok: false, text: res.error || 'Failed to register device.' });
    } else {
      setRegMsg({
        ok: true,
        text: `Device SN ${regSn.trim()} registered as OFFLINE on backend. It will automatically switch to ONLINE when the physical machine sends a real heartbeat.`,
      });
      await loadAll();
    }
    setRegSaving(false);
  };

  return (
    <div className="space-y-5">
      {/* Built-in Cloud Backend Status Bar (Developer Maintenance Only) */}
      <div className="bg-white rounded-2xl p-5 border border-[#DCE3E8] shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E9ECEF]">
          <div>
            <h3 className="text-sm font-black text-[#252A30] flex items-center gap-2">
              <Server className="w-4 h-4 text-[#E5B82A]" />
              <span>Built-In Biometric Cloud Server</span>
            </h3>
            <p className="text-xs text-[#84909A]">
              Pre-configured inside the app (<code className="text-[#252A30]">{serverUrl}</code>) — clients never need to fill in or maintain server details.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                health?.ok
                  ? 'bg-[#36A875]/15 text-[#36A875] border-[#36A875]/30'
                  : 'bg-[#DC5555]/10 text-[#DC5555] border-[#DC5555]/30'
              }`}
            >
              {health === null
                ? 'Checking...'
                : health.ok
                ? `Cloud Server Online${health.database ? ` (${health.database.toUpperCase()})` : ''}`
                : 'Server Offline'}
            </span>
            <button
              onClick={() => loadAll()}
              disabled={loading}
              className="py-1.5 px-3 rounded-xl bg-[#252A30] text-[#FFD447] font-black text-xs flex items-center gap-1.5 hover:bg-[#313740] transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowServerOverride((v) => !v)}
              className="py-1.5 px-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-[#5A646E] hover:text-[#252A30] font-bold text-[11px] flex items-center gap-1"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{showServerOverride ? 'Hide Override' : 'Override URL'}</span>
            </button>
          </div>
        </div>

        {/* One-time Installer Reference for Machine WebSocket URL */}
        <div className="p-3.5 rounded-xl bg-[#252A30] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-[#FFD447]">
              One-Time Hardware Installer Endpoint (WSS)
            </p>
            <p className="font-mono text-xs text-white/95 truncate mt-0.5">{derivedWssUrl}</p>
          </div>
          <button
            type="button"
            onClick={handleCopyWss}
            className="px-3 py-1.5 rounded-lg bg-[#FFD447] text-[#252A30] font-black text-xs flex items-center gap-1.5 shrink-0 hover:bg-[#F5C62F] transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copiedWss ? 'Copied!' : 'Copy WSS URL'}</span>
          </button>
        </div>

        {/* Optional Developer Override Fields (Collapsed by default) */}
        {showServerOverride && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs pt-1">
            <div className="md:col-span-6">
              <label className="block font-bold text-[#252A30] mb-1">Override Backend URL (Temporary)</label>
              <input
                type="url"
                placeholder="https://dream-gym-1.onrender.com"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] font-mono font-bold text-[#252A30] focus:outline-none focus:border-[#FFD447]"
              />
            </div>
            <div className="md:col-span-4">
              <label className="block font-bold text-[#252A30] mb-1">
                API Secret (Set via VITE_BIOMETRIC_API_SECRET)
              </label>
              <input
                type="password"
                placeholder="Configured via env var"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] font-mono text-[#252A30] focus:outline-none focus:border-[#FFD447]"
              />
            </div>
            <div className="md:col-span-2 flex items-end">
              <button
                onClick={() => loadAll()}
                disabled={loading}
                className="w-full py-2 px-3 rounded-xl bg-[#252A30] text-[#FFD447] font-black text-xs flex items-center justify-center gap-1.5 hover:bg-[#313740] transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Apply</span>
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-[#DC5555]/10 border border-[#DC5555]/30 text-xs font-semibold text-[#DC5555] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Devices List + Quick Registration */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Register Device Form */}
        <div className="xl:col-span-4 bg-white rounded-2xl p-5 border border-[#DCE3E8] shadow-xs space-y-3">
          <h4 className="text-xs font-black text-[#252A30] uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-[#E5B82A]" />
            <span>Pre-Register Secureye Device on Backend</span>
          </h4>
          <p className="text-[11px] text-[#84909A]">
            Pre-filled with your Secureye serial number and local IP from your screenshot. Device stays <strong>Offline</strong> until a real hardware heartbeat arrives.
          </p>

          {regMsg && (
            <div
              className={`p-2.5 rounded-xl text-xs font-semibold border flex items-start gap-2 ${
                regMsg.ok
                  ? 'bg-[#36A875]/10 border-[#36A875]/30 text-[#237A54]'
                  : 'bg-[#DC5555]/10 border-[#DC5555]/30 text-[#DC5555]'
              }`}
            >
              {regMsg.ok ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{regMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleRegisterDevice} className="space-y-2.5 text-xs">
            <div>
              <label className="block font-bold text-[#252A30] mb-1">Serial Number *</label>
              <input
                type="text"
                required
                value={regSn}
                onChange={(e) => setRegSn(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-[#252A30] mb-1">Device Name</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] font-semibold"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-[#252A30] mb-1">Location</label>
                <input
                  type="text"
                  value={regLocation}
                  onChange={(e) => setRegLocation(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8]"
                />
              </div>
              <div>
                <label className="block font-bold text-[#252A30] mb-1">Local IP</label>
                <input
                  type="text"
                  value={regIp}
                  onChange={(e) => setRegIp(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] font-mono"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={regSaving || !health?.ok}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-[#FFD447] to-[#F5C62F] text-[#252A30] font-black text-xs disabled:opacity-50"
            >
              {regSaving ? 'Registering...' : 'Register Device on ADMS Server'}
            </button>
          </form>
        </div>

        {/* Live Devices Table */}
        <div className="xl:col-span-8 bg-white rounded-2xl p-5 border border-[#DCE3E8] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E9ECEF]">
            <h4 className="text-xs font-black text-[#252A30] uppercase tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#E5B82A]" />
              <span>Backend Devices List (GET /api/devices)</span>
            </h4>
            <span className="text-xs font-bold text-[#84909A]">{devices.length} Device(s)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F5F6F2] border-b border-[#DCE3E8] text-[10px] font-bold text-[#84909A] uppercase">
                  <th className="py-2.5 px-3">Serial Number</th>
                  <th className="py-2.5 px-3">Name & Location</th>
                  <th className="py-2.5 px-3">IP</th>
                  <th className="py-2.5 px-3">Last Seen</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9ECEF]">
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-[#84909A]">
                      No devices listed on backend yet.
                    </td>
                  </tr>
                ) : (
                  devices.map((dev) => (
                    <tr key={dev.serial_number} className="hover:bg-[#F5F6F2]/50">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#252A30]">
                        {dev.serial_number}
                      </td>
                      <td className="py-2.5 px-3">
                        <p className="font-bold text-[#252A30]">{dev.name}</p>
                        <p className="text-[10px] text-[#84909A]">{dev.location}</p>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">{dev.ip_address || '—'}</td>
                      <td className="py-2.5 px-3 font-mono text-[11px]">{fmtTime(dev.last_seen_at)}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            dev.is_online
                              ? 'bg-[#36A875]/15 text-[#36A875]'
                              : 'bg-[#DC5555]/10 text-[#DC5555]'
                          }`}
                        >
                          {dev.is_online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                          {dev.is_online ? 'Online' : 'Offline'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Live Attendance List (GET /api/attendance) */}
      <div className="bg-white rounded-2xl p-5 border border-[#DCE3E8] shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#E9ECEF]">
          <div>
            <h4 className="text-xs font-black text-[#252A30] uppercase tracking-wider flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-[#E5B82A]" />
              <span>Backend Attendance List (GET /api/attendance — {attendanceTotal} Total)</span>
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="date"
              value={filterFrom}
              onChange={(e) => setFilterFrom(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#F5F6F2] border border-[#DCE3E8]"
            />
            <input
              type="date"
              value={filterTo}
              onChange={(e) => setFilterTo(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#F5F6F2] border border-[#DCE3E8]"
            />
            <input
              type="text"
              placeholder="Employee / User ID"
              value={filterEmp}
              onChange={(e) => setFilterEmp(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#F5F6F2] border border-[#DCE3E8] w-36"
            />
            <input
              type="text"
              placeholder="Device SN"
              value={filterSn}
              onChange={(e) => setFilterSn(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-[#F5F6F2] border border-[#DCE3E8] w-36 font-mono"
            />
            <button
              onClick={() => loadAll()}
              className="px-3 py-1.5 rounded-lg bg-[#252A30] text-[#FFD447] font-bold"
            >
              Filter
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F5F6F2] border-b border-[#DCE3E8] text-[10px] font-bold text-[#84909A] uppercase">
                <th className="py-2.5 px-3">Punch Time</th>
                <th className="py-2.5 px-3">Device SN</th>
                <th className="py-2.5 px-3">Employee / User ID</th>
                <th className="py-2.5 px-3">State</th>
                <th className="py-2.5 px-3">Verify Mode</th>
                <th className="py-2.5 px-3">Raw Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9ECEF]">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[#84909A]">
                    No punches received by the backend server yet.
                  </td>
                </tr>
              ) : (
                attendance.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F5F6F2]/50">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#252A30]">
                      {fmtTime(row.punch_time)}
                    </td>
                    <td className="py-2.5 px-3 font-mono">{row.device_sn}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#252A30]">
                      {row.employee_code}
                    </td>
                    <td className="py-2.5 px-3">{row.punch_state_label || row.punch_state}</td>
                    <td className="py-2.5 px-3">{row.verify_mode_label || row.verify_mode}</td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-[#84909A]">
                      {row.raw_payload}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Incoming Packet Log */}
      <div className="bg-white rounded-2xl p-5 border border-[#DCE3E8] shadow-xs space-y-3">
        <h4 className="text-xs font-black text-[#252A30] uppercase tracking-wider flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-[#E5B82A]" />
          <span>Raw Hardware Packet Debugger (GET /api/debug/raw)</span>
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#F5F6F2] border-b border-[#DCE3E8] text-[10px] font-bold text-[#84909A] uppercase">
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Method & Path</th>
                <th className="py-2 px-3">SN / IP</th>
                <th className="py-2 px-3">Raw Body</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9ECEF]">
              {rawLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-5 text-center text-[#84909A]">
                    Waiting for first incoming hardware packet from your Secureye device.
                  </td>
                </tr>
              ) : (
                rawLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 px-3 font-mono text-[10px] whitespace-nowrap">
                      {fmtTime(log.received_at)}
                    </td>
                    <td className="py-2 px-3 font-mono text-[11px]">
                      <strong>{log.method}</strong> {log.path}
                      {log.query_string ? `?${log.query_string}` : ''}
                    </td>
                    <td className="py-2 px-3 font-mono text-[10px]">
                      {log.device_sn || '—'} ({log.remote_ip || '—'})
                    </td>
                    <td className="py-2 px-3 font-mono text-[10px] text-[#5A646E] break-all">
                      {log.raw_body || '(empty)'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
