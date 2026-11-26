import React, { useEffect, useMemo, useState } from 'react';
import { useGym } from '../../context/GymContext';
import {
  BiometricConnectionMethod,
  BiometricDevice,
} from '../../types/gym';
import {
  BackendHealthResult,
  ConnectionTestResult,
  checkBiometricBackendHealth,
  deleteBiometricDevice,
  saveBiometricDevice,
  testBiometricDeviceConnection,
} from '../../services/biometricService';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Cpu,
  Edit3,
  Fingerprint,
  KeyRound,
  Link2,
  Lock,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  Save,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Users,
  Wifi,
  WifiOff,
  XCircle,
} from 'lucide-react';
import { AdmsBackendPanel } from './AdmsBackendPanel';

type SubTab = 'devices' | 'adms_server' | 'mapping' | 'diagnostics';

function formatTimestamp(iso?: string | null): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function getDeviceStatusBadge(status: BiometricDevice['status']) {
  switch (status) {
    case 'connected':
      return {
        label: 'Connected',
        cls: 'bg-[#36A875]/15 text-[#36A875] border-[#36A875]/30',
        dot: 'bg-[#36A875]',
      };
    case 'auth_failed':
      return {
        label: 'Auth Failed',
        cls: 'bg-[#DC5555]/15 text-[#DC5555] border-[#DC5555]/30',
        dot: 'bg-[#DC5555]',
      };
    case 'error':
      return {
        label: 'Error',
        cls: 'bg-[#DC5555]/15 text-[#DC5555] border-[#DC5555]/30',
        dot: 'bg-[#DC5555]',
      };
    case 'disconnected':
      return {
        label: 'Disconnected',
        cls: 'bg-[#E5A024]/15 text-[#B57B14] border-[#E5A024]/30',
        dot: 'bg-[#E5A024]',
      };
    default:
      return {
        label: 'Unverified',
        cls: 'bg-[#84909A]/15 text-[#5A646E] border-[#DCE3E8]',
        dot: 'bg-[#84909A]',
      };
  }
}

