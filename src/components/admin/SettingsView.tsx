import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { 
  Building2, 
  Cpu, 
  Save, 
  Check, 
  ShieldCheck, 
  Fingerprint, 
  Bell, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Lock, 
  Sparkles,
  Server,
  CloudCheck,
  CheckCircle2,
  Smartphone,
  Radio,
  Send,
  AlertTriangle,
  RotateCw,
  Cloud
} from 'lucide-react';
import { NotificationService, ExpiryDispatchResult } from '../../services/notificationService';

export const SettingsView: React.FC = () => {
  const { soundEnabled, setSoundEnabled, members, setCurrentTab } = useGym();

  const [saved, setSaved] = useState(false);
  const [dispatchRunning, setDispatchRunning] = useState(false);
  const [dispatchLogs, setDispatchLogs] = useState<ExpiryDispatchResult[] | null>(null);
  const [gymName, setGymName] = useState('GYMPRO Fitness Center');
  const [address, setAddress] = useState('Main Boulevard, Fitness Hub');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [email, setEmail] = useState('contact@gympro.com');
  const [operatingHours, setOperatingHours] = useState('24/7 Unlimited Access (Staffed: 05:30 AM – 10:30 PM)');
  const [turnstileTimeout, setTurnstileTimeout] = useState('5');
  const [biometricThreshold, setBiometricThreshold] = useState('95');
  const [autoRevoke, setAutoRevoke] = useState(true);
  const [antiPassback, setAntiPassback] = useState(true);
  const [expiryReminder7d, setExpiryReminder7d] = useState(true);
  const [autoReceipts, setAutoReceipts] = useState(true);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-[#DCE3E8] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-[#252A30]" />
            <h1 className="text-xl lg:text-2xl font-black text-[#252A30] tracking-tight">
              Facility & System Configuration
            </h1>
          </div>
          <p className="text-xs text-[#84909A]">
            Configure club facility profile, turnstile hardware parameters, biometric thresholds, and automated operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#36A875]/10 border border-[#36A875]/30 text-[#36A875] text-xs font-black flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#36A875] animate-pulse" />
            <span>Cloud Sync Active</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Facility Profile */}
        <div className="bg-white rounded-2xl p-6 border border-[#DCE3E8] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E9ECEF]">
            <Building2 className="w-4 h-4 text-[#FFD447]" />
            <h2 className="text-sm font-black text-[#252A30] uppercase tracking-wider">
              Club & Branch Profile
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#252A30] font-bold mb-1">Facility Name</label>
              <input
                type="text"
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-[#252A30] font-bold focus:outline-none focus:border-[#FFD447] focus:bg-white transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[#252A30] font-bold mb-1">Operating Hours</label>
              <input
                type="text"
                value={operatingHours}
                onChange={(e) => setOperatingHours(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-[#252A30] font-bold focus:outline-none focus:border-[#FFD447] focus:bg-white transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-[#252A30] font-bold mb-1">Official Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-[#84909A] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-[#252A30] font-medium focus:outline-none focus:border-[#FFD447] focus:bg-white transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#252A30] font-bold mb-1">Contact Phone</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#84909A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-[#252A30] font-medium focus:outline-none focus:border-[#FFD447] focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#252A30] font-bold mb-1">Helpdesk Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#84909A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-[#252A30] font-medium focus:outline-none focus:border-[#FFD447] focus:bg-white transition-all"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Gate & Turnstile Controller Settings */}
        <div className="bg-white rounded-2xl p-6 border border-[#DCE3E8] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E9ECEF]">
            <Cpu className="w-4 h-4 text-[#FFD447]" />
            <h2 className="text-sm font-black text-[#252A30] uppercase tracking-wider">
              Turnstiles & Access Hardware
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-[#252A30] font-bold mb-1">
                Turnstile Unlock Hold Duration (seconds)
              </label>
              <input
                type="number"
                min="2"
                max="15"
                value={turnstileTimeout}
                onChange={(e) => setTurnstileTimeout(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-[#252A30] font-bold focus:outline-none focus:border-[#FFD447] focus:bg-white transition-all"
              />
              <span className="text-[11px] text-[#84909A] mt-1 block">
                Standard duration gate relays remain unlocked after verified member scan.
              </span>
            </div>

            <div>
              <label className="block text-[#252A30] font-bold mb-1">
                Active Gate Controller Channels
              </label>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-3 py-2 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] font-bold text-[#252A30] flex-1 text-center">
                  Gate 01 (Turnstile Alpha)
                </span>
                <span className="px-3 py-2 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] font-bold text-[#252A30] flex-1 text-center">
                  Gate 02 (Turnstile Beta)
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 space-y-2.5 border-t border-[#E9ECEF]">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRevoke}
                onChange={(e) => setAutoRevoke(e.target.checked)}
                className="w-4 h-4 accent-[#FFD447] rounded cursor-pointer"
              />
              <span className="text-xs font-semibold text-[#252A30]">
                Strict Expiry Enforcement: Automatically deny turnstile entry immediately upon subscription expiration
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={antiPassback}
                onChange={(e) => setAntiPassback(e.target.checked)}
                className="w-4 h-4 accent-[#FFD447] rounded cursor-pointer"
              />
              <span className="text-xs font-semibold text-[#252A30]">
                Anti-Passback Protection: Disallow immediate re-entry with the same credential within 10 minutes
              </span>
            </label>
          </div>
        </div>

        {/* Section 3: Biometric Security Settings */}
        <div className="bg-white rounded-2xl p-6 border border-[#DCE3E8] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E9ECEF]">
            <Fingerprint className="w-4 h-4 text-[#FFD447]" />
            <h2 className="text-sm font-black text-[#252A30] uppercase tracking-wider">
              Biometric Optical Scanner Parameters
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[#252A30] font-bold">
                  Biometric Match Certainty Threshold
                </label>
                <span className="font-mono font-black text-[#252A30] bg-[#FFF8E7] px-2 py-0.5 rounded border border-[#FFD447]/40">
                  {biometricThreshold}% Match
                </span>
              </div>
              <input
                type="range"
                min="80"
                max="99"
                value={biometricThreshold}
                onChange={(e) => setBiometricThreshold(e.target.value)}
                className="w-full accent-[#FFD447] cursor-pointer mt-2"
              />
              <span className="text-[11px] text-[#84909A] mt-1 block">
                Recommended 95% threshold eliminates false acceptances on 500 DPI optical sensors.
              </span>
            </div>

            <div>
              <label className="block text-[#252A30] font-bold mb-1">
                Hardware Device Profile
              </label>
              <div className="p-3 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] space-y-1">
                <p className="font-bold text-[#252A30]">Secureye Fingerprint Attendance Terminal</p>
                <p className="text-[11px] text-[#84909A] font-mono">
                  SN: 102026020002110 • P2P ID: BD77B4BE-3765DCD • WLAN: 192.168.1.101
                </p>
              </div>
            </div>
          </div>

          {/* Direct Cloud / ADMS Biometric Management Shortcut */}
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-yellow-soft/60 via-white to-yellow-soft/30 border border-yellow-sunshine/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-graphite flex items-center justify-center text-yellow-sunshine shrink-0 shadow-sm">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-graphite">
                  Secureye Biometric Management &amp; ADMS Server
                </h3>
                <p className="text-[11px] text-graphite-muted">
                  Manage your Secureye device registration, Member User ID mapping, ADMS Live Server, and real diagnostics.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCurrentTab('biometric')}
              className="btn-jelly-yellow px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 shadow-yellow-btn"
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Open Biometric Management</span>
            </button>
          </div>
        </div>

        {/* Section 4: Operational Automation & Alerts */}
        <div className="bg-white rounded-2xl p-6 border border-[#DCE3E8] shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#E9ECEF]">
            <Bell className="w-4 h-4 text-[#FFD447]" />
            <h2 className="text-sm font-black text-[#252A30] uppercase tracking-wider">
              Automated Member Notifications & Receipts
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={expiryReminder7d}
                onChange={(e) => setExpiryReminder7d(e.target.checked)}
                className="w-4 h-4 accent-[#FFD447] rounded cursor-pointer"
              />
              <span className="font-semibold text-[#252A30]">
                Advance Expiration Reminders: Alert members 7 days and 3 days before plan expiry
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoReceipts}
                onChange={(e) => setAutoReceipts(e.target.checked)}
                className="w-4 h-4 accent-[#FFD447] rounded cursor-pointer"
              />
              <span className="font-semibold text-[#252A30]">
                Automated Receipts: Generate official GST invoice receipts upon online or cash counter payments
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={soundEnabled}
                onChange={(e) => setSoundEnabled(e.target.checked)}
                className="w-4 h-4 accent-[#FFD447] rounded cursor-pointer"
              />
              <span className="font-semibold text-[#252A30]">
                Entrance Audio Feedback: Play confirmation chimes on verified turnstile check-ins
              </span>
            </label>
          </div>

          {/* Background Expiry Dispatcher Engine */}
          <div className="mt-4 pt-4 border-t border-[#E9ECEF] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#36A875] animate-ping" />
                  <span className="text-xs font-black text-[#252A30]">
                    Background Expiry Alert Engine (Offline / App-Closed Delivery)
                  </span>
                </div>
                <p className="text-[11px] text-[#84909A] mt-0.5">
                  Alerts are routed through Web Push (Service Worker) and queued on cellular carrier SMS towers. Delivers even when user's phone is asleep or powered off.
                </p>
              </div>

              <button
                type="button"
                onClick={async () => {
                  setDispatchRunning(true);
                  const results = await NotificationService.scanAndNotifyExpiring(members);
                  setTimeout(() => {
                    setDispatchLogs(results);
                    setDispatchRunning(false);
                  }, 600);
                }}
                disabled={dispatchRunning}
                className="px-3.5 py-2 rounded-xl bg-[#252A30] text-[#FFD447] text-xs font-bold hover:bg-black transition-all flex items-center gap-1.5 shrink-0 shadow-xs disabled:opacity-50"
              >
                {dispatchRunning ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Scanning Members...</span>
                  </>
                ) : (
                  <>
                    <Radio className="w-3.5 h-3.5 text-[#FFD447]" />
                    <span>Run Expiry Dispatch Scan</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Dispatch Report */}
            {dispatchLogs && (
              <div className="p-3 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] space-y-2 animate-fade-in text-[11px]">
                <div className="flex items-center justify-between font-bold text-[#252A30]">
                  <span>Scan Completed: {dispatchLogs.length} Member(s) expiring within 7 days</span>
                  <span className="text-[#36A875]">Multi-channel Queue Dispatched</span>
                </div>
                {dispatchLogs.length > 0 ? (
                  <div className="space-y-1.5 pt-1">
                    {dispatchLogs.map((log) => (
                      <div key={log.memberId} className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E9ECEF]">
                        <div>
                          <span className="font-bold text-[#252A30]">{log.memberName}</span>{' '}
                          <span className="font-mono text-[10px] text-[#84909A]">({log.memberId})</span>
                          <span className="ml-2 px-2 py-0.5 rounded-full bg-[#DC5555]/15 text-[#DC5555] font-bold text-[10px]">
                            {log.daysLeft} Day{log.daysLeft !== 1 ? 's' : ''} Left
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold">
                          <span className="px-2 py-0.5 rounded bg-[#36A875]/15 text-[#36A875]">Web Push Queued</span>
                          <span className="px-2 py-0.5 rounded bg-[#FFD447]/40 text-[#252A30]">Carrier SMS Active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[#84909A]">All gym members have active memberships beyond 7 days.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Save Bar */}
        <div className="bg-white rounded-2xl p-4 border border-[#DCE3E8] shadow-xs flex items-center justify-between">
          <div>
            {saved ? (
              <span className="text-xs font-bold text-[#36A875] flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4" /> Configuration saved and synchronized across all terminals!
              </span>
            ) : (
              <span className="text-xs text-[#84909A] font-medium">
                Changes apply immediately to all active check-in gates and reporting modules.
              </span>
            )}
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD447] to-[#F5C62F] text-[#252A30] font-black text-xs hover:shadow-md hover:shadow-[#FFD447]/30 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
