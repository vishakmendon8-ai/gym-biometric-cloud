import React, { useState } from 'react';
import { useGym } from '../../context/GymContext';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  Shield, 
  Smartphone, 
  LayoutDashboard, 
  Copy, 
  Check 
} from 'lucide-react';

export const TopNavbar: React.FC = () => {
  const { 
    currentTab, 
    searchQuery, 
    setSearchQuery, 
    notifications, 
    adminProfile, 
    markNotificationRead, 
    clearNotifications, 
    setCurrentTab,
    activeView,
    setActiveView
  } = useGym();
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  const copyUrl = (path: string, label: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5174';
    const fullUrl = `${origin}${path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedLink(label);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const tabTitles: Record<string, { title: string; subtitle: string }> = {
    'dashboard': { title: 'Dashboard', subtitle: 'Overview of your gym operations' },
    'overview': { title: 'Dashboard', subtitle: 'Overview of your gym operations' },
    'members': { title: 'Members', subtitle: 'Manage gym members, profiles & credentials' },
    'plans': { title: 'Membership Plans', subtitle: 'Configure access packages & promotional pricing' },
    'subscriptions': { title: 'Subscriptions', subtitle: 'Track active memberships, renewals & expiries' },
    'payments': { title: 'Payments', subtitle: 'Razorpay billing transactions & revenue records' },
    'biometric': { title: 'Biometric Management', subtitle: 'Secureye device registry, Firebase sync & live diagnostics' },
    'access-monitor': { title: 'Live Access Monitoring', subtitle: 'Hardware entrance monitor & real-time verification' },
    'attendance': { title: 'Attendance', subtitle: 'Daily facility check-in logs & visitor history' },
    'reports': { title: 'Reports & Analytics', subtitle: 'Export revenue, membership & retention metrics' },
    'settings': { title: 'Settings', subtitle: 'Facility preferences & turnstile parameters' },
  };

  const currentInfo = tabTitles[currentTab] || { title: 'Dashboard', subtitle: 'Overview of your gym operations' };

  return (
    <header className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-3 py-3 px-6 select-none bg-transparent">
      {/* Left: Page Title & Subtitle */}
      <div>
        <h1 className="text-2xl font-black text-[#252A30] tracking-tight leading-none">
          {currentInfo.title}
        </h1>
        <p className="text-xs text-[#84909A] font-medium mt-1">
          {currentInfo.subtitle}
        </p>
      </div>

      {/* Center/Right Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Global Search Pill */}
        <div className="relative hidden sm:block">
          <Search className="w-4 h-4 text-[#84909A] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-44 lg:w-56 pl-9 pr-3 py-1.5 rounded-full bg-white/95 border border-[#DCE3E8] text-xs font-semibold text-[#252A30] placeholder:text-[#84909A] focus:outline-none focus:border-[#FFD447] focus:ring-2 focus:ring-[#FFD447]/30 shadow-xs transition-all"
          />
        </div>

        {/* Notification Bell with Badge */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-8 h-8 rounded-full bg-white border border-[#DCE3E8] flex items-center justify-center text-[#252A30] hover:border-[#FFD447] shadow-xs transition-all relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-[#252A30]" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FFD447] text-[#252A30] font-black text-[9px] flex items-center justify-center shadow-xs border border-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-[#DCE3E8] p-3 z-50 animate-fade-in text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#E9ECEF] mb-2 px-1">
                <span className="font-extrabold text-[#252A30]">Notifications ({unreadCount})</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={clearNotifications}
                    className="text-[10px] font-bold text-[#84909A] hover:text-[#252A30]"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {notifications.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markNotificationRead(n.id)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all ${
                      n.isRead ? 'bg-[#F5F6F2]/60' : 'bg-[#FFF8E7] border border-[#FFD447]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#252A30]">{n.title}</span>
                      <span className="text-[10px] text-[#84909A]">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-[#84909A] mt-0.5 leading-snug">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-white border border-[#DCE3E8] hover:border-[#FFD447] shadow-xs transition-all group"
          >
            <img
              src={adminProfile.avatar}
              alt={adminProfile.name}
              className="w-7 h-7 rounded-full object-cover border border-[#DCE3E8]"
            />
            <span className="text-xs font-black text-[#252A30] hidden md:inline">{adminProfile.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#84909A] group-hover:text-[#252A30] transition-colors" />
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-[#DCE3E8] p-2 z-50 animate-fade-in text-xs">
              <div className="px-3 py-2 border-b border-[#E9ECEF] mb-1">
                <p className="font-extrabold text-[#252A30]">{adminProfile.name}</p>
                <p className="text-[10px] text-[#84909A] truncate">{adminProfile.email}</p>
              </div>
              <button
                onClick={() => {
                  setCurrentTab('settings');
                  setShowProfileMenu(false);
                }}
                className="w-full px-3 py-2 text-left rounded-xl hover:bg-[#F5F6F2] font-semibold text-[#252A30] flex items-center gap-2"
              >
                <Shield className="w-3.5 h-3.5 text-[#84909A]" />
                <span>Admin Settings</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