export const BiometricView: React.FC = () => {
  const {
    members,
    attendance,
    biometricDevices,
    biometricSyncLogs,
    firebaseUser,
    signInAdmin,
    signOutAdmin,
    linkMemberBiometricId,
    firebaseConnected,
    firestoreError,
  } = useGym();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('devices');

  // Admin Firebase Auth inline sign-in state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Backend health probe state
  const [backendHealth, setBackendHealth] = useState<BackendHealthResult | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  // Device registration / configuration form state (Direct Cloud Only)
  // Pre-filled with verified Secureye hardware values from device screen (no invented API URLs or credentials)
  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState('Main Entrance Secureye Terminal');
  const [deviceModel, setDeviceModel] = useState('Secureye P2P Biometric (Unidentified Model)');
  const [serialNumber, setSerialNumber] = useState('102026020002110');
  const [ipAddress, setIpAddress] = useState('192.168.1.101');
  const [port, setPort] = useState('4000');
  const [connectionMethod, setConnectionMethod] =
    useState<BiometricConnectionMethod>('secureye_cloud_webhook');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [p2pCloudId, setP2pCloudId] = useState('BD77B4BE-3765DCD');
  const [cloudApiUrl, setCloudApiUrl] = useState('');
  const [pushIntervalSec, setPushIntervalSec] = useState('300');

  const [savingDevice, setSavingDevice] = useState(false);
  const [deviceFeedback, setDeviceFeedback] = useState<{
    type: 'success' | 'error' | 'warning';
    message: string;
  } | null>(null);

  // Connection test state keyed by deviceId
  const [testingDeviceId, setTestingDeviceId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, ConnectionTestResult>>({});

  // Member biometric ID mapping state
  const [memberSearch, setMemberSearch] = useState('');
  const [memberBiometricDrafts, setMemberBiometricDrafts] = useState<Record<string, string>>({});
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [mappingFeedback, setMappingFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const runHealthCheck = async () => {
    setCheckingHealth(true);
    const res = await checkBiometricBackendHealth();
    setBackendHealth(res);
    setCheckingHealth(false);
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    setAuthError(null);
    const res = await signInAdmin(adminEmail, adminPassword);
    if (!res.ok) {
      setAuthError(res.error || 'Authentication failed.');
    } else {
      setAdminPassword('');
    }
    setAuthBusy(false);
  };

  const resetDeviceForm = () => {
    setEditingDeviceId(null);
    setDeviceName('');
    setDeviceModel('');
    setSerialNumber('');
    setIpAddress('');
    setPort('443');
    setUsername('');
    setPassword('');
    setP2pCloudId('');
    setCloudApiUrl('');
    setPushIntervalSec('300');
  };

  const startEditingDevice = (dev: BiometricDevice) => {
    setEditingDeviceId(dev.id);
    setDeviceName(dev.name);
    setDeviceModel(dev.model);
    setSerialNumber(dev.serialNumber);
    setIpAddress(dev.ipAddress || '');
    setPort(String(dev.port || 443));
    setConnectionMethod(dev.connectionMethod);
    setUsername(dev.username || '');
    setPassword('');
    setP2pCloudId(dev.cloudConfig?.p2pCloudId || '');
    setCloudApiUrl(dev.cloudConfig?.cloudApiUrl || '');
    setPushIntervalSec(String(dev.cloudConfig?.pushIntervalSec || 300));
    setDeviceFeedback(null);
  };

  const handleSaveDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDevice(true);
    setDeviceFeedback(null);

    const parsedPort = Number(port);
    const res = await saveBiometricDevice({
      id: editingDeviceId || undefined,
      name: deviceName.trim(),
      model: deviceModel.trim() || 'Unidentified — pending verification',
      serialNumber: serialNumber.trim(),
      ipAddress: ipAddress.trim(),
      port: Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 443,
      connectionMethod,
      username: username.trim(),
      password: password.trim() || undefined,
      cloudConfig: {
        p2pCloudId: p2pCloudId.trim(),
        cloudApiUrl: cloudApiUrl.trim(),
        pushIntervalSec: Number(pushIntervalSec) || 300,
      },
    });

    if (!res.ok) {
      setDeviceFeedback({
        type: 'error',
        message: res.error || 'Failed to save biometric device.',
      });
    } else {
      setDeviceFeedback({
        type: 'success',
        message: `Cloud device "${res.device?.name}" saved with status UNVERIFIED. Click "Test Connection" to run a real Firebase backend check.`,
      });
      resetDeviceForm();
    }
    setSavingDevice(false);
  };

  const handleDeleteDevice = async (dev: BiometricDevice) => {
    const res = await deleteBiometricDevice(dev.id);
    if (!res.ok) {
      setDeviceFeedback({
        type: 'error',
        message: res.error || 'Failed to delete device.',
      });
    } else {
      setDeviceFeedback({
        type: 'warning',
        message: `Removed Secureye device "${dev.name}" (${dev.serialNumber}).`,
      });
      if (editingDeviceId === dev.id) resetDeviceForm();
    }
  };

  const handleTestConnection = async (deviceId: string) => {
    setTestingDeviceId(deviceId);
    setDeviceFeedback(null);
    const result = await testBiometricDeviceConnection(deviceId);
    setTestResults((prev) => ({ ...prev, [deviceId]: result }));
    setTestingDeviceId(null);
  };

  const handleSaveMemberBiometricId = async (memberId: string, currentVal: string) => {
    setSavingMemberId(memberId);
    setMappingFeedback(null);
    const draft =
      memberBiometricDrafts[memberId] !== undefined
        ? memberBiometricDrafts[memberId]
        : currentVal;
    const res = await linkMemberBiometricId(memberId, draft);
    if (!res.ok) {
      setMappingFeedback({
        type: 'error',
        message: res.error || 'Failed to update member biometric User ID.',
      });
    } else {
      setMappingFeedback({
        type: 'success',
        message: draft.trim()
          ? `Linked Secureye Biometric User ID "${draft.trim()}" to member ${memberId} in Firestore.`
          : `Cleared Biometric User ID mapping for member ${memberId}.`,
      });
    }
    setSavingMemberId(null);
  };

  // Diagnostics aggregations (strictly real data)
  const realSecureyeAttendance = useMemo(
    () => attendance.filter((a) => a.source === 'secureye'),
    [attendance]
  );

  const lastSuccessfulComm = useMemo(() => {
    const times = biometricDevices
      .map((d) => d.lastCommunicationAt)
      .filter((t): t is string => Boolean(t))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return times[0] || null;
  }, [biometricDevices]);

  const lastAttendanceReceived = useMemo(() => {
    const times = biometricDevices
      .map((d) => d.lastAttendanceAt)
      .filter((t): t is string => Boolean(t))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    return times[0] || realSecureyeAttendance[0]?.timestamp || null;
  }, [biometricDevices, realSecureyeAttendance]);

  const syncErrors = useMemo(() => {
    return biometricSyncLogs.filter((l) => l.level === 'error' || l.level === 'warning');
  }, [biometricSyncLogs]);

  const linkedMembersCount = useMemo(
    () =>
      members.filter(
        (m) =>
          m.biometricRegistered &&
          m.biometricId &&
          m.biometricId !== 'NONE' &&
          m.biometricId !== 'BIO-FP-UNREGISTERED'
      ).length,
    [members]
  );

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        (m.biometricId || '').toLowerCase().includes(q)
    );
  }, [members, memberSearch]);

  const webhookEndpointDisplay =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/biometric/webhook`
      : 'https://gym001-50a97.web.app/api/biometric/webhook';

  return (
    <div className="space-y-6">
      {/* Top Status & Firebase Auth Strip */}
      <div className="bg-white rounded-2xl p-4 border border-[#DCE3E8] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#252A30] text-[#FFD447] flex items-center justify-center shrink-0">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-black text-[#252A30]">
                Secureye Direct Cloud Biometric Integration
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                  backendHealth?.ok
                    ? 'bg-[#36A875]/15 text-[#36A875] border-[#36A875]/30'
                    : 'bg-[#DC5555]/10 text-[#DC5555] border-[#DC5555]/30'
                }`}
              >
                {backendHealth === null
                  ? 'Checking Backend...'
                  : backendHealth.ok
                  ? 'Firebase Backend Online'
                  : 'Firebase Backend Unreachable'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FFF8E7] text-[#8A6112] border border-[#FFD447]/50">
                Direct Cloud Only (No PC) • Awaiting Official Secureye Cloud API
              </span>
            </div>
            <p className="text-xs text-[#84909A] mt-0.5">
              Zero local computer / zero local connector — devices remain Unverified/Disconnected until official Secureye Cloud API or direct push is verified.
            </p>
          </div>
        </div>

        {/* Firebase Authentication Box */}
        <div className="flex items-center gap-2 flex-wrap">
          {firebaseUser ? (
            <div className="flex items-center gap-2.5 bg-[#F5F6F2] border border-[#DCE3E8] rounded-xl px-3 py-1.5">
              <ShieldCheck className="w-4 h-4 text-[#36A875] shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-[#252A30] leading-tight">{firebaseUser.email}</p>
                <p className="text-[10px] text-[#84909A]">Firebase Auth Verified</p>
              </div>
              <button
                onClick={signOutAdmin}
                className="ml-1 px-2.5 py-1 rounded-lg bg-white border border-[#DCE3E8] text-[11px] font-bold text-[#252A30] hover:border-[#DC5555] hover:text-[#DC5555] flex items-center gap-1 transition-all"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleAdminSignIn} className="flex flex-wrap items-center gap-2">
              <input
                type="email"
                required
                placeholder="Firebase Admin email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-xs font-semibold text-[#252A30] w-44 focus:outline-none focus:border-[#FFD447]"
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-xs font-semibold text-[#252A30] w-32 focus:outline-none focus:border-[#FFD447]"
              />
              <button
                type="submit"
                disabled={authBusy}
                className="px-3.5 py-1.5 rounded-xl bg-[#252A30] text-[#FFD447] text-xs font-black flex items-center gap-1.5 hover:bg-[#313740] transition-all disabled:opacity-50"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{authBusy ? 'Signing In...' : 'Admin Sign In'}</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {authError && (
        <div className="p-3 rounded-xl bg-[#DC5555]/10 border border-[#DC5555]/30 text-xs font-semibold text-[#DC5555] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#DCE3E8] pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('devices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'devices'
                ? 'bg-[#252A30] text-[#FFD447] shadow-xs'
                : 'bg-white text-[#5A646E] border border-[#DCE3E8] hover:border-[#FFD447]'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Biometric Devices ({biometricDevices.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('adms_server')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'adms_server'
                ? 'bg-[#252A30] text-[#FFD447] shadow-xs'
                : 'bg-white text-[#5A646E] border border-[#DCE3E8] hover:border-[#FFD447]'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>ADMS Live Server</span>
          </button>

          <button
            onClick={() => setActiveSubTab('mapping')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'mapping'
                ? 'bg-[#252A30] text-[#FFD447] shadow-xs'
                : 'bg-white text-[#5A646E] border border-[#DCE3E8] hover:border-[#FFD447]'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Member User ID Mapping ({linkedMembersCount}/{members.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('diagnostics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'diagnostics'
                ? 'bg-[#252A30] text-[#FFD447] shadow-xs'
                : 'bg-white text-[#5A646E] border border-[#DCE3E8] hover:border-[#FFD447]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Diagnostics & Sync Logs</span>
            {syncErrors.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-[#DC5555] text-white text-[10px] font-black">
                {syncErrors.length}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={runHealthCheck}
          disabled={checkingHealth}
          className="px-3 py-1.5 rounded-xl bg-white border border-[#DCE3E8] hover:border-[#FFD447] text-xs font-bold text-[#252A30] flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin' : ''}`} />
          <span>Refresh Backend Status</span>
        </button>
      </div>

      {/* ================================================================= */}
      {/* TAB: ADMS LIVE BACKEND SERVER (LIST DEVICES, PUNCHES & RAW LOGS)  */}
      {/* ================================================================= */}
      {activeSubTab === 'adms_server' && <AdmsBackendPanel />}

      {/* ================================================================= */}
      {/* TAB 1: DEVICES & CONNECTION ARCHITECTURE                          */}
      {/* ================================================================= */}
      {activeSubTab === 'devices' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left: Device Registration & Connection Form */}
          <div className="xl:col-span-5 bg-white rounded-2xl p-5 border border-[#DCE3E8] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E9ECEF]">
              <div>
                <h3 className="text-sm font-black text-[#252A30] flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#E5B82A]" />
                  <span>{editingDeviceId ? 'Edit Secureye Device' : 'Register Secureye Device'}</span>
                </h3>
                <p className="text-[11px] text-[#84909A] mt-0.5">
                  Direct Cloud-Only architecture — zero local PC, Raspberry Pi, or LAN connector.
                </p>
              </div>
              {editingDeviceId && (
                <button
                  onClick={resetDeviceForm}
                  className="text-xs font-bold text-[#84909A] hover:text-[#252A30]"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {deviceFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 border ${
                  deviceFeedback.type === 'success'
                    ? 'bg-[#36A875]/10 border-[#36A875]/30 text-[#237A54]'
                    : deviceFeedback.type === 'warning'
                    ? 'bg-[#FFF8E7] border-[#FFD447]/60 text-[#8A6112]'
                    : 'bg-[#DC5555]/10 border-[#DC5555]/30 text-[#DC5555]'
                }`}
              >
                {deviceFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{deviceFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveDevice} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-[#252A30] mb-1">Device Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Entrance Secureye Terminal"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] font-semibold text-[#252A30] focus:outline-none focus:border-[#FFD447]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#252A30] mb-1">Device Model</label>
                  <input
                    type="text"
                    placeholder="e.g. S-FB6K, S-B251CB (or leave blank)"
                    value={deviceModel}
                    onChange={(e) => setDeviceModel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] font-semibold text-[#252A30] focus:outline-none focus:border-[#FFD447]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#252A30] mb-1">Serial Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="From back sticker / System Info"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] font-mono font-bold text-[#252A30] focus:outline-none focus:border-[#FFD447]"
                  />
                </div>
              </div>

              {/* Direct Cloud Connection Method Selection */}
              <div>
                <label className="block font-bold text-[#252A30] mb-1">Direct Cloud Mode *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConnectionMethod('secureye_cloud_api')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      connectionMethod === 'secureye_cloud_api'
                        ? 'bg-[#252A30] text-white border-[#252A30]'
                        : 'bg-[#F5F6F2] text-[#252A30] border-[#DCE3E8] hover:border-[#FFD447]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-xs">
                      <Cloud className="w-3.5 h-3.5 text-[#FFD447]" />
                      <span>Cloud API Sync</span>
                    </div>
                    <p
                      className={`text-[10px] mt-0.5 ${
                        connectionMethod === 'secureye_cloud_api'
                          ? 'text-white/75'
                          : 'text-[#84909A]'
                      }`}
                    >
                      Official Secureye Cloud REST API (Scheduled)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConnectionMethod('secureye_cloud_webhook')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      connectionMethod === 'secureye_cloud_webhook'
                        ? 'bg-[#252A30] text-white border-[#252A30]'
                        : 'bg-[#F5F6F2] text-[#252A30] border-[#DCE3E8] hover:border-[#FFD447]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-black text-xs">
                      <Wifi className="w-3.5 h-3.5 text-[#FFD447]" />
                      <span>Cloud Webhook / Push</span>
                    </div>
                    <p
                      className={`text-[10px] mt-0.5 ${
                        connectionMethod === 'secureye_cloud_webhook'
                          ? 'text-white/75'
                          : 'text-[#84909A]'
                      }`}
                    >
                      Real-Time HTTPS Push to Firebase
                    </p>
                  </button>
                </div>
              </div>

              {/* Optional Device Network Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-[#252A30] mb-1">
                    Device WLAN IP (Reference)
                  </label>
                  <input
                    type="text"
                    placeholder="Optional (e.g. 192.168.1.201)"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] font-mono font-bold text-[#252A30] focus:outline-none focus:border-[#FFD447]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#252A30] mb-1">Cloud Port</label>
                  <input
                    type="number"
                    min={1}
                    max={65535}
                    placeholder="443"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] font-mono font-bold text-[#252A30] focus:outline-none focus:border-[#FFD447]"
                  />
                </div>
              </div>

              {/* Cloud Credentials (Stored Server-Side Only) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#252A30] mb-1">Cloud Account / User</label>
                  <input
                    type="text"
                    placeholder="Official Secureye Cloud user"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] font-semibold text-[#252A30] focus:outline-none focus:border-[#FFD447]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#252A30] mb-1 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#84909A]" />
                    <span>API Password / Token</span>
                  </label>
                  <input
                    type="password"
                    placeholder={editingDeviceId ? 'Leave blank to keep existing' : 'Stored server-side only'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] font-semibold text-[#252A30] focus:outline-none focus:border-[#FFD447]"
                  />
                </div>
              </div>

              {/* Cloud / P2P Configuration */}
              <div className="p-3.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] space-y-3">
                <p className="text-[11px] font-black text-[#252A30] uppercase tracking-wider flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-[#E5B82A]" />
                  <span>Secureye Cloud / P2P Configuration</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#252A30] mb-1">P2P Cloud ID</label>
                    <input
                      type="text"
                      placeholder="Shown on Secureye machine"
                      value={p2pCloudId}
                      onChange={(e) => setP2pCloudId(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#DCE3E8] font-mono text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#252A30] mb-1">Sync Interval (sec)</label>
                    <input
                      type="number"
                      min={60}
                      max={3600}
                      value={pushIntervalSec}
                      onChange={(e) => setPushIntervalSec(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#DCE3E8] font-mono text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-[#252A30] mb-1">
                    Official Secureye Cloud API URL (Provided by Vendor)
                  </label>
                  <input
                    type="url"
                    placeholder="Enter official Secureye / ONtime Cloud API endpoint"
                    value={cloudApiUrl}
                    onChange={(e) => setCloudApiUrl(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#DCE3E8] font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#84909A] mb-1">
                    Firebase Cloud Webhook Endpoint (HTTPS)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={webhookEndpointDisplay}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/70 border border-[#DCE3E8] font-mono text-[11px] text-[#5A646E] select-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingDevice || !firebaseUser}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#FFD447] to-[#F5C62F] text-[#252A30] font-black text-xs flex items-center justify-center gap-2 hover:shadow-md transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>
                  {savingDevice
                    ? 'Saving to Firebase...'
                    : !firebaseUser
                    ? 'Sign in as Firebase Admin to Save'
                    : editingDeviceId
                    ? 'Update Cloud Device Configuration'
                    : 'Register Cloud Biometric Device'}
                </span>
              </button>
            </form>
          </div>

          {/* Right: Registered Devices List & Live Test Connection Results */}
          <div className="xl:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-[#DCE3E8] shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#E9ECEF] mb-4">
                <div>
                  <h3 className="text-sm font-black text-[#252A30]">
                    Registered Secureye Cloud Biometric Devices
                  </h3>
                  <p className="text-[11px] text-[#84909A]">
                    Direct Cloud-to-Cloud only — status reflects real Firebase backend verification, never simulated.
                  </p>
                </div>
                <span className="text-xs font-bold text-[#84909A]">
                  {biometricDevices.length} Device{biometricDevices.length === 1 ? '' : 's'}
                </span>
              </div>

              {biometricDevices.length === 0 ? (
                <div className="p-8 rounded-2xl bg-[#F5F6F2] border border-dashed border-[#DCE3E8] text-center space-y-2">
                  <Cpu className="w-8 h-8 text-[#84909A] mx-auto" />
                  <p className="text-xs font-black text-[#252A30]">
                    No Secureye cloud devices registered yet
                  </p>
                  <p className="text-[11px] text-[#84909A] max-w-md mx-auto">
                    Sign in as a Firebase Admin and register your Secureye machine using its Serial Number and official Cloud API / Webhook configuration. Then click <strong>Test Connection</strong> to run a real Firebase backend check.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {biometricDevices.map((dev) => {
                    const badge = getDeviceStatusBadge(dev.status);
                    const testRes = testResults[dev.id];
                    const isTesting = testingDeviceId === dev.id;

                    return (
                      <div
                        key={dev.id}
                        className="p-4 rounded-2xl bg-[#F5F6F2]/70 border border-[#DCE3E8] space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-black text-[#252A30]">{dev.name}</h4>
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${badge.cls}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                {badge.label}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-[#DCE3E8] text-[#5A646E]">
                                {dev.connectionMethod === 'secureye_cloud_webhook'
                                  ? 'Direct Cloud Webhook'
                                  : 'Official Cloud API Sync'}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#84909A] font-mono mt-1">
                              Model: <strong className="text-[#252A30]">{dev.model}</strong> • SN:{' '}
                              <strong className="text-[#252A30]">{dev.serialNumber}</strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleTestConnection(dev.id)}
                              disabled={isTesting || !firebaseUser}
                              className="px-3 py-1.5 rounded-xl bg-[#252A30] text-[#FFD447] text-xs font-black flex items-center gap-1.5 hover:bg-[#313740] transition-all disabled:opacity-50"
                            >
                              <RefreshCw
                                className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`}
                              />
                              <span>{isTesting ? 'Testing...' : 'Test Connection'}</span>
                            </button>
                            <button
                              onClick={() => startEditingDevice(dev)}
                              className="p-1.5 rounded-xl bg-white border border-[#DCE3E8] text-[#5A646E] hover:text-[#252A30] hover:border-[#FFD447]"
                              title="Edit device"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDevice(dev)}
                              disabled={!firebaseUser}
                              className="p-1.5 rounded-xl bg-white border border-[#DCE3E8] text-[#DC5555] hover:bg-[#FFF0F0] disabled:opacity-50"
                              title="Delete device"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div className="p-2.5 rounded-xl bg-white border border-[#DCE3E8]">
                            <span className="text-[#84909A] block">IP & Port</span>
                            <span className="font-mono font-bold text-[#252A30]">
                              {dev.ipAddress || 'Not set'}:{dev.port}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-[#DCE3E8]">
                            <span className="text-[#84909A] block">Last Sync</span>
                            <span className="font-bold text-[#252A30]">
                              {formatTimestamp(dev.lastSyncAt)}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-[#DCE3E8]">
                            <span className="text-[#84909A] block">Registered Users</span>
                            <span className="font-black text-[#252A30] flex items-center gap-1">
                              <Users className="w-3 h-3 text-[#84909A]" />
                              {dev.registeredUsersCount || 0}
                            </span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-white border border-[#DCE3E8]">
                            <span className="text-[#84909A] block">Auth / Credentials</span>
                            <span className="font-bold text-[#252A30] capitalize">
                              {dev.authStatus} {dev.hasPassword ? '• Secret Saved' : ''}
                            </span>
                          </div>
                        </div>

                        {/* Real Test Result or Last Error */}
                        {(testRes || dev.lastError) && (
                          <div
                            className={`p-3 rounded-xl text-xs border flex items-start gap-2 ${
                              testRes?.connected
                                ? 'bg-[#36A875]/10 border-[#36A875]/30 text-[#237A54]'
                                : 'bg-[#DC5555]/10 border-[#DC5555]/30 text-[#B43434]'
                            }`}
                          >
                            {testRes?.connected ? (
                              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                            ) : (
                              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <p className="font-bold">
                                {testRes
                                  ? testRes.connected
                                    ? 'Backend Connection Test Succeeded'
                                    : 'Backend Connection Test Failed — Device NOT Connected'
                                  : 'Last Device Error'}
                              </p>
                              <p className="text-[11px] mt-0.5">
                                {testRes?.reason || dev.lastError}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Direct Cloud-Only API Verification Notice */}
            <div className="bg-[#FFF8E7] rounded-2xl p-4 border border-[#FFD447]/60 space-y-2">
              <h4 className="text-xs font-black text-[#252A30] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-[#C68A12]" />
                <span>Official Secureye Cloud / P2P API Required</span>
              </h4>
              <p className="text-xs text-[#5A646E] leading-relaxed">
                Secureye&apos;s &ldquo;P2P Cloud Online&rdquo; connects to Secureye&apos;s proprietary ONtime Cloud platform and does not publish a public third-party REST API or webhook spec. To complete direct cloud-only sync (with zero PC at the gym), obtain the official ONtime Cloud API documentation/credentials from Secureye, or verify whether your machine&apos;s <strong>Menu → Comm → Cloud Server Setting</strong> lets you point directly to a custom HTTPS/Push URL.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: MEMBER BIOMETRIC USER ID MAPPING                           */}
      {/* ================================================================= */}
      {activeSubTab === 'mapping' && (
        <div className="bg-white rounded-2xl p-5 border border-[#DCE3E8] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E9ECEF]">
            <div>
              <h3 className="text-sm font-black text-[#252A30]">
                Secureye Biometric User ID → Gym Member ID Mapping
              </h3>
              <p className="text-xs text-[#84909A]">
                Enroll fingerprints directly on your physical Secureye machine, then enter each member&apos;s exact device User ID here so live attendance events validate membership expiry in Firestore.
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-[#84909A] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search member or User ID..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-xs font-semibold text-[#252A30] focus:outline-none focus:border-[#FFD447]"
              />
            </div>
          </div>

          {mappingFeedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold border flex items-center gap-2 ${
                mappingFeedback.type === 'success'
                  ? 'bg-[#36A875]/10 border-[#36A875]/30 text-[#237A54]'
                  : 'bg-[#DC5555]/10 border-[#DC5555]/30 text-[#DC5555]'
              }`}
            >
              {mappingFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{mappingFeedback.message}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#F5F6F2] border-b border-[#DCE3E8] text-[11px] font-bold text-[#84909A] uppercase tracking-wider">
                  <th className="py-3 px-3">Gym Member</th>
                  <th className="py-3 px-3">Membership & Expiry</th>
                  <th className="py-3 px-3">Secureye Device User ID</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E9ECEF]">
                {filteredMembers.map((member) => {
                  const draftVal =
                    memberBiometricDrafts[member.id] !== undefined
                      ? memberBiometricDrafts[member.id]
                      : member.biometricId || '';
                  const isSaving = savingMemberId === member.id;

                  return (
                    <tr key={member.id} className="hover:bg-[#F5F6F2]/50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={member.avatar}
                            alt={member.name}
                            className="w-8 h-8 rounded-full object-cover border border-[#DCE3E8]"
                          />
                          <div>
                            <p className="font-bold text-[#252A30]">{member.name}</p>
                            <p className="text-[10px] font-mono text-[#84909A]">{member.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <p className="font-bold text-[#252A30]">{member.planName}</p>
                        <p className="text-[11px] text-[#84909A]">
                          Status:{' '}
                          <span
                            className={`font-bold uppercase ${
                              member.status === 'active'
                                ? 'text-[#36A875]'
                                : 'text-[#DC5555]'
                            }`}
                          >
                            {member.status}
                          </span>{' '}
                          • Expires: {member.expiryDate}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          placeholder="e.g. 101"
                          value={draftVal}
                          onChange={(e) =>
                            setMemberBiometricDrafts((prev) => ({
                              ...prev,
                              [member.id]: e.target.value,
                            }))
                          }
                          className="w-40 px-2.5 py-1.5 rounded-lg bg-[#F5F6F2] border border-[#DCE3E8] font-mono font-bold text-xs text-[#252A30] focus:outline-none focus:border-[#FFD447]"
                        />
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() =>
                            handleSaveMemberBiometricId(member.id, member.biometricId || '')
                          }
                          disabled={isSaving}
                          className="px-3 py-1.5 rounded-lg bg-[#252A30] text-[#FFD447] font-bold text-xs hover:bg-[#313740] transition-all disabled:opacity-50"
                        >
                          {isSaving ? 'Saving...' : 'Save Mapping'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: DIAGNOSTICS & SYNCHRONIZATION LOGS                         */}
      {/* ================================================================= */}
      {activeSubTab === 'diagnostics' && (
        <div className="space-y-6">
          {/* 6 Required Real Diagnostic Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Firebase Backend Status */}
            <div className="bg-white rounded-2xl p-4 border border-[#DCE3E8] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#84909A] uppercase tracking-wider">
                  Firebase Backend Status
                </span>
                <Server
                  className={`w-4 h-4 ${
                    backendHealth?.ok ? 'text-[#36A875]' : 'text-[#DC5555]'
                  }`}
                />
              </div>
              <p
                className={`text-base font-black ${
                  backendHealth?.ok ? 'text-[#36A875]' : 'text-[#DC5555]'
                }`}
              >
                {backendHealth === null
                  ? 'Checking...'
                  : backendHealth.ok
                  ? 'Online (Cloud Functions)'
                  : 'Offline / Not Deployed'}
              </p>
              <p className="text-[11px] text-[#84909A]">
                {backendHealth?.ok
                  ? `Project: ${backendHealth.projectId} • API Key: ${
                      backendHealth.secureyeApiKeyConfigured ? 'Configured' : 'Not Set'
                    } • Webhook Secret: ${
                      backendHealth.webhookSecretConfigured ? 'Configured' : 'Not Set'
                    }`
                  : backendHealth?.error ||
                    firestoreError ||
                    'Deploy functions/ to activate /api/biometric endpoints.'}
              </p>
              <p className="text-[10px] font-mono text-[#84909A]">
                Firestore Listener: {firebaseConnected ? 'Connected' : 'Waiting / Auth Required'}
              </p>
            </div>

            {/* 2. Secureye Cloud Integration Status (No Local Connector) */}
            <div className="bg-white rounded-2xl p-4 border border-[#DCE3E8] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#84909A] uppercase tracking-wider">
                  Secureye Cloud Bridge Status
                </span>
                {biometricDevices.some((d) => d.status === 'connected') ? (
                  <Cloud className="w-4 h-4 text-[#36A875]" />
                ) : (
                  <WifiOff className="w-4 h-4 text-[#B57B14]" />
                )}
              </div>
              <p
                className={`text-base font-black ${
                  biometricDevices.some((d) => d.status === 'connected')
                    ? 'text-[#36A875]'
                    : 'text-[#B57B14]'
                }`}
              >
                {biometricDevices.some((d) => d.status === 'connected')
                  ? 'Direct Cloud Active'
                  : 'Awaiting Official Cloud API'}
              </p>
              <p className="text-[11px] text-[#84909A]">
                {biometricDevices.some((d) => d.status === 'connected')
                  ? 'Receiving real attendance events directly via cloud (no gym PC required).'
                  : 'Direct cloud-only mode (no local PC). Requires official Secureye Cloud API credentials or verified direct push URL.'}
              </p>
            </div>

            {/* 3. Device Authentication Status */}
            <div className="bg-white rounded-2xl p-4 border border-[#DCE3E8] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#84909A] uppercase tracking-wider">
                  Device Authentication Status
                </span>
                <KeyRound className="w-4 h-4 text-[#E5B82A]" />
              </div>
              <p className="text-base font-black text-[#252A30]">
                {biometricDevices.some((d) => d.authStatus === 'authenticated')
                  ? 'Authenticated'
                  : biometricDevices.some((d) => d.authStatus === 'failed')
                  ? 'Authentication Failed'
                  : 'Unverified'}
              </p>
              <p className="text-[11px] text-[#84909A]">
                {biometricDevices.length === 0
                  ? 'No Secureye devices registered yet.'
                  : `${biometricDevices.filter((d) => d.authStatus === 'authenticated').length} of ${
                      biometricDevices.length
                    } device(s) verified by real handshake.`}
              </p>
            </div>

            {/* 4. Last Successful Communication */}
            <div className="bg-white rounded-2xl p-4 border border-[#DCE3E8] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#84909A] uppercase tracking-wider">
                  Last Successful Communication
                </span>
                <Activity className="w-4 h-4 text-[#36A875]" />
              </div>
              <p className="text-sm font-black text-[#252A30] font-mono">
                {formatTimestamp(lastSuccessfulComm)}
              </p>
              <p className="text-[11px] text-[#84909A]">
                Updated only when a physical device or cloud API responds to the backend.
              </p>
            </div>

            {/* 5. Last Attendance Received */}
            <div className="bg-white rounded-2xl p-4 border border-[#DCE3E8] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#84909A] uppercase tracking-wider">
                  Last Attendance Received
                </span>
                <Fingerprint className="w-4 h-4 text-[#E5B82A]" />
              </div>
              <p className="text-sm font-black text-[#252A30] font-mono">
                {formatTimestamp(lastAttendanceReceived)}
              </p>
              <p className="text-[11px] text-[#84909A]">
                {realSecureyeAttendance.length > 0
                  ? `Latest: ${realSecureyeAttendance[0].memberName} (${realSecureyeAttendance[0].status.toUpperCase()})`
                  : 'No real Secureye fingerprint scan recorded in Firestore yet.'}
              </p>
            </div>

            {/* 6. Synchronization Errors */}
            <div className="bg-white rounded-2xl p-4 border border-[#DCE3E8] shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#84909A] uppercase tracking-wider">
                  Synchronization Errors
                </span>
                <ShieldAlert
                  className={`w-4 h-4 ${
                    syncErrors.length > 0 ? 'text-[#DC5555]' : 'text-[#36A875]'
                  }`}
                />
              </div>
              <p
                className={`text-base font-black ${
                  syncErrors.length > 0 ? 'text-[#DC5555]' : 'text-[#36A875]'
                }`}
              >
                {syncErrors.length} Error / Warning{syncErrors.length === 1 ? '' : 's'}
              </p>
              <p className="text-[11px] text-[#84909A] truncate">
                {syncErrors[0]?.message ||
                  firestoreError ||
                  'No synchronization errors logged.'}
              </p>
            </div>
          </div>

          {/* Synchronization Logs Table */}
          <div className="bg-white rounded-2xl p-5 border border-[#DCE3E8] shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E9ECEF]">
              <div>
                <h3 className="text-sm font-black text-[#252A30]">
                  Real-Time Biometric Synchronization & Audit Logs
                </h3>
                <p className="text-[11px] text-[#84909A]">
                  Streamed live from Firestore collection <code>biometric_sync_logs</code>.
                </p>
              </div>
              <span className="text-xs font-bold text-[#84909A]">
                {biometricSyncLogs.length} Entries
              </span>
            </div>

            {biometricSyncLogs.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#F5F6F2] text-center text-xs text-[#84909A]">
                No biometric sync logs recorded in Firestore yet. Register a device or run a real backend connection test to generate audit logs.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F5F6F2] border-b border-[#DCE3E8] text-[11px] font-bold text-[#84909A] uppercase">
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Level</th>
                      <th className="py-2.5 px-3">Event Type</th>
                      <th className="py-2.5 px-3">Device / User</th>
                      <th className="py-2.5 px-3">Message</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E9ECEF]">
                    {biometricSyncLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F5F6F2]/50">
                        <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              log.level === 'error'
                                ? 'bg-[#DC5555]/15 text-[#DC5555]'
                                : log.level === 'warning'
                                ? 'bg-[#FFF8E7] text-[#B57B14]'
                                : log.level === 'success'
                                ? 'bg-[#36A875]/15 text-[#36A875]'
                                : 'bg-[#F5F6F2] text-[#5A646E]'
                            }`}
                          >
                            {log.level}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#5A646E]">
                          {log.eventType}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-[#252A30]">
                          {log.deviceSn || log.deviceId || '—'}
                          {log.biometricUserId ? ` / UID:${log.biometricUserId}` : ''}
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-semibold text-[#252A30]">{log.message}</p>
                          {log.details && (
                            <p className="text-[10px] font-mono text-[#84909A] mt-0.5">
                              {log.details}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
