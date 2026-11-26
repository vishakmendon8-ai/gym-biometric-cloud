import React, { useState } from 'react';
import { Member } from '../../types/gym';
import { useGym } from '../../context/GymContext';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { 
  X, 
  Fingerprint, 
  Calendar, 
  Clock, 
  CreditCard, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Sparkles, 
  Dumbbell, 
  Lock, 
  Award, 
  CheckCircle2, 
  RefreshCw,
  FileText,
  AlertTriangle
} from 'lucide-react';

interface MemberDossierModalProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
}

export const MemberDossierModal: React.FC<MemberDossierModalProps> = ({ member, isOpen, onClose }) => {
  const { updateMemberStatus, attendance, payments } = useGym();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'billing' | 'biometric'>('overview');

  if (!isOpen || !member) return null;

  const memberAttendance = attendance.filter(a => a.memberId === member.id || a.memberName === member.name);
  const memberPayments = payments.filter(p => p.memberId === member.id || p.memberName === member.name);

  // Generate a mock 30-day attendance heatmap
  const daysInMonth = Array.from({ length: 30 }, (_, i) => {
    const day = i + 1;
    const attended = (day * 7) % 3 === 0 || day % 2 === 0;
    return { day, attended };
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-graphite/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl glass-panel rounded-modal border border-cloud-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-cloud-border bg-white/70 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={member.avatar}
                alt={member.name}
                className="w-14 h-14 rounded-full object-cover border-2 border-yellow-sunshine shadow-md"
              />
              <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${
                member.status === 'active' ? 'bg-status-success' : member.status === 'expiring' ? 'bg-status-warning' : 'bg-status-error'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-graphite">{member.name}</h3>
                <Badge status={member.status} />
              </div>
              <p className="text-xs text-graphite-muted flex items-center gap-2 mt-0.5">
                <span>{member.planName} Tier</span>
                <span>•</span>
                <span className="font-mono text-graphite font-bold">{member.biometricId}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-control text-graphite-muted hover:text-graphite hover:bg-cloud-grey transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-cloud-border bg-cloud-grey/40 px-6">
          {(['overview', 'attendance', 'billing', 'biometric'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-3.5 text-xs font-bold border-b-2 transition-all capitalize ${
                activeTab === tab
                  ? 'border-yellow-sunshine text-graphite bg-white/50'
                  : 'border-transparent text-graphite-muted hover:text-graphite'
              }`}
            >
              {tab === 'biometric' ? 'Optical Biometric' : tab}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
          
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Quick Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-card bg-white border border-cloud-border">
                  <span className="text-[11px] font-semibold text-graphite-muted block">Validity Status</span>
                  <p className="text-base font-black text-graphite mt-1">
                    {member.status === 'expired' ? 'Expired' : `${member.daysLeft} Days Left`}
                  </p>
                  <span className="text-[10px] text-graphite-muted">Expires: {member.expiryDate}</span>
                </div>

                <div className="p-3.5 rounded-card bg-white border border-cloud-border">
                  <span className="text-[11px] font-semibold text-graphite-muted block">Check-in Frequency</span>
                  <p className="text-base font-black text-graphite mt-1">{member.totalCheckIns} Total</p>
                  <span className="text-[10px] text-status-success font-semibold">Top 15% Discipline</span>
                </div>

                <div className="p-3.5 rounded-card bg-white border border-cloud-border">
                  <span className="text-[11px] font-semibold text-graphite-muted block">Assigned Locker</span>
                  <p className="text-base font-black text-graphite mt-1">Locker #42</p>
                  <span className="text-[10px] text-graphite-muted">Executive Bay A</span>
                </div>
              </div>

              {/* Contact and Emergency details */}
              <div className="p-4 rounded-card bg-white border border-cloud-border space-y-2.5">
                <h4 className="font-bold text-graphite uppercase text-[11px] tracking-wider">
                  Contact & Profile Dossier
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-graphite-muted block text-[11px]">Primary Email</span>
                    <strong className="text-graphite">{member.email}</strong>
                  </div>
                  <div>
                    <span className="text-graphite-muted block text-[11px]">Mobile Phone</span>
                    <strong className="text-graphite">{member.phone}</strong>
                  </div>
                  <div>
                    <span className="text-graphite-muted block text-[11px]">Emergency Contact</span>
                    <strong className="text-graphite">{member.emergencyContact}</strong>
                  </div>
                  <div>
                    <span className="text-graphite-muted block text-[11px]">Enrolled Since</span>
                    <strong className="text-graphite">{member.joinDate}</strong>
                  </div>
                </div>
              </div>

              {/* Attendance Heatmap Preview */}
              <div className="p-4 rounded-card bg-white border border-cloud-border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-graphite uppercase text-[11px] tracking-wider">
                    30-Day Check-in Consistency
                  </h4>
                  <span className="text-[10px] font-bold text-status-success">18 / 30 Days Active</span>
                </div>
                <div className="grid grid-cols-10 gap-1.5 pt-1">
                  {daysInMonth.map((d) => (
                    <div
                      key={d.day}
                      title={`Day ${d.day}: ${d.attended ? 'Attended' : 'Rest day'}`}
                      className={`h-5 rounded-sm flex items-center justify-center text-[9px] font-bold transition-all ${
                        d.attended ? 'bg-yellow-sunshine text-graphite shadow-xs' : 'bg-cloud-grey text-graphite-muted/40'
                      }`}
                    >
                      {d.day}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-3">
              <h4 className="font-bold text-graphite uppercase text-[11px] tracking-wider">
                Logged Hardware Turnstile Entries
              </h4>
              <div className="divide-y divide-cloud-border border border-cloud-border rounded-card overflow-hidden bg-white">
                {memberAttendance.length > 0 ? (
                  memberAttendance.map((rec) => (
                    <div key={rec.id} className="p-3 flex items-center justify-between hover:bg-cloud-grey/30">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-graphite text-yellow-sunshine flex items-center justify-center">
                          <Fingerprint className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="font-bold text-graphite">{rec.terminalId}</p>
                          <p className="text-[10px] text-graphite-muted">{rec.timestamp}</p>
                        </div>
                      </div>
                      <Badge status={rec.status} />
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-graphite-muted">
                    No hardware gate passes recorded for this session yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-graphite uppercase text-[11px] tracking-wider">
                  Payment History & Invoices
                </h4>
                <span className="text-[10px] font-bold text-graphite-muted">USD Currency</span>
              </div>
              <div className="border border-cloud-border rounded-card overflow-hidden bg-white">
                {memberPayments.length > 0 ? (
                  memberPayments.map((pay) => (
                    <div key={pay.id} className="p-3.5 border-b border-cloud-border/70 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-graphite">{pay.planName}</div>
                        <div className="text-[10px] text-graphite-muted">{pay.invoiceNumber} • {pay.date}</div>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-graphite">${pay.amount}</span>
                        <div className="mt-0.5"><Badge status={pay.status} /></div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-graphite-muted">
                    No billing transactions found for this account.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'biometric' && (
            <div className="space-y-4">
              <div className="p-5 rounded-card bg-graphite text-white flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-cloud-grey/70">
                    Secureye Biometric User ID
                  </span>
                  <p className="font-mono text-lg font-black text-yellow-sunshine mt-0.5">
                    {member.biometricRegistered && member.biometricId
                      ? member.biometricId
                      : 'Not Linked'}
                  </p>
                  <p className="text-[11px] text-cloud-grey/60 mt-1">
                    {member.biometricRegistered && member.biometricId
                      ? 'Linked to external Secureye biometric terminal'
                      : 'Enroll fingerprint on the Secureye machine and link the User ID in Biometric Management'}
                  </p>
                </div>
                <div className="w-14 h-14 rounded-full bg-graphite-light border border-graphite-muted flex items-center justify-center">
                  <Fingerprint className="w-8 h-8 text-yellow-sunshine" />
                </div>
              </div>

              <div className="p-4 rounded-card bg-white border border-cloud-border space-y-2">
                <h5 className="font-bold text-graphite text-xs uppercase tracking-wider">
                  Membership Access Eligibility
                </h5>
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-graphite-muted">Plan Status</span>
                  <span className={`font-black uppercase ${
                    member.status === 'active' ? 'text-status-success' : 'text-status-error'
                  }`}>
                    {member.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-graphite-muted">Expiry Date</span>
                  <span className="font-mono font-bold text-graphite">{member.expiryDate}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-graphite-muted">Last Verified Check-In</span>
                  <span className="font-mono font-semibold text-graphite">
                    {member.lastCheckIn || member.lastVisit || 'No check-ins yet'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-white/70 border-t border-cloud-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            {member.status === 'expired' ? (
              <Button
                size="sm"
                onClick={() => updateMemberStatus(member.id, 'active', 30)}
              >
                Renew Subscription (+30 Days)
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => updateMemberStatus(member.id, 'active', 30)}
              >
                Extend +30 Days
              </Button>
            )}
          </div>

          <Button variant="dark" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>

      </div>
    </div>
  );
};
