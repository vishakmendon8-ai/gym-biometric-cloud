import React, { useState, useEffect } from 'react';
import { useGym } from '../../context/GymContext';
import { X, UserPlus, Check, User, Phone, Mail, Calendar, MapPin, ShieldAlert, Fingerprint } from 'lucide-react';

export const AddMemberModal: React.FC = () => {
  const { isAddMemberOpen, setIsAddMemberOpen, addMember, plans } = useGym();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [dob, setDob] = useState('1998-05-15');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [address, setAddress] = useState('Surathkal, Mangalore');
  const [planId, setPlanId] = useState('plan-monthly');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [biometricUserId, setBiometricUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isAddMemberOpen) {
      setBiometricUserId('');
    }
  }, [isAddMemberOpen]);

  if (!isAddMemberOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    const selectedPlan = plans.find(p => p.id === planId) || plans[0];
    const now = new Date();
    const expiry = new Date();
    expiry.setMonth(now.getMonth() + selectedPlan.durationMonths);
    const cleanedBioId = biometricUserId.trim();

    await addMember({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      dob,
      gender,
      address,
      avatar: gender === 'Female' 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      status: 'active',
      joinDate: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      expiryDate: expiry.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      biometricId: cleanedBioId,
      biometricRegistered: cleanedBioId.length > 0,
      daysLeft: selectedPlan.durationMonths * 30,
      totalCheckIns: 0,
      emergencyContact: emergencyContact || 'Contact (+91 98765 00000)'
    });

    setIsSubmitting(false);
    setIsAddMemberOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#252A30]/65 backdrop-blur-sm animate-fade-in text-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#DCE3E8] overflow-hidden flex flex-col my-6">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E9ECEF] bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#FFD447] to-[#F5C62F] text-[#252A30] flex items-center justify-center font-black shadow-xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-[#252A30] leading-none">Add New Member</h2>
              <p className="text-[11px] text-[#84909A] font-medium mt-0.5">Enroll athlete and assign initial membership</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAddMemberOpen(false)}
            className="p-1.5 rounded-lg text-[#84909A] hover:text-[#252A30] hover:bg-[#F5F6F2] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[#252A30] font-bold mb-1">Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-[#252A30] font-semibold focus:outline-none focus:border-[#FFD447] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-[#252A30] font-bold mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="athlete@gympro.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-[#252A30] font-semibold focus:outline-none focus:border-[#FFD447] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="block text-[#252A30] font-bold mb-1">Mobile Number *</label>
              <input
                type="text"
                required
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-[#252A30] font-semibold focus:outline-none focus:border-[#FFD447] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-[#252A30] font-bold mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-[#252A30] font-semibold focus:outline-none focus:border-[#FFD447] focus:bg-white transition-all"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-[#252A30] font-bold mb-1">Date of Birth</label>
              <input
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-[#252A30] font-semibold focus:outline-none focus:border-[#FFD447] focus:bg-white transition-all"
              />
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
                  {p.name} — ₹{p.price.toLocaleString('en-IN')} / {p.durationMonths} Mo {p.offerTag ? `(${p.offerTag})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[#252A30] font-bold mb-1">Residential Address</label>
              <input
                type="text"
                placeholder="Street, City, Postal Code"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-[#252A30] font-semibold focus:outline-none focus:border-[#FFD447] focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-[#252A30] font-bold mb-1">Emergency Contact</label>
              <input
                type="text"
                placeholder="Name & Phone Number"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#F5F6F2] border border-[#DCE3E8] text-[#252A30] font-semibold focus:outline-none focus:border-[#FFD447] focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Optional Secureye Biometric User ID Link */}
          <div className="p-3.5 rounded-2xl bg-[#F5F6F2] border border-[#DCE3E8] space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-extrabold text-[#252A30]">
              <Fingerprint className="w-4 h-4 text-[#E5B82A]" />
              <span>Secureye Biometric User ID (Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 101 (ID enrolled on physical Secureye machine)"
              value={biometricUserId}
              onChange={(e) => setBiometricUserId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#DCE3E8] text-[#252A30] font-mono font-bold text-xs focus:outline-none focus:border-[#FFD447] transition-all"
            />
            <p className="text-[11px] text-[#84909A]">
              Enroll the member&apos;s fingerprint directly on your Secureye machine and enter that exact User ID here (or map it later in Biometric Management).
            </p>
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
              <span>{isSubmitting ? 'Registering...' : 'Save Member & Enroll'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
