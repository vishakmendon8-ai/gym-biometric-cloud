import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  CalendarCheck, 
  Coins, 
  ArrowUpRight, 
  ArrowDownRight, 
  UserPlus, 
  Fingerprint, 
  MonitorPlay, 
  CalendarPlus, 
  ChevronRight, 
  ChevronDown,
  ArrowRight
} from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  const { 
    members, 
    plans, 
    attendance, 
    accessLogs, 
    payments, 
    setCurrentTab, 
    setIsAddMemberOpen 
  } = useGym();

  const [trendRange, setTrendRange] = useState('Last 6 Months');

  // Dynamic calculations based on real data
  const totalMembersCount = members.length;
  const activeMembersCount = members.filter(m => m.status === 'active').length;
  const expiredMembersCount = members.filter(m => m.status === 'expired').length;
  const expiringSoonCount = members.filter(m => m.status === 'expiring').length;
  const todayAttendanceCount = attendance.length;
  const totalRevenue = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const monthlyRevenueStr = `₹${totalRevenue.toLocaleString('en-IN')}`;

  // SVG Chart Spline points for Jul - Dec
  // 0, 50, 100, 150, 200, 250, 300
  const chartPoints = [
    { month: 'Jul', count: 110, x: 20, y: 190 },
    { month: 'Aug', count: 160, x: 100, y: 155 },
    { month: 'Sep', count: 150, x: 180, y: 162 },
    { month: 'Oct', count: 205, x: 260, y: 120 },
    { month: 'Nov', count: 230, x: 340, y: 98 },
    { month: 'Dec', count: 281, x: 420, y: 60 }
  ];

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      
      {/* 1. TOP ROW: 6 KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        
        {/* Card 1: Total Members */}
        <div className="bg-white/95 rounded-2xl p-4 border border-[#DCE3E8]/80 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-full bg-[#FFF8E7] text-[#E5B82A] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-[11px] font-bold text-[#84909A] block leading-tight">Total Members</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-[#252A30] tracking-tight">{totalMembersCount}</span>
              <span className="text-[10px] font-black text-[#36A875] flex items-center gap-0.5">
                <span>↑</span> +8%
              </span>
            </div>
          </div>
          {/* Subtle bottom-right pastel accent */}
          <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-[#FFD447]/10 pointer-events-none blur-sm" />
        </div>

        {/* Card 2: Active */}
        <div className="bg-white/95 rounded-2xl p-4 border border-[#DCE3E8]/80 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-full bg-[#EBF7EE] text-[#36A875] flex items-center justify-center shrink-0">
              <UserCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-[11px] font-bold text-[#84909A] block leading-tight">Active</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-[#252A30] tracking-tight">{activeMembersCount}</span>
              <span className="text-[10px] font-black text-[#36A875] flex items-center gap-0.5">
                <span>↑</span> +12%
              </span>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-[#36A875]/10 pointer-events-none blur-sm" />
        </div>

        {/* Card 3: Expired */}
        <div className="bg-white/95 rounded-2xl p-4 border border-[#DCE3E8]/80 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-full bg-[#FDEEEE] text-[#DC5555] flex items-center justify-center shrink-0">
              <UserX className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-[11px] font-bold text-[#84909A] block leading-tight">Expired</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-[#252A30] tracking-tight">{expiredMembersCount}</span>
              <span className="text-[10px] font-black text-[#DC5555] flex items-center gap-0.5">
                <span>↓</span> -4%
              </span>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-[#DC5555]/10 pointer-events-none blur-sm" />
        </div>

        {/* Card 4: Expiring Soon */}
        <div className="bg-white/95 rounded-2xl p-4 border border-[#DCE3E8]/80 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-full bg-[#FFF8E7] text-[#EBAE43] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-[11px] font-bold text-[#84909A] block leading-tight">Expiring Soon</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-[#252A30] tracking-tight">{expiringSoonCount}</span>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-[#EBAE43]/10 pointer-events-none blur-sm" />
        </div>

        {/* Card 5: Today's Attendance */}
        <div className="bg-white/95 rounded-2xl p-4 border border-[#DCE3E8]/80 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-full bg-[#FFF4E5] text-[#E58A2A] flex items-center justify-center shrink-0">
              <CalendarCheck className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-[11px] font-bold text-[#84909A] block leading-tight">Today's Attendance</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-[#252A30] tracking-tight">{todayAttendanceCount}</span>
              <span className="text-[10px] font-black text-[#36A875] flex items-center gap-0.5">
                <span>↑</span> +6%
              </span>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-[#E58A2A]/10 pointer-events-none blur-sm" />
        </div>

        {/* Card 6: Monthly Revenue */}
        <div className="bg-white/95 rounded-2xl p-4 border border-[#DCE3E8]/80 shadow-xs relative overflow-hidden flex flex-col justify-between hover:shadow-md transition-all group">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-full bg-[#FFF8E7] text-[#E5B82A] flex items-center justify-center shrink-0">
              <Coins className="w-4 h-4 stroke-[2.2]" />
            </div>
          </div>
          <div className="mt-2.5">
            <span className="text-[11px] font-bold text-[#84909A] block leading-tight">Monthly Revenue</span>
            <div className="flex items-baseline justify-between mt-1 gap-1">
              <span className="text-lg xl:text-xl font-black text-[#252A30] tracking-tight whitespace-nowrap">{monthlyRevenueStr}</span>
              <span className="text-[10px] font-black text-[#36A875] flex items-center gap-0.5 shrink-0">
                <span>↑</span> +12%
              </span>
            </div>
          </div>
          <div className="absolute -bottom-6 -right-6 w-16 h-16 rounded-full bg-[#FFD447]/10 pointer-events-none blur-sm" />
        </div>

      </div>

      {/* 2. MIDDLE ROW: MEMBERSHIP TREND + PLAN DISTRIBUTION + QUICK ACTIONS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Card A: Membership Trend (5 Cols) */}
        <div className="lg:col-span-5 bg-white/95 rounded-2xl p-5 border border-[#DCE3E8]/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-sm font-black text-[#252A30]">Membership Trend</h2>
              <p className="text-[11px] text-[#84909A] font-medium">Member count over the last 6 months</p>
            </div>
            <div className="relative">
              <button className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#F5F6F2] hover:bg-[#E9ECEF] text-[11px] font-bold text-[#252A30] border border-[#DCE3E8] transition-all">
                <span>{trendRange}</span>
                <ChevronDown className="w-3 h-3 text-[#84909A]" />
              </button>
            </div>
          </div>

          {/* Interactive SVG Smooth Area Spline Chart */}
          <div className="w-full pt-4">
            <div className="relative w-full h-44">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 450 220" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="yellowAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFD447" stopOpacity="0.45" />
                    <stop offset="60%" stopColor="#FFD447" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#FFD447" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal reference grid lines */}
                {[0, 50, 100, 150, 200, 250, 300].map((val, idx) => {
                  const yPos = 210 - (val / 300) * 190;
                  return (
                    <g key={idx}>
                      <line x1="0" y1={yPos} x2="440" y2={yPos} stroke="#E9ECEF" strokeWidth="1" strokeDasharray={val === 0 ? "none" : "3,3"} />
                      <text x="-6" y={yPos + 3} textAnchor="end" fontSize="9" fill="#84909A" fontWeight="600">
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Area Fill */}
                <path
                  d="M 20 190 Q 60 170, 100 155 T 180 162 T 260 120 T 340 98 T 420 60 L 420 210 L 20 210 Z"
                  fill="url(#yellowAreaGradient)"
                />

                {/* Golden Line Stroke */}
                <path
                  d="M 20 190 Q 60 170, 100 155 T 180 162 T 260 120 T 340 98 T 420 60"
                  fill="none"
                  stroke="#FFD447"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />

                {/* Data Points */}
                {chartPoints.map((pt, i) => (
                  <g key={i}>
                    <circle cx={pt.x} cy={pt.y} r="5.5" fill="#FFFFFF" stroke="#FFD447" strokeWidth="3" className="hover:scale-125 transition-transform cursor-pointer" />
                    <text x={pt.x} y="228" textAnchor="middle" fontSize="10" fill="#84909A" fontWeight="bold">
                      {pt.month}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* Card B: Plan Distribution Donut Chart (4 Cols) */}
        <div className="lg:col-span-4 bg-white/95 rounded-2xl p-5 border border-[#DCE3E8]/80 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-black text-[#252A30]">Plan Distribution</h2>
            <p className="text-[11px] text-[#84909A] font-medium">Breakdown by active membership tiers</p>
          </div>

          <div className="flex items-center justify-between gap-4 py-2 my-auto">
            {/* Donut Chart SVG */}
            <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#E9ECEF" strokeWidth="14" />
                
                {/* Yearly: 8% (Circumference = 2 * PI * 38 = 238.76) */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#FFE79A" strokeWidth="14" strokeDasharray="238.76" strokeDashoffset="0" />
                
                {/* Half-Yearly: 12% */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#CBD5E1" strokeWidth="14" strokeDasharray="238.76" strokeDashoffset="19.1" />

                {/* Quarterly: 24% */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#252A30" strokeWidth="14" strokeDasharray="238.76" strokeDashoffset="47.75" />

                {/* Monthly: 56% */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#FFD447" strokeWidth="14" strokeDasharray="238.76" strokeDashoffset="105.05" />
              </svg>

              {/* Center Donut Label */}
              <div className="absolute text-center">
                <span className="text-lg font-black text-[#252A30] leading-none block">342</span>
                <span className="text-[10px] font-bold text-[#84909A] uppercase tracking-wider block mt-0.5">Members</span>
              </div>
            </div>

            {/* Legend Breakdown */}
            <div className="space-y-2 text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFD447] shrink-0" />
                <span className="text-[#252A30] text-[11px] font-bold">Monthly (56%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#252A30] shrink-0" />
                <span className="text-[#252A30] text-[11px] font-bold">Quarterly (24%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1] shrink-0" />
                <span className="text-[#252A30] text-[11px] font-bold">Half-Yearly (12%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#FFE79A] shrink-0" />
                <span className="text-[#252A30] text-[11px] font-bold">Yearly (8%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card C: Quick Actions (3 Cols) */}
        <div className="lg:col-span-3 bg-white/95 rounded-2xl p-5 border border-[#DCE3E8]/80 shadow-xs flex flex-col justify-between">
          <h2 className="text-sm font-black text-[#252A30] mb-3">Quick Actions</h2>

          <div className="space-y-2.5 flex-1 flex flex-col justify-between">
            {/* Action 1: Add Member (Primary Golden Yellow Button with Jelly Effect) */}
            <button
              onClick={() => setIsAddMemberOpen(true)}
              className="w-full p-3 rounded-xl bg-gradient-to-r from-[#FFD447] to-[#F5C62F] hover:from-[#F5C62F] hover:to-[#E5B82A] text-[#252A30] font-black text-xs flex items-center justify-between shadow-[0_4px_16px_rgba(255,212,71,0.4)] transition-all btn-jelly-yellow group"
            >
              <div className="flex items-center gap-2.5">
                <UserPlus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Member</span>
              </div>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Action 2: Enroll Biometric */}
            <button
              onClick={() => setCurrentTab('biometric')}
              className="w-full p-3 rounded-xl bg-white hover:bg-[#F5F6F2] border border-[#DCE3E8] text-[#252A30] font-bold text-xs flex items-center justify-between transition-all btn-jelly-secondary group"
            >
              <div className="flex items-center gap-2.5">
                <Fingerprint className="w-4 h-4 text-[#84909A] group-hover:text-[#252A30]" />
                <span>Enroll Biometric</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#84909A] group-hover:translate-x-1 group-hover:text-[#252A30] transition-all" />
            </button>

            {/* Action 3: Live Access Monitor */}
            <button
              onClick={() => setCurrentTab('access-monitor')}
              className="w-full p-3 rounded-xl bg-white hover:bg-[#F5F6F2] border border-[#DCE3E8] text-[#252A30] font-bold text-xs flex items-center justify-between transition-all btn-jelly-secondary group"
            >
              <div className="flex items-center gap-2.5">
                <MonitorPlay className="w-4 h-4 text-[#84909A] group-hover:text-[#252A30]" />
                <span>Live Access Monitor</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#84909A] group-hover:translate-x-1 group-hover:text-[#252A30] transition-all" />
            </button>

            {/* Action 4: Record Attendance */}
            <button
              onClick={() => setCurrentTab('attendance')}
              className="w-full p-3 rounded-xl bg-white hover:bg-[#F5F6F2] border border-[#DCE3E8] text-[#252A30] font-bold text-xs flex items-center justify-between transition-all btn-jelly-secondary group"
            >
              <div className="flex items-center gap-2.5">
                <CalendarPlus className="w-4 h-4 text-[#84909A] group-hover:text-[#252A30]" />
                <span>Record Attendance</span>
              </div>
              <ArrowRight className="w-4 h-4 text-[#84909A] group-hover:translate-x-1 group-hover:text-[#252A30] transition-all" />
            </button>
          </div>
        </div>

      </div>

      {/* 3. BOTTOM ROW: RECENT REGISTRATIONS & RECENT ACCESS LOGS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Box 1: Recent Registrations */}
        <div className="bg-white/95 rounded-2xl p-5 border border-[#DCE3E8]/80 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-[#252A30]">Recent Registrations</h2>
            <button 
              onClick={() => setCurrentTab('members')}
              className="text-xs font-bold text-[#E5B82A] hover:text-[#252A30] flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <span>→</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {members.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#F5F6F2]/70 border border-dashed border-[#DCE3E8] text-center space-y-2">
                <p className="text-xs font-bold text-[#252A30]">No members enrolled yet</p>
                <p className="text-[11px] text-[#84909A]">
                  Click Enroll Member to create a User ID and Password for your first member.
                </p>
              </div>
            ) : (
              members.slice(0, 5).map((member) => (
                <div
                  key={member.id}
                  className="p-3 rounded-xl bg-[#F5F6F2]/70 hover:bg-[#F5F6F2] border border-[#DCE3E8]/60 flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={member.avatar}
                      alt={member.name}
                      className="w-10 h-10 rounded-full object-cover border border-white shadow-xs"
                    />
                    <div>
                      <p className="text-xs font-black text-[#252A30] leading-tight">{member.name}</p>
                      <p className="text-[10px] font-mono text-[#84909A] font-bold">
                        ID: {member.loginUserId || member.biometricId || member.id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full bg-[#FFF8E7] text-[#252A30] border border-[#FFD447]/50 font-extrabold text-[10px]">
                      {member.planName}
                    </span>
                    <span className="text-[11px] font-semibold text-[#84909A] min-w-[65px] text-right">
                      {member.joinDate}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Box 2: Recent Access Logs */}
        <div className="bg-white/95 rounded-2xl p-5 border border-[#DCE3E8]/80 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-[#252A30]">Recent Access Logs</h2>
            <button 
              onClick={() => setCurrentTab('access-monitor')}
              className="text-xs font-bold text-[#E5B82A] hover:text-[#252A30] flex items-center gap-1 transition-colors"
            >
              <span>View All</span>
              <span>→</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {accessLogs.length === 0 ? (
              <div className="p-6 rounded-xl bg-[#F5F6F2]/70 border border-dashed border-[#DCE3E8] text-center space-y-2">
                <p className="text-xs font-bold text-[#252A30]">No access logs yet</p>
                <p className="text-[11px] text-[#84909A]">
                  Real fingerprint scans from your Secureye terminal will appear here automatically.
                </p>
              </div>
            ) : (
              accessLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-[#F5F6F2]/70 hover:bg-[#F5F6F2] border border-[#DCE3E8]/60 flex items-center justify-between transition-all"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={log.avatar}
                      alt={log.memberName}
                      className="w-10 h-10 rounded-full object-cover border border-white shadow-xs"
                    />
                    <p className="text-xs font-black text-[#252A30]">{log.memberName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] border ${
                        log.status === 'granted'
                          ? 'bg-[#EBF7EE] text-[#36A875] border-[#36A875]/30'
                          : 'bg-[#FDEEEE] text-[#DC5555] border-[#DC5555]/30'
                      }`}
                    >
                      {log.status === 'granted' ? 'Access Granted' : 'Access Denied'}
                    </span>
                    <span className="text-[11px] font-semibold text-[#84909A] min-w-[55px] text-right">
                      {log.time}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
