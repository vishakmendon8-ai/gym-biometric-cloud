import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { Member } from '../../types/gym';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { MemberDossierModal } from './MemberDossierModal';
import { 
  Search, 
  Filter, 
  UserPlus, 
  MoreVertical, 
  RefreshCw, 
  Trash2, 
  Fingerprint, 
  Check, 
  Phone, 
  Mail,
  ShieldAlert,
  Smartphone,
  Key,
  Link2,
  X,
  FileText
} from 'lucide-react';

interface MembersViewProps {
  onOpenAddMember: () => void;
}

export const MembersView: React.FC<MembersViewProps> = ({ onOpenAddMember }) => {
  const { 
    members, 
    updateMemberStatus, 
    updateMemberBiometric,
    deleteMember, 
    selectedMember, 
    setSelectedMember, 
    setActiveView, 
    loginMember 
  } = useGym();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'expiring' | 'expired'>('all');
  
  // Quick Biometric Linking Modal
  const [biometricTargetMember, setBiometricTargetMember] = useState<Member | null>(null);
  const [customBioToken, setCustomBioToken] = useState('');
  const [dossierMember, setDossierMember] = useState<Member | null>(null);

  const filteredMembers = members.filter(member => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (member.name || '').toLowerCase().includes(q) ||
      (member.email || '').toLowerCase().includes(q) ||
      (member.phone || '').toLowerCase().includes(q) ||
      (member.loginUserId || '').toLowerCase().includes(q) ||
      (member.id || '').toLowerCase().includes(q) ||
      (member.biometricId || '').toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Controls Bar */}
      <div className="glass-panel rounded-card p-4 border border-cloud-border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-graphite-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search member, User ID, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-input bg-white border border-cloud-border text-graphite placeholder:text-graphite-muted/60 focus:outline-none focus:border-yellow-sunshine focus:ring-1 focus:ring-yellow-sunshine transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {(['all', 'active', 'pending', 'expiring', 'expired'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-control text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === status
                  ? 'bg-graphite text-white shadow-sm'
                  : 'bg-white text-graphite-muted border border-cloud-border hover:border-yellow-sunshine'
              }`}
            >
              {status === 'all' ? 'All Members' : status === 'pending' ? 'Pending Plan' : status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-1.5 opacity-70 text-[10px]">
                ({status === 'all' ? members.length : members.filter(m => m.status === status).length})
              </span>
            </button>
          ))}
        </div>

        {/* Add Member button */}
        <Button
          onClick={onOpenAddMember}
          icon={<UserPlus className="w-4 h-4" />}
          className="shrink-0"
        >
          Enroll Member
        </Button>
      </div>

      {/* Members Table */}
      <div className="glass-panel rounded-panel border border-cloud-border shadow-card-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-cloud-grey/60 border-b border-cloud-border text-[11px] font-bold text-graphite-muted uppercase tracking-wider">
                <th className="py-3.5 px-4">Member Info & Login</th>
                <th className="py-3.5 px-4">Tier & Plan</th>
                <th className="py-3.5 px-4">Membership Status</th>
                <th className="py-3.5 px-4">Biometric ID</th>
                <th className="py-3.5 px-4">Validity</th>
                <th className="py-3.5 px-4">Gate Check-ins</th>
                <th className="py-3.5 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cloud-border/70">
              {filteredMembers.map((member) => {
                const isSelected = selectedMember?.id === member.id;
                const displayLoginId = member.loginUserId || member.biometricId || member.id;
                return (
                  <tr
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className={`transition-colors duration-150 cursor-pointer ${
                      isSelected
                        ? 'bg-yellow-soft/30 border-l-4 border-l-yellow-sunshine'
                        : 'hover:bg-white/80'
                    }`}
                  >
                    {/* Member Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={member.avatar}
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-graphite text-xs">{member.name}</span>
                            {member.profileCompleted === false && (
                              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#FFF8E7] text-[#9A7400] border border-[#FFD447]/60">
                                Profile Pending
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-graphite-muted flex items-center gap-1">
                            {member.phone ? (
                              <>
                                <Phone className="w-3 h-3 opacity-60" /> {member.phone}
                                {member.email ? ` • ${member.email}` : ''}
                              </>
                            ) : member.email ? (
                              <>
                                <Mail className="w-3 h-3 opacity-60" /> {member.email}
                              </>
                            ) : (
                              <span className="italic opacity-75">Awaiting member app login</span>
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-graphite-muted/80 flex items-center gap-1.5 mt-0.5">
                            <Key className="w-2.5 h-2.5 text-yellow-active" />
                            <span>ID: {displayLoginId}</span>
                            <span>•</span>
                            <span>Pass: {member.password || 'password123'}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Tier */}
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${member.status === 'pending' ? 'text-graphite-muted italic' : 'text-graphite'}`}>
                        {member.planName}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <Badge status={member.status} />
                    </td>

                    {/* Biometric ID */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-cloud-grey/80 border border-cloud-border font-mono text-[11px] text-graphite font-bold whitespace-nowrap group">
                        <Fingerprint className="w-3.5 h-3.5 text-yellow-active shrink-0" />
                        <span>{member.biometricId}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setBiometricTargetMember(member);
                            setCustomBioToken(member.biometricId || `BIO-FP-${Math.floor(1000 + Math.random() * 9000)}`);
                          }}
                          className="p-1 ml-1 rounded hover:bg-yellow-soft text-graphite-muted hover:text-graphite transition-all"
                          title="Connect or re-assign biometric fingerprint"
                        >
                          <Link2 className="w-3 h-3 text-yellow-active" />
                        </button>
                      </div>
                    </td>

                    {/* Validity */}
                    <td className="py-3 px-4">
                      <div className="font-medium text-graphite">
                        {member.status === 'pending' ? (
                          <span className="text-[#B87D1A] font-bold">Pending Activation</span>
                        ) : member.status === 'expired' ? (
                          <span className="text-status-error font-semibold">Expired</span>
                        ) : (
                          <span>{member.daysLeft} days remaining</span>
                        )}
                      </div>
                      <div className="text-[10px] text-graphite-muted">
                        {member.status === 'pending' ? 'Selects plan upon login' : `Expires: ${member.expiryDate}`}
                      </div>
                    </td>

                    {/* Gate check-ins */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-graphite">{member.totalCheckIns} entries</div>
                      <div className="text-[10px] text-graphite-muted">{member.lastCheckIn || 'No records'}</div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {member.status === 'pending' ? (
                          <button
                            onClick={() => updateMemberStatus(member.id, 'active', 30)}
                            className="btn-jelly-yellow px-2.5 py-1 text-[11px] font-bold rounded-control flex items-center gap-1"
                            title="Activate member plan (+30 Days)"
                          >
                            <Key className="w-3 h-3" />
                            Activate Plan
                          </button>
                        ) : member.status === 'expired' ? (
                          <button
                            onClick={() => updateMemberStatus(member.id, 'active', 30)}
                            className="btn-jelly-yellow px-2.5 py-1 text-[11px] font-bold rounded-control"
                            title="Renew membership (+30 Days)"
                          >
                            Renew +30d
                          </button>
                        ) : (
                          <button
                            onClick={() => updateMemberStatus(member.id, 'active', 30)}
                            className="px-2.5 py-1 text-[11px] font-semibold rounded-control bg-cloud-grey hover:bg-yellow-soft hover:text-graphite transition-colors border border-cloud-border"
                            title="Extend validity +30 days"
                          >
                            Extend +30d
                          </button>
                        )}

                        <button
                          onClick={() => setDossierMember(member)}
                          className="p-1.5 rounded-control text-graphite-muted hover:text-graphite hover:bg-cloud-grey transition-colors"
                          title="View 360° Member Dossier"
                        >
                          <FileText className="w-4 h-4 text-graphite" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Remove member ${member.name}?`)) {
                              deleteMember(member.id);
                            }
                          }}
                          className="p-1.5 rounded-control text-graphite-muted hover:text-status-error hover:bg-red-50 transition-colors"
                          title="Revoke / Delete Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredMembers.length === 0 && (
          <div className="p-8 text-center text-graphite-muted">
            <p className="text-sm font-semibold">No members found matching your search.</p>
            <p className="text-xs mt-1">Try resetting the status filter or enroll a new member.</p>
          </div>
        )}
      </div>

      {/* Quick Biometric Link Modal */}
      {biometricTargetMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite/60 backdrop-blur-sm animate-fade-in text-xs">
          <div className="w-full max-w-sm glass-panel rounded-panel border border-cloud-border shadow-2xl p-5 bg-white space-y-4">
            <div className="flex items-center justify-between border-b border-cloud-border pb-3">
              <div className="flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-yellow-active" />
                <h3 className="font-bold text-sm text-graphite">Connect Biometric Token</h3>
              </div>
              <button 
                onClick={() => setBiometricTargetMember(null)}
                className="text-graphite-muted hover:text-graphite p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-card bg-cloud-grey/60 border border-cloud-border">
              <img 
                src={biometricTargetMember.avatar} 
                alt={biometricTargetMember.name} 
                className="w-10 h-10 rounded-full object-cover border border-white" 
              />
              <div>
                <span className="font-extrabold text-graphite text-xs block">{biometricTargetMember.name}</span>
                <span className="text-[10px] text-graphite-muted">{biometricTargetMember.email}</span>
                <span className="text-[10px] text-yellow-active font-mono block mt-0.5">
                  Current Token: {biometricTargetMember.biometricId}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-graphite font-bold text-xs">New Optical Fingerprint Token ID</label>
                <button
                  type="button"
                  onClick={() => setCustomBioToken(`BIO-FP-${Math.floor(1000 + Math.random() * 9000)}`)}
                  className="text-[10px] font-bold text-yellow-active hover:underline"
                >
                  Generate Token
                </button>
              </div>
              <input
                type="text"
                required
                value={customBioToken}
                onChange={(e) => setCustomBioToken(e.target.value.toUpperCase())}
                placeholder="e.g. BIO-FP-8809"
                className="w-full px-3 py-2 rounded-input bg-white font-mono font-bold text-graphite border border-cloud-border focus:outline-none focus:border-yellow-sunshine text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-cloud-border">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setBiometricTargetMember(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  if (customBioToken.trim()) {
                    await updateMemberBiometric(biometricTargetMember.id, customBioToken.trim());
                    setBiometricTargetMember(null);
                  }
                }}
              >
                Connect to Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Member 360 Dossier Modal */}
      <MemberDossierModal
        member={dossierMember}
        isOpen={!!dossierMember}
        onClose={() => setDossierMember(null)}
      />

    </div>
  );
};
