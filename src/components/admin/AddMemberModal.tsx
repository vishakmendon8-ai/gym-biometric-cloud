import React, { useState, useEffect } from 'react';
import { useGym } from '../../context/GymContext';
import {
  X,
  UserPlus,
  Check,
  ShieldAlert,
  Fingerprint,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  CheckCircle2,
} from 'lucide-react';

function generateMemberPassword(): string {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `gym${digits}`;
}

export const AddMemberModal: React.FC = () => {
  const { isAddMemberOpen, setIsAddMemberOpen, addMember, plans, members } = useGym();

  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);
  const [planId, setPlanId] = useState('plan-monthly');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Success state so admin can immediately copy/share credentials with the member
  const [createdCreds, setCreatedCreds] = useState<{
    memberId: string;
    userId: string;
    password: string;
    planName: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const existingNumericIds = members
    .flatMap((m) => [m.loginUserId, m.biometricId])
    .map((val) => (val && /^\d+$/.test(val.trim()) ? Number(val.trim()) : 0))
    .filter((n) => n > 0);
  const suggestedUserId = String(
    existingNumericIds.length > 0 ? Math.max(...existingNumericIds) + 1 : 101
  );

  // Reset form with fresh User ID + generated password when modal opens
  useEffect(() => {
    if (isAddMemberOpen) {
      setUserId(suggestedUserId);
      setPassword(generateMemberPassword());
      setShowPassword(true);
      setPlanId(plans[0]?.id || 'plan-monthly');
      setFormError(null);
      setCreatedCreds(null);
      setCopied(false);
    }
  }, [isAddMemberOpen, suggestedUserId]);

  if (!isAddMemberOpen) return null;

  const handleCopyCredentials = async () => {
    if (!createdCreds) return;
    const text = `GymPro Member Login\nUser ID: ${createdCreds.userId}\nPassword: ${createdCreds.password}\n\nLog in on the Member App to complete your profile (Full Name, Age, Gender, Phone & optional Gmail).`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard fallback ignored
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawUserId = userId.trim();
    const trimmedPassword = password.trim();

    if (!rawUserId) {
      setFormError('Please enter a User ID for the member.');
      return;
    }
    if (trimmedPassword.length < 4) {
      setFormError('Password must be at least 4 characters.');
      return;
    }

    const cleanedUserId = /^\d+$/.test(rawUserId) ? String(Number(rawUserId)) : rawUserId;

    // Prevent duplicate User ID / Biometric ID collisions
    const conflict = members.find((m) => {
      const target = cleanedUserId.toLowerCase();
      return (
        (m.loginUserId && m.loginUserId.trim().toLowerCase() === target) ||
        (m.biometricId && m.biometricId.trim().toLowerCase() === target) ||
        m.id.toLowerCase() === target
      );
    });

    if (conflict) {
      setFormError(
        `User ID "${cleanedUserId}" is already assigned to ${conflict.name} (${conflict.id}). Choose a unique User ID.`
      );
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    const selectedPlan = plans.find((p) => p.id === planId) || plans[0];
    const now = new Date();
    const expiry = new Date();
    expiry.setMonth(now.getMonth() + selectedPlan.durationMonths);

    const created = await addMember({
      loginUserId: cleanedUserId,
      name: `Member #${cleanedUserId} (Profile Pending)`,
      email: '',
      phone: '',
      password: trimmedPassword,
      profileCompleted: false,
      avatar:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      status: 'active',
      joinDate: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      expiryDate: expiry.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      biometricId: cleanedUserId,
      biometricRegistered: true,
      daysLeft: selectedPlan.durationMonths * 30,
      totalCheckIns: 0,
      emergencyContact: '',
    });

    setIsSubmitting(false);
    setCreatedCreds({
      memberId: created.id,
      userId: cleanedUserId,
      password: trimmedPassword,
      planName: selectedPlan.name,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252A30]/65 backdrop-blur-sm animate-fade-in text-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#DCE3E8] overflow-hidden flex flex-col my-6">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9ECEF] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#FFD447] to-[#F5C62F] text-[#252A30] flex items-center justify-center font-black shadow-xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#252A30] leading-none">
                {createdCreds ? 'Member Credentials Ready' : 'Enroll New Member'}
              </h2>
              <p className="text-[11px] text-[#84909A] font-medium mt-0.5">
                {createdCreds
                  ? 'Share login details — member completes profile in the app'
                  : 'Create User ID & Password — member fills personal details on login'}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddMemberOpen(false)}
            className="p-1.5 rounded-lg text-[#84909A] hover:text-[#252A30] hover:bg-[#F5F6F2] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {createdCreds ? (
          /* Post-Creation Shareable Credentials Card */
          <div className="p-6 space-y-4">
            <div className="p-4 rounded-2xl bg-[#36A875]/10 border border-[#36A875]/30 flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#36A875] shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-[#252A30] text-xs">
                  Account Created ({createdCreds.memberId})
                </p>
                <p className="text-[11px] text-[#5A646E] mt-0.5">
                  Plan assigned: <strong>{createdCreds.planName}</strong>. Give the User ID and Password below to the member.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#252A30] text-white space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <span className="text-[11px] text-white/65 font-semibold">Member User ID</span>
                <span className="font-mono font-black text-base text-[#FFD447]">
                  {createdCreds.userId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/65 font-semibold">Login Password</span>
                <span className="font-mono font-black text-base text-white">
                  {createdCreds.password}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FFF8E7] border border-[#FFD447]/60 text-[11px] text-[#5A646E] space-y-1 leading-relaxed">
              <p>
                <strong className="text-[#252A30]">1. Member App:</strong> When the member logs in with User ID{' '}
                <code className="font-bold text-[#252A30]">{createdCreds.userId}</code>, they will enter their{' '}
                <strong>Full Name, Age, Gender (Male/Female), Phone Number, and optional Gmail</strong> to complete their profile.
              </p>
              <p>
                <strong className="text-[#252A30]">2. Secureye Machine:</strong> Enroll their fingerprint on the machine using the same User ID{' '}
                <code className="font-bold text-[#252A30]">{createdCreds.userId}</code>.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleCopyCredentials}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#F5F6F2] hover:bg-[#E9ECEF] border border-[#DCE3E8] text-[#252A30] font-black text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? 'Copied!' : 'Copy Credentials'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#FFD447] to-[#F5C62F] text-[#252A30] font-black text-xs shadow-md shadow-[#FFD447]/30 flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[2.6]" />
                <span>Done</span>
              </button>
            </div>
          </div>
        ) : (
          /* Admin-Only Enrollment Form: User ID + Password + Plan */
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Step Explanation */}
            <div className="p-3 rounded-xl bg-[#FFF8E7] border border-[#FFD447]/60 text-[11px] text-[#5A646E] leading-relaxed">
              Admin only creates the <strong className="text-[#252A30]">User ID</strong> and{' '}
              <strong className="text-[#252A30]">Password</strong>. The member logs into the Member App with these credentials and fills in their Full Name, Age, Gender, Phone Number, and optional Gmail to complete their profile.
            </div>

            {formError && (
              <div className="flex items-start gap-1.5 text-[11px] font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* User ID (also used as Secureye Biometric User ID) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-1.5 text-[#252A30] font-bold">
                  <Fingerprint className="w-3.5 h-3.5 text-[#E5B82A]" />
                  <span>Member User ID *</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setUserId(suggestedUserId);
                    setFormError(null);
                  }}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FFF6D6] text-[#9A7400] border border-[#F5C62F]/50 hover:bg-[#FFD447]/40 transition-colors"
                >
                  Use #{suggestedUserId}
                </button>
              </div>
              <input
                type="text"
                required
                placeholder={`e.g. ${suggestedUserId}`}
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  if (formError) setFormError(null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-[#252A30] font-mono font-bold text-sm focus:outline-none focus:border-[#FFD447] focus:bg-white transition-all"
              />
              <p className="text-[10px] text-[#84909A] mt-1">
                Used for both Member App login and Secureye fingerprint machine ID.
              </p>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="flex items-center gap-1.5 text-[#252A30] font-bold">
                  <KeyRound className="w-3.5 h-3.5 text-[#E5B82A]" />
                  <span>Login Password *</span>
                </label>
                <button
                  type="button"
                  onClick={() => setPassword(generateMemberPassword())}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F5F6F2] text-[#5A646E] border border-[#DCE3E8] hover:border-[#FFD447] hover:text-[#252A30] flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-2.5 h-2.5" />
                  <span>Generate</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={4}
                  placeholder="Create password for member"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="w-full px-3.5 pr-10 py-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-[#252A30] font-mono font-bold text-sm focus:outline-none focus:border-[#FFD447] focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#84909A] hover:text-[#252A30]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Membership Plan Assignment */}
            <div>
              <label className="block text-[#252A30] font-bold mb-1">Membership Plan</label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-[#252A30] font-bold focus:outline-none focus:border-[#FFD447] focus:bg-white transition-all"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₹{p.price.toLocaleString('en-IN')} / {p.durationMonths} Mo{' '}
                    {p.offerTag ? `(${p.offerTag})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-[#E9ECEF] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-[#F5F6F2] hover:bg-[#E9ECEF] text-[#252A30] font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD447] to-[#F5C62F] text-[#252A30] font-black text-xs shadow-md shadow-[#FFD447]/30 btn-jelly-yellow flex items-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[2.6]" />
                <span>{isSubmitting ? 'Creating...' : 'Create User ID & Password'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
