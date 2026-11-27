import React, { useEffect, useMemo, useState } from 'react';
import { useGym } from '../../context/GymContext';
import { BIOMETRIC_CONFIG } from '../../config/biometricConfig';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Fingerprint,
  Link2,
  Lock,
  Radio,
  RefreshCw,
  Search,
  WifiOff,
} from 'lucide-react';

type SubTab = 'mapping' | 'live_punches';

interface WsServerHealth {
  ok: boolean;
  serverTime?: string;
  error?: string;
}

async function checkWsServerHealth(baseUrl: string): Promise<WsServerHealth> {
  try {
    const resp = await fetch(`${baseUrl.replace(/\/+$/, '')}/health`, {
      headers: { Accept: 'application/json' },
    });
    const text = await resp.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = {};
    }
    if (!resp.ok) {
      return { ok: false, error: data.error || `HTTP ${resp.status}` };
    }
    return {
      ok: true,
      serverTime: data.serverTime || data.timestamp || new Date().toISOString(),
    };
  } catch (err: any) {
    return {
      ok: false,
      error: err?.message || 'Unable to reach WebSocket server.',
    };
  }
}

function formatTimestamp(iso?: string | null): string {
  if (!iso) return 'Never';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export const BiometricView: React.FC = () => {
  const { members, attendance, linkMemberBiometricId } = useGym();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('mapping');
  const [showWsInfo, setShowWsInfo] = useState(false);
  const [copiedWss, setCopiedWss] = useState(false);

  // Real WebSocket server health status (read-only, zero client configuration)
  const [wsHealth, setWsHealth] = useState<WsServerHealth | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  // Member User ID mapping state
  const [memberSearch, setMemberSearch] = useState('');
  const [memberBiometricDrafts, setMemberBiometricDrafts] = useState<Record<string, string>>({});
  const [savingMemberId, setSavingMemberId] = useState<string | null>(null);
  const [mappingFeedback, setMappingFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const runHealthCheck = async () => {
    setCheckingHealth(true);
    const res = await checkWsServerHealth(BIOMETRIC_CONFIG.serverUrl);
    setWsHealth(res);
    setCheckingHealth(false);
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const handleCopyWss = async () => {
    try {
      await navigator.clipboard.writeText(BIOMETRIC_CONFIG.wsUrl);
      setCopiedWss(true);
      setTimeout(() => setCopiedWss(false), 2000);
    } catch {
      // Clipboard fallback ignored
    }
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
        message: res.error || 'Failed to update member User ID.',
      });
    } else {
      setMappingFeedback({
        type: 'success',
        message: draft.trim()
          ? `Linked Secureye Machine User ID "${draft.trim()}" to member ${memberId}.`
          : `Cleared User ID mapping for member ${memberId}.`,
      });
    }
    setSavingMemberId(null);
  };

  // Real biometric check-ins streamed from Firestore
  const realBiometricAttendance = useMemo(
    () => attendance.filter((a) => a.source === 'secureye' || a.method === 'biometric'),
    [attendance]
  );

  const lastAttendanceReceived = realBiometricAttendance[0]?.timestamp || null;

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
        (m.name || '').toLowerCase().includes(q) ||
        (m.id || '').toLowerCase().includes(q) ||
        (m.loginUserId || '').toLowerCase().includes(q) ||
        (m.biometricId || '').toLowerCase().includes(q)
    );
  }, [members, memberSearch]);

  return (
    <div className="space-y-6">
      {/* Top WebSocket Status Bar (Pre-Configured & Locked) */}
      <div className="bg-white rounded-2xl p-4 border border-[#DCE3E8] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#252A30] text-[#FFD447] flex items-center justify-center shrink-0">
            <Fingerprint className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-black text-[#252A30]">
                Biometric WebSocket Attendance
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                  wsHealth === null
                    ? 'bg-[#F5F6F2] text-[#5A646E] border-[#DCE3E8]'
                    : wsHealth.ok
                    ? 'bg-[#36A875]/15 text-[#36A875] border-[#36A875]/30'
                    : 'bg-[#DC5555]/10 text-[#DC5555] border-[#DC5555]/30'
                }`}
              >
                {wsHealth?.ok ? (
                  <Radio className="w-3 h-3" />
                ) : (
                  <WifiOff className="w-3 h-3" />
                )}
                {wsHealth === null
                  ? 'Checking WebSocket...'
                  : wsHealth.ok
                  ? 'WebSocket Server Online'
                  : 'WebSocket Server Offline'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#F5F6F2] text-[#5A646E] border border-[#DCE3E8] font-mono">
                SN: {BIOMETRIC_CONFIG.defaultTerminal.serialNumber}
              </span>
            </div>
            <p className="text-xs text-[#84909A] mt-0.5">
              Direct WebSocket connection is pre-configured and locked inside the app. Match each member&apos;s Secureye User ID below.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={runHealthCheck}
            disabled={checkingHealth}
            className="px-3 py-1.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] hover:border-[#FFD447] text-xs font-bold text-[#252A30] flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? 'animate-spin' : ''}`} />
            <span>{checkingHealth ? 'Checking...' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowWsInfo((v) => !v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              showWsInfo
                ? 'bg-[#252A30] text-[#FFD447] border-[#252A30]'
                : 'bg-white text-[#84909A] border-[#DCE3E8] hover:text-[#252A30]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{showWsInfo ? 'Hide Connection Info' : 'Connection Info'}</span>
          </button>
        </div>
      </div>

      {/* Locked Read-Only WebSocket Details (No Editable Inputs) */}
      {showWsInfo && (
        <div className="bg-white rounded-2xl p-4 border border-[#DCE3E8] shadow-xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-black text-[#252A30] flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#E5B82A]" />
              <span>WebSocket Configuration (Locked — Read-Only)</span>
            </span>
            <span className="text-[10px] font-bold text-[#84909A]">
              Managed by system • Cannot be edited
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#252A30] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#FFD447]">
                Secureye WebSocket Endpoint (WSS)
              </p>
              <p className="font-mono text-xs text-white/95 truncate mt-0.5 select-all">
                {BIOMETRIC_CONFIG.wsUrl}
              </p>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8]">
              <span className="text-[10px] font-bold text-[#84909A] uppercase block">Service Host</span>
              <span className="font-mono font-bold text-[#252A30] truncate block">
                {BIOMETRIC_CONFIG.serverUrl}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8]">
              <span className="text-[10px] font-bold text-[#84909A] uppercase block">Terminal Serial No.</span>
              <span className="font-mono font-bold text-[#252A30]">
                {BIOMETRIC_CONFIG.defaultTerminal.serialNumber}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8]">
              <span className="text-[10px] font-bold text-[#84909A] uppercase block">Protocol</span>
              <span className="font-bold text-[#252A30]">Secure WebSocket (WSS) Only</span>
            </div>
          </div>
        </div>
      )}

      {/* Clean 2-Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#DCE3E8] pb-3">
        <button
          onClick={() => setActiveSubTab('mapping')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'mapping'
              ? 'bg-[#252A30] text-[#FFD447] shadow-xs'
              : 'bg-white text-[#5A646E] border border-[#DCE3E8] hover:border-[#FFD447]'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>Member Fingerprint IDs ({linkedMembersCount}/{members.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('live_punches')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeSubTab === 'live_punches'
              ? 'bg-[#252A30] text-[#FFD447] shadow-xs'
              : 'bg-white text-[#5A646E] border border-[#DCE3E8] hover:border-[#FFD447]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Live Check-Ins ({realBiometricAttendance.length})</span>
        </button>
      </div>

      {/* TAB 1: MEMBER FINGERPRINT USER ID MAPPING */}
      {activeSubTab === 'mapping' && (
        <div className="bg-white rounded-2xl p-5 border border-[#DCE3E8] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E9ECEF]">
            <div>
              <h3 className="text-sm font-black text-[#252A30]">
                Secureye Machine User ID → Member Profile
              </h3>
              <p className="text-xs text-[#84909A]">
                Each member&apos;s numeric User ID matches their fingerprint on the Secureye machine for automatic WebSocket attendance sync.
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

          {/* 3-Step Pairing Guide */}
          <div className="p-3.5 rounded-xl bg-[#FFF8E7] border border-[#FFD447]/60 text-xs text-[#252A30] grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <span className="font-black block">1. Enroll on Secureye Machine</span>
              <span className="text-[11px] text-[#5A646E]">
                Open <strong>Menu → User Mgt → New User</strong>, enter the member&apos;s numeric User ID (e.g. <code>341</code>), and scan their finger.
              </span>
            </div>
            <div>
              <span className="font-black block">2. Confirm Matching User ID</span>
              <span className="text-[11px] text-[#5A646E]">
                Verify the exact numeric ID below (automatically assigned when enrolling a new member).
              </span>
            </div>
            <div>
              <span className="font-black block">3. Real-Time WebSocket Sync</span>
              <span className="text-[11px] text-[#5A646E]">
                Every fingerprint scan streams over WebSocket, verifies membership expiry, and logs attendance automatically.
              </span>
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
                  <th className="py-3 px-3">Membership &amp; Expiry</th>
                  <th className="py-3 px-3">Secureye User ID</th>
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
                  const numericSuggestion =
                    member.loginUserId || member.id.replace(/^\D+0*/, '') || member.id;

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
                              member.status === 'active' ? 'text-[#36A875]' : 'text-[#DC5555]'
                            }`}
                          >
                            {member.status}
                          </span>{' '}
                          • Expires: {member.expiryDate}
                        </p>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder={`e.g. ${numericSuggestion}`}
                            value={draftVal}
                            onChange={(e) =>
                              setMemberBiometricDrafts((prev) => ({
                                ...prev,
                                [member.id]: e.target.value,
                              }))
                            }
                            className="w-32 px-2.5 py-1.5 rounded-lg bg-[#F5F6F2] border border-[#DCE3E8] font-mono font-bold text-xs text-[#252A30] focus:outline-none focus:border-[#FFD447]"
                          />
                          {draftVal !== numericSuggestion && (
                            <button
                              type="button"
                              onClick={() =>
                                setMemberBiometricDrafts((prev) => ({
                                  ...prev,
                                  [member.id]: numericSuggestion,
                                }))
                              }
                              className="px-2 py-1 rounded-lg bg-[#F5F6F2] border border-[#DCE3E8] hover:border-[#FFD447] text-[10px] font-bold text-[#5A646E]"
                            >
                              Use {numericSuggestion}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() =>
                            handleSaveMemberBiometricId(member.id, member.biometricId || '')
                          }
                          disabled={isSaving}
                          className="px-3 py-1.5 rounded-lg bg-[#252A30] text-[#FFD447] font-bold text-xs hover:bg-[#313740] transition-all disabled:opacity-50"
                        >
                          {isSaving ? 'Saving...' : 'Save ID'}
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

      {/* TAB 2: LIVE BIOMETRIC CHECK-INS */}
      {activeSubTab === 'live_punches' && (
        <div className="bg-white rounded-2xl p-5 border border-[#DCE3E8] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E9ECEF]">
            <div>
              <h3 className="text-sm font-black text-[#252A30]">
                Live Fingerprint Attendance Feed
              </h3>
              <p className="text-xs text-[#84909A]">
                Real check-ins streamed via WebSocket from your Secureye terminal.
              </p>
            </div>
            <span className="text-xs font-bold text-[#84909A]">
              Last check-in: {formatTimestamp(lastAttendanceReceived)}
            </span>
          </div>

          {realBiometricAttendance.length === 0 ? (
            <div className="p-8 rounded-2xl bg-[#F5F6F2] border border-dashed border-[#DCE3E8] text-center space-y-2">
              <Fingerprint className="w-8 h-8 text-[#84909A] mx-auto" />
              <p className="text-xs font-black text-[#252A30]">
                No fingerprint check-ins received yet
              </p>
              <p className="text-[11px] text-[#84909A] max-w-md mx-auto">
                Once a member scans their enrolled finger on your Secureye terminal, their attendance and access status will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#F5F6F2] border-b border-[#DCE3E8] text-[11px] font-bold text-[#84909A] uppercase tracking-wider">
                    <th className="py-3 px-3">Member</th>
                    <th className="py-3 px-3">User ID</th>
                    <th className="py-3 px-3">Date &amp; Time</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E9ECEF]">
                  {realBiometricAttendance.map((att) => (
                    <tr key={att.id} className="hover:bg-[#F5F6F2]/50">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={att.avatar}
                            alt={att.memberName}
                            className="w-8 h-8 rounded-full object-cover border border-[#DCE3E8]"
                          />
                          <div>
                            <p className="font-bold text-[#252A30]">{att.memberName}</p>
                            <p className="text-[10px] font-mono text-[#84909A]">{att.memberId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#252A30]">
                        {att.biometricUserId || '—'}
                      </td>
                      <td className="py-3 px-3 text-[#252A30] font-semibold">
                        {att.checkInDate} • {att.checkInTime}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                            att.status === 'granted'
                              ? 'bg-[#36A875]/15 text-[#36A875] border-[#36A875]/30'
                              : 'bg-[#DC5555]/15 text-[#DC5555] border-[#DC5555]/30'
                          }`}
                        >
                          {att.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
