import React from 'react';
import { useGym } from '../../context/GymContext';
import {
  CheckCircle2,
  XCircle,
  Fingerprint,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Server,
} from 'lucide-react';

export const AccessMonitorView: React.FC = () => {
  const {
    accessLogs,
    biometricDevices,
    soundEnabled,
    setSoundEnabled,
    setCurrentTab,
  } = useGym();

  const latestLog = accessLogs[0] || null;
  const connectedCount = biometricDevices.filter((d) => d.status === 'connected').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-[#DCE3E8] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connectedCount > 0 ? 'bg-[#36A875] animate-ping' : 'bg-[#84909A]'
              }`}
            />
            <h1 className="text-xl lg:text-2xl font-black text-[#252A30] tracking-tight">
              Live Access Monitoring
            </h1>
          </div>
          <p className="text-xs text-[#84909A]">
            Real-time entrance verdicts streamed from Firestore &amp; Secureye biometric devices (no simulated scans).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-black flex items-center gap-2 ${
              connectedCount > 0
                ? 'bg-[#36A875]/10 border-[#36A875]/30 text-[#36A875]'
                : 'bg-[#F5F6F2] border-[#DCE3E8] text-[#5A646E]'
            }`}
          >
            {connectedCount > 0 ? (
              <Wifi className="w-3.5 h-3.5" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            <span>
              {connectedCount > 0
                ? `${connectedCount} Device Connected`
                : 'No Live Biometric Device Connected'}
            </span>
          </div>

          <button
            onClick={() => setCurrentTab('biometric')}
            className="px-3.5 py-1.5 rounded-xl bg-[#252A30] text-[#FFD447] text-xs font-black flex items-center gap-1.5 hover:bg-[#313740] transition-all"
          >
            <Server className="w-3.5 h-3.5" />
            <span>Biometric Management</span>
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              soundEnabled
                ? 'bg-white border-[#DCE3E8] text-[#252A30] hover:border-[#FFD447]'
                : 'bg-[#F5F6F2] border-transparent text-[#84909A]'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-[#36A875]" />
            ) : (
              <VolumeX className="w-3.5 h-3.5" />
            )}
            <span>{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>
        </div>
      </div>

      {/* Main Monitor Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Latest Live Access Event */}
        <div className="lg:col-span-7 bg-[#252A30] rounded-3xl p-6 text-white shadow-xl border border-[#3E4550] space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-[#3E4550]">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-[#FFD447]" />
              <span className="font-bold text-xs uppercase tracking-wider text-[#A0AEC0]">
                {latestLog ? latestLog.terminalId : 'Secureye Biometric Stream'}
              </span>
            </div>
            <span className="font-mono text-xs text-[#FFD447] font-black">
              {latestLog ? latestLog.time : '--:--'}
            </span>
          </div>

          <div
            className={`p-8 rounded-2xl border text-center transition-all ${
              latestLog?.status === 'granted'
                ? 'bg-[#36A875]/15 border-[#36A875]'
                : latestLog?.status === 'denied'
                ? 'bg-[#DC5555]/15 border-[#DC5555]'
                : 'bg-[#2D333B] border-[#3E4550]'
            }`}
          >
            {latestLog ? (
              <div className="space-y-4">
                <div
                  className={`w-20 h-20 rounded-full text-white flex items-center justify-center mx-auto shadow-lg ${
                    latestLog.status === 'granted' ? 'bg-[#36A875]' : 'bg-[#DC5555]'
                  }`}
                >
                  {latestLog.status === 'granted' ? (
                    <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
                  ) : (
                    <XCircle className="w-10 h-10 stroke-[2.5]" />
                  )}
                </div>
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-white font-black text-xs uppercase tracking-widest ${
                      latestLog.status === 'granted' ? 'bg-[#36A875]' : 'bg-[#DC5555]'
                    }`}
                  >
                    {latestLog.status === 'granted' ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
                  </span>
                  <h2 className="text-2xl font-black text-white mt-3">
                    {latestLog.memberName}
                  </h2>
                  <p className="text-xs text-[#FFD447] font-mono font-bold mt-1">
                    Member ID: {latestLog.memberId}
                  </p>
                  {latestLog.reason && (
                    <p className="text-xs text-[#A0AEC0] mt-2">{latestLog.reason}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3 py-6">
                <div className="w-20 h-20 rounded-full bg-[#353C46] text-[#FFD447] flex items-center justify-center mx-auto border-2 border-dashed border-[#FFD447]/40">
                  <Fingerprint className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Waiting for Real Biometric Scan</h3>
                  <p className="text-xs text-[#84909A] max-w-sm mx-auto mt-1">
                    Live attendance events pushed from your physical Secureye machine to Firestore will appear here automatically.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Recent Live Access Feed */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-[#DCE3E8] shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#E9ECEF]">
            <h3 className="text-xs font-black text-[#252A30] uppercase tracking-wider">
              Recent Access Logs
            </h3>
            <span className="text-[10px] font-mono text-[#84909A]">
              {accessLogs.length} Records
            </span>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {accessLogs.length === 0 ? (
              <p className="text-xs text-[#84909A] text-center py-6">
                No access events recorded yet.
              </p>
            ) : (
              accessLogs.slice(0, 20).map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={log.avatar}
                      alt={log.memberName}
                      className="w-7 h-7 rounded-full object-cover border border-[#DCE3E8] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-[#252A30] truncate leading-tight">
                        {log.memberName}
                      </p>
                      <p className="text-[10px] text-[#84909A] truncate">
                        {log.time} • {log.terminalId}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full font-black text-[9px] uppercase shrink-0 ${
                      log.status === 'granted'
                        ? 'bg-[#36A875]/15 text-[#36A875]'
                        : 'bg-[#DC5555]/15 text-[#DC5555]'
                    }`}
                  >
                    {log.status === 'granted' ? 'Granted' : 'Denied'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
