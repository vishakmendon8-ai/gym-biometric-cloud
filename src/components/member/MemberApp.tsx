import React, { useState, useEffect } from 'react';
import { useGym } from '../../context/GymContext';
import { 
  ArrowLeft, 
  ArrowRight, 
  ChevronRight, 
  Bell, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Eye, 
  EyeOff, 
  Check, 
  CheckCircle2, 
  X, 
  Dumbbell, 
  Calendar, 
  CalendarCheck, 
  CreditCard, 
  Receipt, 
  Flame, 
  Settings, 
  LogOut, 
  Edit2, 
  Download, 
  ShieldCheck, 
  Crown, 
  Sparkles,
  Smartphone,
  ChevronLeft,
  Tag,
  Clock,
  Shield,
  KeyRound,
  FileText,
  AlertTriangle,
  Zap,
  Award,
  HeartPulse,
  Activity,
  Copy,
  Printer,
  Share2
} from 'lucide-react';
import { Plan, Member, PaymentRecord } from '../../types/gym';
import { LiquidBottomDock } from './LiquidBottomDock';
import { NotificationService } from '../../services/notificationService';

// All 16 distinct screens from the GymPro Mobile Application Specification
export type MemberScreen = 
  | 'splash'
  | 'login'
  | 'register'
  | 'profile-setup'
  | 'plans'
  | 'payment-summary'
  | 'razorpay-checkout'
  | 'payment-confirmation'
  | 'approval-status'
  | 'home'
  | 'membership-details'
  | 'attendance'
  | 'notifications'
  | 'profile'
  | 'payment-history'
  | 'renewal';

export const MemberApp: React.FC = () => {
  const { 
    members, 
    plans, 
    attendance, 
    payments, 
    notifications, 
    markNotificationRead,
    clearNotifications,
    addMember,
    recordPayment,
    updateMember,
    setActiveView 
  } = useGym();

  // Master Vishak Mendon data (standard reference member MEM10042)
  const masterVishak: Member = {
    id: 'MEM10042',
    name: 'Vishak Mendon',
    email: 'vishak@gympro.club',
    phone: '+91 98765 43210',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&fit=crop&crop=faces&q=80',
    planId: plans[0]?.id || 'plan-monthly',
    planName: 'Monthly Plan',
    status: 'active',
    startDate: '24 Nov 2025',
    joinDate: '24 Nov 2025',
    expiryDate: '24 Dec 2025',
    daysLeft: 18,
    totalCheckIns: 48,
    attendanceCount: 48,
    lastVisit: 'Today, 7:32 AM',
    lastCheckIn: 'Today, 7:32 AM',
    biometricId: 'BIO-10042',
    biometricEnrolled: true,
    biometricRegistered: true,
    gender: 'Male',
    dob: '1996-08-14',
    emergencyContact: '+91 98765 00112',
    healthNotes: 'Focus on Upper Body Strength & Hypertrophy'
  };

  // Check if session exists in localStorage, or URL param ?screen=...
  const getInitialScreen = (): MemberScreen => {
    if (typeof window === 'undefined') return 'splash';
    const params = new URLSearchParams(window.location.search);
    const screenParam = params.get('screen') as MemberScreen | null;
    if (screenParam) return screenParam;

    const savedMemberId = localStorage.getItem('gympro_member_session');
    if (savedMemberId) {
      const existing = members.find(m => m.id === savedMemberId);
      if (existing) {
        if (existing.profileCompleted === false) return 'profile-setup';
        return existing.status === 'pending' ? 'plans' : 'home';
      }
    }
    // New or unauthenticated visitor starts directly at the single splash screen
    return 'splash';
  };

  // Active authenticated member state
  const [currentMember, setCurrentMember] = useState<Member>(() => {
    if (typeof window !== 'undefined') {
      const savedMemberId = localStorage.getItem('gympro_member_session');
      if (savedMemberId) {
        const found = members.find(m => m.id === savedMemberId);
        if (found) return found;
      }
    }
    return masterVishak;
  });

  // Active Screen: Starts from splash if new, or home if already logged in
  const [currentScreen, setCurrentScreen] = useState<MemberScreen>(getInitialScreen);
  
  // Single Splash Screen States: Kinetic Progress & App Entrance
  const [splashProgress, setSplashProgress] = useState(0);
  const [enteringApp, setEnteringApp] = useState(false);

  const handleEnterApp = () => {
    if (enteringApp) return;
    setEnteringApp(true);
    setTimeout(() => {
      setEnteringApp(false);
      setSplashProgress(0);
      const savedMemberId = typeof window !== 'undefined' ? localStorage.getItem('gympro_member_session') : null;
      if (savedMemberId) {
        const existing = members.find(m => m.id === savedMemberId);
        if (existing) {
          if (existing.profileCompleted === false) {
            setCurrentScreen('profile-setup');
            return;
          }
          setCurrentScreen(existing.status === 'pending' ? 'plans' : 'home');
          return;
        }
      }
      setCurrentScreen('login');
    }, 450);
  };

  // Auto-progress kinetic entrance bar for splash screen
  useEffect(() => {
    if (currentScreen !== 'splash') return;
    setSplashProgress(0);
    setEnteringApp(false);

    let currentP = 0;
    const interval = setInterval(() => {
      currentP += 5;
      if (currentP >= 100) {
        setSplashProgress(100);
        clearInterval(interval);
        setTimeout(() => {
          handleEnterApp();
        }, 300);
      } else {
        setSplashProgress(currentP);
      }
    }, 95);

    return () => clearInterval(interval);
  }, [currentScreen]);



  // Form States: Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');

  // Password Recovery Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [recoveryOtp, setRecoveryOtp] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState(false);

  // Push Notification & Lock-Screen Alerts State
  const [pushPermission, setPushPermission] = useState<NotificationPermission>(() => {
    return NotificationService.getPermission();
  });
  const [testCountdown, setTestCountdown] = useState<number | null>(null);
  const [dismissPushBanner, setDismissPushBanner] = useState(false);

  // Auto-scan on load: If member's membership is expiring soon (<= 7 days), dispatch background push alert
  useEffect(() => {
    if (currentMember && currentMember.daysLeft <= 7) {
      NotificationService.dispatchExpiryAlert(currentMember).catch(() => {});
    }
  }, [currentMember]);

  // ----------------------------------------------------
  // Form States: Register (Screen 3)
  // ----------------------------------------------------
  const [regName, setRegName] = useState('Vishak Mendon');
  const [regPhone, setRegPhone] = useState('+91 98765 43210');
  const [regEmail, setRegEmail] = useState('vishak@gympro.club');
  const [regPassword, setRegPassword] = useState('password123');
  const [regConfirmPassword, setRegConfirmPassword] = useState('password123');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState('');

  // Next auto-generated serial Member ID
  const nextMemberId = `MEM${10000 + members.length + 42}`;

  // ----------------------------------------------------
  // Form States: Profile Completion (Screen 4 — filled by member on first login)
  // ----------------------------------------------------
  const [setupFullName, setSetupFullName] = useState('');
  const [setupAge, setSetupAge] = useState('');
  const [setupGender, setSetupGender] = useState<'Male' | 'Female'>('Male');
  const [setupPhone, setSetupPhone] = useState('+91 ');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupAvatar, setSetupAvatar] = useState('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&fit=crop&crop=faces&q=80');

  // ----------------------------------------------------
  // Membership & Checkout States (Screens 5, 6, 7, 8, 9, 16)
  // ----------------------------------------------------
  const [selectedPlanTab, setSelectedPlanTab] = useState<'all' | 'popular' | 'long-term'>('all');
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<Plan>(plans[0] || {
    id: 'plan-monthly',
    name: 'Monthly Plan',
    tagline: 'Standard access for committed lifters',
    price: 1499,
    durationMonths: 1,
    features: ['Gym Access (All Days)', 'Basic Trainer Support', 'Locker Access']
  });

  // Coupon code states
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponMessage, setCouponMessage] = useState('');

  // Razorpay Checkout states (Screen 7)
  const [razorpayMethod, setRazorpayMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [upiId, setUpiId] = useState('vishak@okhdfcbank');
  const [cardNumber, setCardNumber] = useState('4532 8921 7843 1092');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('382');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStepText, setPaymentStepText] = useState('Connecting to Razorpay...');

  // Latest Completed Transaction
  const [lastTransaction, setLastTransaction] = useState<{
    txId: string;
    amount: number;
    planName: string;
    date: string;
    status: string;
  }>({
    txId: 'pay_rzp_9841829048',
    amount: 1499,
    planName: 'Monthly Plan',
    date: '24 Nov 2025, 11:42 AM',
    status: 'Verified & Active'
  });

  // ----------------------------------------------------
  // Notification filter state (Screen 13)
  // ----------------------------------------------------
  const [notificationFilter, setNotificationFilter] = useState<'all' | 'membership' | 'payment' | 'announcements'>('all');

  // ----------------------------------------------------
  // Receipt modal state (Screen 15)
  // ----------------------------------------------------
  const [activeReceipt, setActiveReceipt] = useState<{
    id: string;
    amount: number;
    planName: string;
    date: string;
    invoiceNumber: string;
    method: string;
  } | null>(null);

  // Profile Edit Toast state
  const [profileSaveSuccess, setProfileSaveSuccess] = useState(false);

  // ----------------------------------------------------
  // Helper: Dumbbell Logo Component
  // ----------------------------------------------------
  const GymProLogo = ({ size = 'md', isLight = false }: { size?: 'sm' | 'md' | 'lg'; isLight?: boolean }) => {
    const isSm = size === 'sm';
    const isLg = size === 'lg';
    return (
      <div className="flex items-center gap-2 select-none">
        <div className={`flex items-center justify-center ${
          isSm ? 'w-7 h-7' : isLg ? 'w-12 h-12' : 'w-9 h-9'
        }`}>
          <div className="flex items-center">
            <div className={`rounded-xs bg-yellow-sunshine ${isSm ? 'w-1.5 h-4' : isLg ? 'w-2.5 h-7' : 'w-2 h-5'}`} />
            <div className={`bg-yellow-sunshine ${isSm ? 'w-3 h-1' : isLg ? 'w-5 h-1.5' : 'w-4 h-1'}`} />
            <div className={`rounded-xs bg-yellow-sunshine ${isSm ? 'w-1.5 h-4' : isLg ? 'w-2.5 h-7' : 'w-2 h-5'}`} />
          </div>
        </div>
        <span className={`font-black tracking-tight ${
          isSm ? 'text-base' : isLg ? 'text-2xl' : 'text-xl'
        } ${isLight ? 'text-white' : 'text-graphite'}`}>
          Gym<span className="text-yellow-sunshine">Pro</span>
        </span>
      </div>
    );
  };

  // ----------------------------------------------------
  // Helper no-op for backward compatibility inside screen renders
  // ----------------------------------------------------
  const renderBottomNav = (_tab: any) => null;

  // ----------------------------------------------------
  // ONE SPLASH SCREEN WITH DYNAMIC GYM ANIMATION & APP ENTRANCE
  // ----------------------------------------------------
  const renderSplashScreen = () => {
    const progressStatus = 
      splashProgress < 35 ? 'Calibrating Biometric Gates...' :
      splashProgress < 75 ? 'Syncing Cloud Workout Pass...' :
      splashProgress < 100 ? 'Access Verified • Entering App...' :
      'Welcome to GymPro!';

    return (
      <div className={`flex-1 flex flex-col justify-between bg-[#1B1E22] text-white relative overflow-hidden min-h-screen px-6 py-8 select-none transition-all duration-500 ${
        enteringApp ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}>
        {/* Ambient Moody Gym Backdrop */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-luminosity pointer-events-none scale-105"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&auto=format&fit=crop&q=80')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1B1E22]/95 via-[#252A30]/85 to-[#14171A] pointer-events-none" />

        {/* Ambient Golden Radial Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#FFD447]/15 blur-3xl pointer-events-none animate-gym-pulse" />

        {/* Top Header Row with GymPro Mark & Fast Skip Button */}
        <div className="relative z-10 flex items-center justify-between pt-2">
          {/* GymPro Dumbbell Mark */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div className="w-1.5 h-4.5 rounded-xs bg-[#FFD447]" />
              <div className="w-3.5 h-1 bg-[#FFD447]" />
              <div className="w-1.5 h-4.5 rounded-xs bg-[#FFD447]" />
            </div>
            <span className="font-black text-lg tracking-tight text-white">
              Gym<span className="text-[#FFD447]">Pro</span>
            </span>
          </div>

          <button
            onClick={handleEnterApp}
            className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-bold backdrop-blur-md transition-all active:scale-95 flex items-center gap-1 border border-white/15"
          >
            <span>Skip</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* CENTER GYM ANIMATION: Olympic Barbell Reps with Glowing Plates & Shockwaves */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center py-6 select-none">
          {/* Concentric Energy Shockwave Rings */}
          <div className="relative flex items-center justify-center w-64 h-64">
            <div className="absolute inset-4 rounded-full border-2 border-[#FFD447]/30 animate-gym-shockwave pointer-events-none" />
            <div className="absolute inset-10 rounded-full border border-[#FFD447]/45 animate-gym-pulse pointer-events-none" />
            <div className="absolute inset-16 rounded-full bg-gradient-to-b from-[#FFD447]/20 to-transparent blur-xl pointer-events-none" />

            {/* DYNAMIC ANIMATED BARBELL (Kinetic Olympic Weight Lifting Reps) */}
            <div className="relative z-10 animate-gym-lift animate-gym-glow flex items-center justify-center">
              <svg width="240" height="120" viewBox="0 0 240 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Center Knurled Steel Bar */}
                <rect x="25" y="56" width="190" height="8" rx="4" fill="url(#steelGradient)" />
                <rect x="75" y="56" width="90" height="8" fill="url(#knurlingPattern)" opacity="0.6" />
                <rect x="117" y="54" width="6" height="12" rx="1.5" fill="#FFD447" />

                {/* Left Weight Plates Assembly */}
                {/* Outer Collar */}
                <rect x="22" y="52" width="6" height="16" rx="2" fill="#E2E8F0" />
                {/* 10KG Outer Plate */}
                <rect x="30" y="32" width="10" height="56" rx="3" fill="#252A30" stroke="#FFD447" strokeWidth="2.5" />
                <rect x="33" y="38" width="4" height="44" rx="2" fill="#FFD447" opacity="0.85" />
                {/* 20KG Heavy Bumper Plate */}
                <rect x="42" y="18" width="14" height="84" rx="4" fill="#1B1E22" stroke="#FFD447" strokeWidth="3" />
                <rect x="46" y="24" width="6" height="72" rx="3" fill="#FFD447" />
                <circle cx="49" cy="60" r="14" fill="#252A30" stroke="#FFE37A" strokeWidth="2" />
                <text x="49" y="63" fill="#FFD447" fontSize="8" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">20</text>

                {/* Left Inner Collar Ring */}
                <rect x="58" y="50" width="7" height="20" rx="2" fill="#CBD5E1" />

                {/* Right Weight Plates Assembly */}
                {/* Right Inner Collar Ring */}
                <rect x="175" y="50" width="7" height="20" rx="2" fill="#CBD5E1" />
                {/* 20KG Heavy Bumper Plate */}
                <rect x="184" y="18" width="14" height="84" rx="4" fill="#1B1E22" stroke="#FFD447" strokeWidth="3" />
                <rect x="188" y="24" width="6" height="72" rx="3" fill="#FFD447" />
                <circle cx="191" cy="60" r="14" fill="#252A30" stroke="#FFE37A" strokeWidth="2" />
                <text x="191" y="63" fill="#FFD447" fontSize="8" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">20</text>
                {/* 10KG Outer Plate */}
                <rect x="200" y="32" width="10" height="56" rx="3" fill="#252A30" stroke="#FFD447" strokeWidth="2.5" />
                <rect x="203" y="38" width="4" height="44" rx="2" fill="#FFD447" opacity="0.85" />
                {/* Outer Collar */}
                <rect x="212" y="52" width="6" height="16" rx="2" fill="#E2E8F0" />

                {/* Gradients & Knurling Filters */}
                <defs>
                  <linearGradient id="steelGradient" x1="25" y1="60" x2="215" y2="60" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#94A3B8" />
                    <stop offset="0.5" stopColor="#F8FAFC" />
                    <stop offset="1" stopColor="#94A3B8" />
                  </linearGradient>
                  <pattern id="knurlingPattern" width="4" height="8" patternUnits="userSpaceOnUse">
                    <line x1="0" y1="0" x2="4" y2="8" stroke="#475569" strokeWidth="1" />
                    <line x1="4" y1="0" x2="0" y2="8" stroke="#475569" strokeWidth="1" />
                  </pattern>
                </defs>
              </svg>
            </div>
          </div>

          {/* Dynamic Workout Power Waveform SVG */}
          <div className="w-48 h-6 flex items-center justify-center -mt-2 opacity-85">
            <svg viewBox="0 0 200 30" className="w-full h-full overflow-visible">
              <path 
                d="M0 15 H40 L50 3 L62 27 L74 7 L86 21 L96 15 H200" 
                fill="none" 
                stroke="#FFD447" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="animate-gym-waveform"
              />
            </svg>
          </div>

          {/* Slogan & Power Title */}
          <div className="text-center mt-3 space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase leading-tight">
              Forge Your <span className="text-[#FFD447]">Greatness</span>
            </h1>
            <p className="text-xs text-cloud-grey/75 max-w-[280px] mx-auto font-medium leading-relaxed">
              Biometric Optical Check-Ins • Real-Time Attendance • Seamless Membership
            </p>
          </div>
        </div>

        {/* BOTTOM SECTION: Kinetic Entrance Loading Bar & Getting in the App */}
        <div className="relative z-10 w-full max-w-sm mx-auto space-y-4 pt-2">
          {/* Live Kinetic Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[11px] font-bold">
              <span className="text-white/80 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD447] animate-ping" />
                <span className="text-[#FFD447]">{progressStatus}</span>
              </span>
              <span className="font-mono text-white/70">{splashProgress}%</span>
            </div>

            <div className="h-2 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/15">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-[#FFE37A] via-[#FFD447] to-[#F5C227] transition-all duration-150 ease-out shadow-[0_0_12px_rgba(255,212,71,0.6)]"
                style={{ width: `${splashProgress}%` }}
              />
            </div>
          </div>

          {/* High-Impact Yellow "Enter GymPro" Button */}
          <button
            onClick={handleEnterApp}
            className="w-full py-4 px-6 rounded-2xl bg-[#FFD447] hover:bg-[#FFE066] active:scale-[0.98] text-[#252A30] font-black text-sm flex items-center justify-center gap-2 shadow-[0_8px_25px_rgba(255,212,71,0.45)] transition-all cursor-pointer"
          >
            <span>Enter GymPro</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>

          <p className="text-[10px] text-center text-white/50">
            Automated turnstile verification powered by Srinivas University GymPro
          </p>
        </div>
      </div>
    );
  };

  // ----------------------------------------------------
  // SCREEN 2: Login Screen
  // ----------------------------------------------------
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const rawInput = loginEmail.trim();
    const searchKey = rawInput.toLowerCase();
    const normalizedNumeric = /^\d+$/.test(rawInput) ? String(Number(rawInput)) : searchKey;

    if (!searchKey) {
      setLoginError('Please enter the User ID provided by your gym administrator.');
      return;
    }

    const matched = members.find((m) => {
      const loginId = (m.loginUserId || '').trim().toLowerCase();
      const bioId = (m.biometricId || '').trim().toLowerCase();
      const memberId = (m.id || '').trim().toLowerCase();
      const email = (m.email || '').trim().toLowerCase();
      const phone = (m.phone || '').trim();

      return (
        (loginId && (loginId === searchKey || loginId === normalizedNumeric)) ||
        (bioId && (bioId === searchKey || bioId === normalizedNumeric)) ||
        memberId === searchKey ||
        (email && email === searchKey) ||
        (phone && rawInput.length >= 6 && phone.includes(rawInput))
      );
    });

    if (matched) {
      const expectedPassword = matched.password || 'password123';
      if (loginPassword.trim() !== expectedPassword) {
        setLoginError('Invalid password. Please enter the exact password provided by your gym administrator.');
        return;
      }

      setCurrentMember(matched);
      if (typeof window !== 'undefined') {
        localStorage.setItem('gympro_member_session', matched.id);
      }

      // First-time login: member completes Full Name, Age, Gender, Phone & optional Gmail
      if (matched.profileCompleted === false) {
        setSetupFullName('');
        setSetupAge(matched.age ? String(matched.age) : '');
        setSetupGender(matched.gender === 'Female' ? 'Female' : 'Male');
        setSetupPhone(matched.phone || '+91 ');
        setSetupEmail(matched.email || '');
        setSetupError('');
        setCurrentScreen('profile-setup');
        return;
      }

      if (matched.status === 'pending') {
        setCurrentScreen('plans');
      } else {
        setCurrentScreen('home');
      }
    } else if (loginEmail.toLowerCase().includes('vishak') || loginEmail.includes('10042') || loginEmail.includes('98765')) {
      setCurrentMember(masterVishak);
      if (typeof window !== 'undefined') {
        localStorage.setItem('gympro_member_session', masterVishak.id);
      }
      setCurrentScreen('home');
    } else {
      setLoginError('Account not found. Please check the User ID provided by your gym owner.');
    }
  };

  const renderLoginScreen = () => (
    <div className="flex-1 flex flex-col justify-between bg-cloud p-5 text-graphite min-h-screen pb-16">
      <div>
        {/* Top Header Row with Back Arrow to Splash */}
        <div className="flex items-center justify-between pt-4 sm:pt-6">
          <button
            onClick={() => {
              setSplashProgress(0);
              setCurrentScreen('splash');
            }}
            className="w-8 h-8 rounded-full bg-white border border-cloud-border flex items-center justify-center text-graphite shadow-xs hover:border-yellow-sunshine transition-all active:scale-95"
            title="Back to Welcome Splash"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <GymProLogo size="md" />
          <div className="w-8" /> {/* Placeholder balance */}
        </div>

        {/* Login White Card */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-cloud-border/70 mt-6">
          <div className="text-center mb-5">
            <h2 className="text-xl font-black text-graphite tracking-tight">Member Sign In</h2>
            <p className="text-xs text-graphite-muted font-medium mt-1">
              Log in using the User ID &amp; Password given by your gym admin
            </p>
          </div>

          {/* Admin Credentials Info Callout */}
          <div className="mb-4 p-3 rounded-2xl bg-[#FFF8E7] border border-[#FFD447]/50 text-xs text-[#252A30] flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#252A30] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold leading-tight">First-Time Member Login</p>
              <p className="text-[11px] text-[#84909A] mt-0.5 leading-snug">
                Enter the User ID and Password created by your gym admin. You will complete your profile right after signing in.
              </p>
            </div>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-status-error/10 border border-status-error/20 text-status-error text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* User ID */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-graphite-muted">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="User ID (e.g. 349) or Member ID"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-cloud-grey/50 border border-transparent focus:border-yellow-sunshine focus:bg-white text-base sm:text-sm font-medium text-graphite outline-none transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-graphite-muted">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-cloud-grey/50 border border-transparent focus:border-yellow-sunshine focus:bg-white text-base sm:text-sm font-medium text-graphite outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-graphite-muted hover:text-graphite"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-[11px] pt-1">
              <label className="flex items-center gap-1.5 cursor-pointer text-graphite-muted font-medium">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-yellow-sunshine focus:ring-yellow-sunshine"
                />
                <span>Remember me</span>
              </label>
              <button 
                type="button" 
                onClick={() => {
                  setForgotEmail(loginEmail);
                  setForgotStep(1);
                  setRecoverySuccess(false);
                  setShowForgotModal(true);
                }}
                className="text-graphite-muted hover:text-graphite font-bold transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-yellow-sunshine hover:bg-yellow-hover text-graphite font-black text-xs sm:text-sm shadow-yellow-btn transition-all mt-2 active:scale-[0.99]"
            >
              Login with Credentials
            </button>

            {/* Quick Registered Accounts Autofill */}
            <div className="pt-2">
              <span className="text-[10px] font-bold text-graphite-muted block mb-1.5 uppercase tracking-wider">
                Quick Select (Admin Created Accounts)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Rahul Sharma', id: 'GYM0341', email: 'rahul.sharma@gmail.com' },
                  { label: 'Priya Singh', id: 'GYM0342', email: 'priya.singh@gmail.com' },
                  { label: 'Aman Verma', id: 'GYM0343', email: 'aman.verma@gmail.com' },
                ].map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    onClick={() => {
                      setLoginEmail(demo.email);
                      setLoginPassword('password123');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-cloud-grey/70 hover:bg-yellow-soft hover:text-graphite border border-cloud-border text-[10px] font-bold text-graphite-muted transition-all"
                  >
                    {demo.label} ({demo.id})
                  </button>
                ))}
              </div>
            </div>
          </form>

        </div>
      </div>

      {/* Footer Support Info */}
      <div className="text-center py-4 px-6 text-xs text-graphite-muted">
        Need an account or lost credentials?{' '}
        <span className="font-bold text-graphite block sm:inline mt-0.5">
          Visit the gym reception desk for credentials
        </span>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-cloud-border relative">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-cloud-grey text-graphite-muted hover:text-graphite"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-yellow-sunshine/20 text-graphite flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6 text-yellow-active" />
              </div>
              <h3 className="text-base font-black text-graphite">Password Recovery</h3>
              <p className="text-xs text-graphite-muted mt-0.5">
                {forgotStep === 1 && 'Enter your registered email to receive OTP'}
                {forgotStep === 2 && 'Enter 4-digit code sent to your email'}
                {forgotStep === 3 && 'Set a new secure password'}
              </p>
            </div>

            {forgotStep === 1 && (
              <div className="space-y-3">
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="Registered Email"
                  className="w-full px-4 py-3 rounded-xl bg-cloud-grey/50 border border-cloud-border text-sm outline-none focus:border-yellow-sunshine"
                />
                <button
                  onClick={() => setForgotStep(2)}
                  className="w-full py-3 rounded-xl bg-yellow-sunshine text-graphite font-black text-xs shadow-yellow-btn"
                >
                  Send OTP Code →
                </button>
              </div>
            )}

            {forgotStep === 2 && (
              <div className="space-y-4">
                <div className="flex justify-center gap-2">
                  {[0, 1, 2, 3].map((idx) => (
                    <input
                      key={idx}
                      type="text"
                      maxLength={1}
                      defaultValue={idx === 0 ? '7' : idx === 1 ? '4' : idx === 2 ? '1' : '9'}
                      className="w-12 h-12 text-center text-lg font-black bg-cloud-grey/60 rounded-xl border border-cloud-border focus:border-yellow-sunshine"
                    />
                  ))}
                </div>
                <button
                  onClick={() => setForgotStep(3)}
                  className="w-full py-3 rounded-xl bg-yellow-sunshine text-graphite font-black text-xs shadow-yellow-btn"
                >
                  Verify Code →
                </button>
              </div>
            )}

            {forgotStep === 3 && (
              <div className="space-y-3">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password (min 6 chars)"
                  className="w-full px-4 py-3 rounded-xl bg-cloud-grey/50 border border-cloud-border text-sm outline-none focus:border-yellow-sunshine"
                />
                <button
                  onClick={() => {
                    setRecoverySuccess(true);
                    setTimeout(() => {
                      setShowForgotModal(false);
                      setRecoverySuccess(false);
                    }, 1200);
                  }}
                  className="w-full py-3 rounded-xl bg-yellow-sunshine text-graphite font-black text-xs shadow-yellow-btn"
                >
                  {recoverySuccess ? 'Password Reset! Logging in...' : 'Reset Password'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // ----------------------------------------------------
  // SCREEN 3: Registration Screen
  // ----------------------------------------------------
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match');
      return;
    }

    try {
      // Create new member in shared backend
      const newMember = await addMember({
        name: regName,
        phone: regPhone,
        email: regEmail,
        planId: plans[0]?.id || 'plan-monthly',
        planName: plans[0]?.name || 'Monthly Plan',
        status: 'pending',
        joinDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        expiryDate: new Date(Date.now() + 30 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        biometricId: `BIO-${Math.floor(10000 + Math.random() * 90000)}`,
        biometricRegistered: false,
        daysLeft: 30,
        totalCheckIns: 0,
        avatar: setupAvatar,
        emergencyContact: '+91 98765 00112'
      });

      setCurrentMember(newMember);
      setCurrentScreen('profile-setup');
    } catch {
      // Fallback
      const fallbackMember: Member = {
        id: nextMemberId,
        name: regName,
        phone: regPhone,
        email: regEmail,
        planId: 'plan-monthly',
        planName: 'Monthly Plan',
        status: 'pending',
        joinDate: 'Today',
        expiryDate: 'In 30 Days',
        biometricId: `BIO-${nextMemberId.replace('MEM', '')}`,
        daysLeft: 30,
        totalCheckIns: 0,
        avatar: setupAvatar,
        emergencyContact: '+91 98765 00112'
      };
      setCurrentMember(fallbackMember);
      setCurrentScreen('profile-setup');
    }
  };

  const renderRegisterScreen = () => (
    <div className="flex-1 flex flex-col justify-between bg-cloud p-5 text-graphite min-h-screen pb-16">
      <div>
        {/* Top Logo */}
        <div className="flex justify-center pt-8 sm:pt-12 pb-5">
          <GymProLogo size="lg" />
        </div>

        {/* Register White Card */}
        <div className="bg-white rounded-3xl p-5 shadow-xs border border-cloud-border/70">
          <div className="text-center mb-4">
            <span className="inline-block px-3 py-1 rounded-full bg-yellow-soft text-yellow-active font-bold text-[10px] tracking-wide mb-1.5 border border-yellow-sunshine/40">
              Auto-Assigned ID: {nextMemberId}
            </span>
            <h2 className="text-xl font-black text-graphite tracking-tight">Create Account</h2>
            <p className="text-xs text-graphite-muted font-medium">Join GymPro Community</p>
          </div>

          {regError && (
            <div className="mb-3 p-2.5 rounded-xl bg-status-error/10 border border-status-error/20 text-status-error text-xs font-semibold">
              {regError}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            {/* Full Name */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-graphite-muted">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cloud-grey/50 border border-transparent focus:border-yellow-sunshine focus:bg-white text-base sm:text-sm font-medium text-graphite outline-none transition-all"
              />
            </div>

            {/* Mobile Number */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-graphite-muted">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                required
                placeholder="Mobile Number"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cloud-grey/50 border border-transparent focus:border-yellow-sunshine focus:bg-white text-base sm:text-sm font-medium text-graphite outline-none transition-all"
              />
            </div>

            {/* Email Address */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-graphite-muted">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                placeholder="Email Address"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-cloud-grey/50 border border-transparent focus:border-yellow-sunshine focus:bg-white text-base sm:text-sm font-medium text-graphite outline-none transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-graphite-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showRegPassword ? 'text' : 'password'}
                required
                placeholder="Password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-cloud-grey/50 border border-transparent focus:border-yellow-sunshine focus:bg-white text-base sm:text-sm font-medium text-graphite outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowRegPassword(!showRegPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-graphite-muted hover:text-graphite"
              >
                {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm Password */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-graphite-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showRegPassword ? 'text' : 'password'}
                required
                placeholder="Confirm Password"
                value={regConfirmPassword}
                onChange={(e) => setRegConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-cloud-grey/50 border border-transparent focus:border-yellow-sunshine focus:bg-white text-base sm:text-sm font-medium text-graphite outline-none transition-all"
              />
            </div>

            {/* Register Button */}
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-yellow-sunshine hover:bg-yellow-hover text-graphite font-black text-xs sm:text-sm shadow-yellow-btn transition-all mt-2 active:scale-[0.99]"
            >
              Register & Continue →
            </button>
          </form>
        </div>
      </div>

      {/* Footer Switch */}
      <div className="text-center py-4 text-xs text-graphite-muted">
        Already have an account?{' '}
        <button
          onClick={() => setCurrentScreen('login')}
          className="font-extrabold text-graphite hover:underline"
        >
          Login
        </button>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // SCREEN 4: Member Profile Completion Screen (after first login)
  // ----------------------------------------------------
  const handleProfileSetupSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanedName = setupFullName.trim();
    const parsedAge = Number(setupAge);
    const cleanedPhone = setupPhone.trim();
    const cleanedEmail = setupEmail.trim().toLowerCase();

    if (!cleanedName || cleanedName.length < 2) {
      setSetupError('Please enter your full name.');
      return;
    }
    if (!Number.isFinite(parsedAge) || parsedAge < 10 || parsedAge > 100) {
      setSetupError('Please enter a valid age (between 10 and 100).');
      return;
    }
    if (!cleanedPhone || cleanedPhone.replace(/\D/g, '').length < 10) {
      setSetupError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (cleanedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
      setSetupError('Please enter a valid Gmail / email address or leave it blank.');
      return;
    }

    setSetupError('');

    const updated: Member = {
      ...currentMember,
      name: cleanedName,
      age: Math.round(parsedAge),
      gender: setupGender,
      phone: cleanedPhone,
      email: cleanedEmail,
      avatar: setupAvatar,
      profileCompleted: true,
    };

    setCurrentMember(updated);
    await updateMember(currentMember.id, {
      name: updated.name,
      age: updated.age,
      gender: updated.gender,
      phone: updated.phone,
      email: updated.email,
      avatar: updated.avatar,
      profileCompleted: true,
    }).catch(() => {});

    setCurrentScreen(updated.status === 'pending' ? 'plans' : 'home');
  };

  const renderProfileSetupScreen = () => (
    <div className="flex-1 flex flex-col justify-between bg-cloud p-4 min-h-screen pb-16">
      <form onSubmit={handleProfileSetupSave} className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('gympro_member_session');
                }
                setCurrentScreen('login');
              }}
              className="w-8 h-8 rounded-full bg-white border border-cloud-border flex items-center justify-center text-graphite shadow-xs"
              title="Back to Sign In"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-base font-black text-graphite leading-tight">Complete Your Profile</h2>
              <p className="text-[11px] text-graphite-muted">
                User ID: <span className="font-mono font-bold text-graphite">{currentMember.loginUserId || currentMember.biometricId || currentMember.id}</span> • Fill details to activate app
              </p>
            </div>
          </div>
        </div>

        {/* Avatar Selection Card */}
        <div className="bg-white rounded-3xl p-4 border border-cloud-border shadow-xs text-center">
          <div className="w-16 h-16 rounded-full border-4 border-yellow-sunshine mx-auto overflow-hidden mb-2.5 shadow-md">
            <img src={setupAvatar} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <span className="text-[11px] font-bold text-graphite block mb-2">Profile Picture</span>
          <div className="flex justify-center gap-2.5">
            {[
              { id: 'av1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&fit=crop&crop=faces&q=80', label: 'Male 1' },
              { id: 'av2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&fit=crop&crop=faces&q=80', label: 'Male 2' },
              { id: 'av3', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&fit=crop&crop=faces&q=80', label: 'Female 1' },
              { id: 'av4', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300&fit=crop&crop=faces&q=80', label: 'Athlete' }
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSetupAvatar(preset.url)}
                className={`w-10 h-10 rounded-full overflow-hidden border-2 transition-all bg-cloud-grey relative ${
                  setupAvatar === preset.url ? 'border-yellow-sunshine scale-110 shadow-sm ring-2 ring-yellow-sunshine/40' : 'border-cloud-border opacity-70 hover:opacity-100'
                }`}
                title={preset.label}
              >
                <img
                  src={preset.url}
                  alt={preset.label}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {setupError && (
          <div className="p-3 rounded-xl bg-status-error/10 border border-status-error/25 text-status-error text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{setupError}</span>
          </div>
        )}

        {/* Member Details Form Card */}
        <div className="bg-white rounded-3xl p-5 border border-cloud-border shadow-xs space-y-4">
          {/* Full Name */}
          <div>
            <label className="text-xs font-bold text-graphite block mb-1.5">Full Name *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-graphite-muted">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={setupFullName}
                onChange={(e) => {
                  setSetupFullName(e.target.value);
                  if (setupError) setSetupError('');
                }}
                placeholder="Enter your full name"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-cloud-grey/50 border border-cloud-border text-sm font-semibold text-graphite outline-none focus:border-yellow-sunshine focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Age & Gender */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-4">
              <label className="text-xs font-bold text-graphite block mb-1.5">Age *</label>
              <input
                type="number"
                required
                min={10}
                max={100}
                inputMode="numeric"
                value={setupAge}
                onChange={(e) => {
                  setSetupAge(e.target.value);
                  if (setupError) setSetupError('');
                }}
                placeholder="e.g. 24"
                className="w-full px-3.5 py-2.5 rounded-xl bg-cloud-grey/50 border border-cloud-border text-sm font-semibold text-graphite outline-none focus:border-yellow-sunshine focus:bg-white transition-all"
              />
            </div>

            <div className="col-span-8">
              <label className="text-xs font-bold text-graphite block mb-1.5">Gender *</label>
              <div className="grid grid-cols-2 gap-2">
                {(['Male', 'Female'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      setSetupGender(g);
                      if (g === 'Female' && setupAvatar.includes('1507003211169')) {
                        setSetupAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&fit=crop&crop=faces&q=80');
                      } else if (g === 'Male' && setupAvatar.includes('1534528741775')) {
                        setSetupAvatar('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&fit=crop&crop=faces&q=80');
                      }
                    }}
                    className={`py-2.5 rounded-xl text-xs font-black transition-all border ${
                      setupGender === g
                        ? 'bg-yellow-sunshine border-yellow-sunshine text-graphite shadow-xs'
                        : 'bg-cloud-grey/40 border-cloud-border text-graphite-muted'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="text-xs font-bold text-graphite block mb-1.5">Phone Number *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-graphite-muted">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="tel"
                required
                value={setupPhone}
                onChange={(e) => {
                  setSetupPhone(e.target.value);
                  if (setupError) setSetupError('');
                }}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-cloud-grey/50 border border-cloud-border text-sm font-semibold text-graphite outline-none focus:border-yellow-sunshine focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Gmail (Optional) */}
          <div>
            <label className="text-xs font-bold text-graphite block mb-1.5">
              Gmail / Email <span className="text-graphite-muted font-medium">(Optional)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-graphite-muted">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={setupEmail}
                onChange={(e) => {
                  setSetupEmail(e.target.value);
                  if (setupError) setSetupError('');
                }}
                placeholder="yourname@gmail.com (optional)"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-cloud-grey/50 border border-cloud-border text-sm font-medium text-graphite outline-none focus:border-yellow-sunshine focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Complete Profile Action Button */}
        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-yellow-sunshine hover:bg-yellow-hover text-graphite font-black text-xs sm:text-sm shadow-yellow-btn transition-all active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
          <span>Complete Profile</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </form>
    </div>
  );

  // ----------------------------------------------------
  // SCREEN 5: Membership Plan Selection Screen
  // ----------------------------------------------------
  const renderMembershipPlansScreen = () => {
    const filteredPlans = plans.filter((p) => {
      if (selectedPlanTab === 'popular') return p.popular || p.name.includes('Quarterly');
      if (selectedPlanTab === 'long-term') return p.durationMonths >= 6;
      return true;
    });

    return (
      <div className="flex-1 flex flex-col justify-between bg-cloud min-h-screen pb-36">
        <div className="p-4 space-y-4">
          {/* Top Bar with Back Arrow */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setCurrentScreen('home')}
              className="w-8 h-8 rounded-full bg-white border border-cloud-border flex items-center justify-center text-graphite shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-base font-black text-graphite leading-tight">Membership Plans</h2>
              <p className="text-[11px] text-graphite-muted">Synced live from GymPro database</p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPlanTab('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedPlanTab === 'all'
                  ? 'bg-yellow-sunshine text-graphite shadow-xs'
                  : 'bg-white text-graphite-muted border border-cloud-border'
              }`}
            >
              All Plans
            </button>
            <button
              onClick={() => setSelectedPlanTab('popular')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedPlanTab === 'popular'
                  ? 'bg-yellow-sunshine text-graphite shadow-xs'
                  : 'bg-white text-graphite-muted border border-cloud-border'
              }`}
            >
              Popular
            </button>
            <button
              onClick={() => setSelectedPlanTab('long-term')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedPlanTab === 'long-term'
                  ? 'bg-yellow-sunshine text-graphite shadow-xs'
                  : 'bg-white text-graphite-muted border border-cloud-border'
              }`}
            >
              Long Term
            </button>
          </div>

          {/* Plan Cards */}
          <div className="space-y-4 pb-2">
            {filteredPlans.map((plan) => (
              <div 
                key={plan.id}
                className="bg-white rounded-3xl p-5 border border-cloud-border shadow-xs space-y-4 hover:border-yellow-sunshine/80 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-black text-graphite">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-lg font-black text-status-error">₹{plan.price.toLocaleString()}</span>
                      <span className="text-xs text-graphite-muted">/ {plan.durationMonths} {plan.durationMonths === 1 ? 'month' : 'months'}</span>
                    </div>
                  </div>

                  <div className="w-10 h-10 rounded-full bg-yellow-soft flex items-center justify-center text-graphite shadow-xs">
                    {plan.durationMonths >= 6 ? (
                      <Crown className="w-5 h-5 text-amber-600" />
                    ) : (
                      <Dumbbell className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                </div>

                {/* Benefits with checkmarks */}
                <div className="space-y-2 text-xs text-graphite">
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-yellow-active stroke-[3] shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setSelectedPlanForCheckout(plan);
                    setAppliedDiscount(0);
                    setCouponCode('');
                    setCurrentScreen('payment-summary');
                  }}
                  className="w-full py-3 rounded-xl bg-yellow-sunshine hover:bg-yellow-hover text-graphite font-black text-xs flex items-center justify-center gap-1.5 shadow-yellow-btn transition-all active:scale-[0.99]"
                >
                  <span>Choose Plan</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Nav */}
        {renderBottomNav('plans')}
      </div>
    );
  };

  // ----------------------------------------------------
  // SCREEN 6: Payment Summary Screen
  // ----------------------------------------------------
  const handleApplyCoupon = () => {
    if (couponCode.toUpperCase() === 'GYMPRO100') {
      setAppliedDiscount(100);
      setCouponMessage('Promo code applied: ₹100 Flat OFF');
    } else if (couponCode.toUpperCase() === 'WELCOME20') {
      const discount = Math.round(selectedPlanForCheckout.price * 0.2);
      setAppliedDiscount(discount);
      setCouponMessage('Welcome Offer applied: 20% OFF');
    } else {
      setAppliedDiscount(0);
      setCouponMessage('Invalid coupon code. Try GYMPRO100 or WELCOME20');
    }
  };

  const finalPayableAmount = Math.max(0, selectedPlanForCheckout.price - appliedDiscount);

  const renderPaymentSummaryScreen = () => (
    <div className="flex-1 flex flex-col justify-between bg-cloud min-h-screen pb-16">
      <div className="p-4 space-y-4">
        {/* Top Bar with Back Arrow */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => setCurrentScreen('plans')}
            className="w-8 h-8 rounded-full bg-white border border-cloud-border flex items-center justify-center text-graphite shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-black text-graphite leading-tight">Payment Summary</h2>
            <p className="text-[11px] text-graphite-muted">Step 3 of 4 • Review and apply promo</p>
          </div>
        </div>

        {/* Selected Plan Details Card */}
        <div className="bg-white rounded-3xl p-5 border border-cloud-border shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-yellow-soft flex items-center justify-center text-graphite shadow-xs shrink-0">
              <Dumbbell className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-base font-black text-graphite">{selectedPlanForCheckout.name}</h3>
              <p className="text-xs text-graphite-muted">{selectedPlanForCheckout.durationMonths} Month Duration Membership</p>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="p-3.5 rounded-2xl bg-cloud-grey/40 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-graphite-muted">Plan Base Fee</span>
              <span className="font-bold text-graphite">₹{selectedPlanForCheckout.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-graphite-muted">Registration / Joining Fee</span>
              <span className="font-bold text-status-success">FREE (₹0)</span>
            </div>
            {appliedDiscount > 0 && (
              <div className="flex justify-between items-center text-status-success font-bold">
                <span>Promotional Discount</span>
                <span>-₹{appliedDiscount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-[10px] text-graphite-muted pt-1 border-t border-cloud-border">
              <span>Includes 18% GST (CGST + SGST)</span>
              <span>₹{Math.round(finalPayableAmount * 0.18 / 1.18).toLocaleString()}</span>
            </div>
          </div>

          {/* Prominent Sunshine Yellow Total Box */}
          <div className="p-4 rounded-2xl bg-yellow-pale border border-yellow-sunshine flex justify-between items-center shadow-xs">
            <div>
              <span className="text-xs font-bold text-graphite uppercase tracking-wider block">Total Amount</span>
              <span className="text-[10px] text-graphite-muted">Zero hidden processing charges</span>
            </div>
            <span className="text-2xl font-black text-graphite">₹{finalPayableAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Coupon Code Card */}
        <div className="bg-white rounded-3xl p-4 border border-cloud-border shadow-xs space-y-2">
          <label className="text-xs font-bold text-graphite flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-yellow-active" />
            <span>Apply Coupon Code</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. GYMPRO100"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value)}
              className="flex-1 px-3.5 py-2 rounded-xl bg-cloud-grey/50 border border-cloud-border uppercase font-mono text-xs font-bold text-graphite outline-none focus:border-yellow-sunshine"
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              className="px-4 py-2 rounded-xl bg-graphite text-white font-bold text-xs hover:bg-graphite-light active:scale-95 transition-all"
            >
              Apply
            </button>
          </div>
          {couponMessage && (
            <p className={`text-[11px] font-semibold ${appliedDiscount > 0 ? 'text-status-success' : 'text-status-error'}`}>
              {couponMessage}
            </p>
          )}
          <div className="flex gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => { setCouponCode('GYMPRO100'); setAppliedDiscount(100); setCouponMessage('Flat ₹100 applied!'); }}
              className="text-[10px] font-bold px-2 py-1 rounded-lg bg-yellow-soft text-graphite border border-yellow-sunshine/40"
            >
              CODE: GYMPRO100
            </button>
            <button
              type="button"
              onClick={() => { setCouponCode('WELCOME20'); setAppliedDiscount(Math.round(selectedPlanForCheckout.price * 0.2)); setCouponMessage('20% discount applied!'); }}
              className="text-[10px] font-bold px-2 py-1 rounded-lg bg-yellow-soft text-graphite border border-yellow-sunshine/40"
            >
              CODE: WELCOME20
            </button>
          </div>
        </div>

        {/* Security Assurance */}
        <div className="p-3 rounded-2xl bg-white/70 border border-cloud-border/60 flex items-center justify-center gap-2 text-xs text-graphite-muted">
          <ShieldCheck className="w-4 h-4 text-status-success" />
          <span>256-bit Bank Grade Encryption • Razorpay Authorized</span>
        </div>

        {/* Proceed Button */}
        <button
          onClick={() => setCurrentScreen('razorpay-checkout')}
          className="w-full py-4 rounded-2xl bg-yellow-sunshine hover:bg-yellow-hover text-graphite font-black text-sm flex items-center justify-center gap-2 shadow-yellow-btn transition-all active:scale-[0.99]"
        >
          <span>Proceed to Razorpay ₹{finalPayableAmount.toLocaleString()}</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // SCREEN 7: Razorpay Payment Screen
  // ----------------------------------------------------
  const handleExecuteRazorpay = async () => {
    setIsProcessingPayment(true);
    setPaymentStepText('Securing connection to Razorpay Gateway...');

    setTimeout(() => {
      setPaymentStepText('Authorizing 256-bit bank encrypted transaction...');
    }, 700);

    setTimeout(async () => {
      setPaymentStepText('Verifying payment server-side & activating plan...');

      const txReference = `pay_rzp_${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const currentDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      
      // Update global context payment record
      try {
        await recordPayment({
          memberId: currentMember.id,
          memberName: currentMember.name,
          planName: selectedPlanForCheckout.name,
          amount: finalPayableAmount,
          date: currentDate,
          status: 'completed',
          paymentMethod: razorpayMethod === 'upi' ? 'UPI / QR' : razorpayMethod === 'card' ? 'Visa / MC' : 'Netbanking'
        });
      } catch {}

      // Update Member status & validity in shared database
      const updatedExpiry = new Date(Date.now() + selectedPlanForCheckout.durationMonths * 30 * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const updatedMember: Member = {
        ...currentMember,
        planId: selectedPlanForCheckout.id,
        planName: selectedPlanForCheckout.name,
        status: 'active',
        expiryDate: updatedExpiry,
        daysLeft: selectedPlanForCheckout.durationMonths * 30
      };

      setCurrentMember(updatedMember);
      updateMember(currentMember.id, updatedMember).catch(() => {});

      setLastTransaction({
        txId: txReference,
        amount: finalPayableAmount,
        planName: selectedPlanForCheckout.name,
        date: currentDate,
        status: 'Completed'
      });

      setIsProcessingPayment(false);
      setCurrentScreen('payment-confirmation');
    }, 1600);
  };

  const renderRazorpayCheckoutScreen = () => (
    <div className="flex-1 flex flex-col justify-between bg-cloud min-h-screen pb-16">
      <div className="p-4 space-y-4">
        {/* Top Header */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => setCurrentScreen('payment-summary')}
            disabled={isProcessingPayment}
            className="w-8 h-8 rounded-full bg-white border border-cloud-border flex items-center justify-center text-graphite shadow-xs disabled:opacity-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-black text-graphite leading-tight">Razorpay Secure Checkout</h2>
            <p className="text-[11px] text-graphite-muted">Official Payment Gateway</p>
          </div>
        </div>

        {/* Razorpay Brand Bar */}
        <div className="bg-[#0C2340] text-white rounded-3xl p-5 shadow-md flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 font-black text-lg italic tracking-tight">
              <span className="text-[#3395FF] text-xl">⚡</span>
              <span>Razorpay</span>
            </div>
            <p className="text-[11px] text-[#A0AEC0] mt-0.5">Order #{Math.floor(100000 + Math.random() * 900000)}</p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-[#A0AEC0] uppercase tracking-wider block">Payable</span>
            <span className="text-xl font-black text-yellow-sunshine">₹{finalPayableAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Methods Selector */}
        <div className="bg-white rounded-3xl p-5 border border-cloud-border shadow-xs space-y-4">
          <div className="grid grid-cols-3 gap-2 p-1 bg-cloud-grey/60 rounded-2xl">
            <button
              type="button"
              onClick={() => setRazorpayMethod('upi')}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                razorpayMethod === 'upi' ? 'bg-white text-graphite shadow-xs font-black' : 'text-graphite-muted'
              }`}
            >
              UPI & QR
            </button>
            <button
              type="button"
              onClick={() => setRazorpayMethod('card')}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                razorpayMethod === 'card' ? 'bg-white text-graphite shadow-xs font-black' : 'text-graphite-muted'
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setRazorpayMethod('netbanking')}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                razorpayMethod === 'netbanking' ? 'bg-white text-graphite shadow-xs font-black' : 'text-graphite-muted'
              }`}
            >
              NetBanking
            </button>
          </div>

          {/* UPI Method */}
          {razorpayMethod === 'upi' && (
            <div className="space-y-3 animate-fade-in">
              <label className="text-xs font-bold text-graphite block">Enter UPI ID (GPay / PhonePe / Paytm)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="username@bank"
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-cloud-grey/40 border border-cloud-border text-xs font-bold text-graphite outline-none focus:border-yellow-sunshine"
                />
              </div>

              {/* UPI Quick App Chips */}
              <div className="flex gap-2 pt-1">
                {['Google Pay', 'PhonePe', 'Paytm', 'BHIM UPI'].map((app) => (
                  <button
                    key={app}
                    type="button"
                    onClick={() => setUpiId(`vishak@${app.toLowerCase().replace(' ', '')}`)}
                    className="flex-1 py-1.5 rounded-lg border border-cloud-border text-[10px] font-bold text-graphite hover:border-yellow-sunshine bg-cloud-grey/30"
                  >
                    {app}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Cards Method */}
          {razorpayMethod === 'card' && (
            <div className="space-y-3 animate-fade-in">
              <div>
                <label className="text-xs font-bold text-graphite block mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cloud-grey/40 border border-cloud-border text-xs font-mono font-bold text-graphite outline-none focus:border-yellow-sunshine"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-graphite block mb-1">Expiry Date</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cloud-grey/40 border border-cloud-border text-xs font-bold text-graphite outline-none focus:border-yellow-sunshine"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-graphite block mb-1">CVV</label>
                  <input
                    type="password"
                    maxLength={3}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="•••"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cloud-grey/40 border border-cloud-border text-xs font-bold text-graphite outline-none focus:border-yellow-sunshine"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Net Banking */}
          {razorpayMethod === 'netbanking' && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-xs font-bold text-graphite block">Select Your Bank</label>
              <div className="grid grid-cols-2 gap-2">
                {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Punjab National'].map((bank) => (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => setSelectedBank(bank)}
                    className={`p-2.5 rounded-xl text-xs font-bold text-left border transition-all ${
                      selectedBank === bank
                        ? 'bg-yellow-sunshine/20 border-yellow-sunshine text-graphite'
                        : 'bg-cloud-grey/40 border-cloud-border text-graphite-muted'
                    }`}
                  >
                    {bank}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Processing State or Pay Button */}
        {isProcessingPayment ? (
          <div className="bg-white rounded-3xl p-6 border border-cloud-border text-center shadow-lg space-y-3 animate-fade-in">
            <div className="w-12 h-12 border-4 border-yellow-sunshine border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-black text-graphite">{paymentStepText}</p>
            <p className="text-[10px] text-graphite-muted">Please do not refresh or press back</p>
          </div>
        ) : (
          <button
            onClick={handleExecuteRazorpay}
            className="w-full py-4 rounded-2xl bg-yellow-sunshine hover:bg-yellow-hover text-graphite font-black text-sm flex items-center justify-center gap-2 shadow-yellow-btn transition-all active:scale-[0.99]"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Pay Now ₹{finalPayableAmount.toLocaleString()} →</span>
          </button>
        )}
      </div>
    </div>
  );

  // ----------------------------------------------------
  // SCREEN 8: Payment Confirmation Screen
  // ----------------------------------------------------
  const renderPaymentConfirmationScreen = () => (
    <div className="flex-1 flex flex-col justify-between bg-cloud p-5 min-h-screen pb-16 text-graphite">
      <div className="space-y-4 pt-4 text-center">
        {/* Animated Green Badge */}
        <div className="w-20 h-20 rounded-full bg-status-success/15 border border-status-success/30 text-status-success flex items-center justify-center mx-auto shadow-md">
          <CheckCircle2 className="w-12 h-12" />
        </div>

        <div>
          <span className="inline-block px-3 py-1 rounded-full bg-status-success/20 text-status-success font-black text-[10px] uppercase tracking-wider mb-2">
            Payment Verified & Authorized
          </span>
          <h2 className="text-2xl font-black text-graphite tracking-tight">Payment Successful!</h2>
          <p className="text-xs text-graphite-muted mt-1 max-w-xs mx-auto">
            Your transaction has been confirmed and verified via Razorpay Server Gateway.
          </p>
        </div>

        {/* Transaction Summary Card */}
        <div className="bg-white rounded-3xl p-5 border border-cloud-border shadow-xs text-left space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-cloud-border">
            <span className="text-xs text-graphite-muted font-medium">Transaction ID</span>
            <div className="flex items-center gap-1">
              <span className="text-xs font-mono font-bold text-graphite">{lastTransaction.txId}</span>
              <button 
                onClick={() => alert(`Copied TX ID: ${lastTransaction.txId}`)}
                className="text-graphite-muted hover:text-graphite"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-graphite-muted">Plan Activated</span>
            <span className="font-bold text-graphite">{lastTransaction.planName}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-graphite-muted">Amount Paid</span>
            <span className="font-black text-graphite text-base">₹{lastTransaction.amount.toLocaleString()}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-graphite-muted">Date & Time</span>
            <span className="font-medium text-graphite">{lastTransaction.date}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-graphite-muted">Payment Gateway</span>
            <span className="font-bold text-sky-600">Razorpay Encrypted</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => setActiveReceipt({
              id: lastTransaction.txId,
              amount: lastTransaction.amount,
              planName: lastTransaction.planName,
              date: lastTransaction.date,
              invoiceNumber: `INV-${Math.floor(10000 + Math.random() * 90000)}`,
              method: 'Razorpay Instant'
            })}
            className="w-full py-3 rounded-2xl bg-white border border-cloud-border hover:bg-cloud-grey/40 text-graphite font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Official Tax Invoice</span>
          </button>

          <button
            onClick={() => setCurrentScreen('approval-status')}
            className="w-full py-3.5 rounded-2xl bg-yellow-sunshine hover:bg-yellow-hover text-graphite font-black text-xs sm:text-sm shadow-yellow-btn transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <span>Proceed to Membership Activation</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // SCREEN 9: Membership Approval Status Screen
  // ----------------------------------------------------
  const renderApprovalStatusScreen = () => (
    <div className="flex-1 flex flex-col justify-between bg-cloud p-4 min-h-screen pb-16 text-graphite">
      <div className="space-y-4">
        {/* Top Header */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => setCurrentScreen('home')}
            className="w-8 h-8 rounded-full bg-white border border-cloud-border flex items-center justify-center text-graphite shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-black text-graphite leading-tight">Membership Approval Status</h2>
            <p className="text-[11px] text-graphite-muted">Real-time Admin & Hardware Verification</p>
          </div>
        </div>

        {/* Status Banner Card */}
        <div className="bg-graphite text-white rounded-3xl p-5 shadow-md relative overflow-hidden">
          <div className="flex items-start justify-between mb-3 relative z-10">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-status-success/20 text-status-success font-black text-[10px] tracking-wide border border-status-success/30 mb-2">
                <span className="w-2 h-2 rounded-full bg-status-success" />
                ACTIVE & VERIFIED
              </span>
              <h3 className="text-xl font-black text-white">{currentMember.planName}</h3>
              <p className="text-xs text-cloud-grey/70 mt-0.5">Valid til {currentMember.expiryDate}</p>
            </div>

            <div className="w-14 h-14 rounded-full border-[3px] border-yellow-sunshine bg-graphite/80 flex flex-col items-center justify-center text-center shrink-0">
              <span className="text-base font-black text-yellow-sunshine leading-none">{currentMember.daysLeft}</span>
              <span className="text-[8px] font-bold text-white/80 leading-tight mt-0.5">Days Left</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md text-xs space-y-1 relative z-10">
            <div className="flex justify-between">
              <span className="text-white/70">Member ID</span>
              <span className="font-mono font-bold text-yellow-sunshine">{currentMember.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/70">Admin Database Link</span>
              <span className="font-bold text-status-success">Connected (gym001-50a97)</span>
            </div>
          </div>
        </div>

        {/* Biometric Link Guidance */}
        <div className="bg-white rounded-3xl p-5 border border-cloud-border shadow-xs space-y-3">
          <h4 className="text-xs font-black text-graphite uppercase tracking-wider">Access Enrollment Steps</h4>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-status-success/20 text-status-success flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div>
                <p className="text-xs font-bold text-graphite">Online Subscription Paid</p>
                <p className="text-[11px] text-graphite-muted">Razorpay verification verified server-side.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-yellow-soft text-yellow-active flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-graphite">Front Desk Biometric Hardware Linking</p>
                <p className="text-[11px] text-graphite-muted">
                  Present Member ID <strong className="text-graphite">{currentMember.id}</strong> at the reception scanner to register optical fingerprint for turnstile gate access.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-cloud-grey text-graphite flex items-center justify-center shrink-0 mt-0.5">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-graphite">Real-time Attendance Sync</p>
                <p className="text-[11px] text-graphite-muted">Check-ins at hardware turnstile appear live in your app.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enter Dashboard Button */}
        <button
          onClick={() => setCurrentScreen('home')}
          className="w-full py-4 rounded-2xl bg-yellow-sunshine hover:bg-yellow-hover text-graphite font-black text-xs sm:text-sm shadow-yellow-btn transition-all active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <span>Enter Member Home Dashboard</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );

  // ----------------------------------------------------
  // SCREEN 10: Member Home Dashboard Screen
  // ----------------------------------------------------
  const renderHomeScreen = () => (
    <div className="flex-1 flex flex-col justify-between bg-cloud min-h-screen pb-36 relative overflow-hidden">
      {/* Soft Ambient Background Orbs */}
      <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-yellow-sunshine/10 blur-3xl pointer-events-none" />
      <div className="absolute top-80 -left-16 w-64 h-64 rounded-full bg-graphite/5 blur-3xl pointer-events-none" />

      <div className="p-4 space-y-4 relative z-10">
        {/* Top Header Row */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <h2 className="text-xl font-black text-graphite leading-tight tracking-tight">
              Hi, {currentMember.name.split(' ')[0]} 👋
            </h2>
            <p className="text-xs text-graphite-muted font-medium mt-0.5">
              Stay consistent, stay stronger!
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Bell Icon with Badge */}
            <button
              onClick={() => setCurrentScreen('notifications')}
              className="w-10 h-10 rounded-full bg-white border border-cloud-border flex items-center justify-center text-graphite relative shadow-xs hover:border-yellow-sunshine transition-all active:scale-95"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-status-error ring-1 ring-white" />
            </button>

            {/* Member Avatar */}
            <button
              onClick={() => setCurrentScreen('profile')}
              className="w-10 h-10 rounded-full border-2 border-yellow-sunshine overflow-hidden shadow-xs transition-transform active:scale-95"
            >
              <img
                src={currentMember.avatar}
                alt={currentMember.name}
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>

        {/* Lock-Screen & App-Closed Notification Permission Prompt */}
        {pushPermission !== 'granted' && !dismissPushBanner && (
          <div className="bg-gradient-to-r from-[#252A30] to-[#1E2328] text-white rounded-2xl p-3.5 border border-yellow-sunshine/30 shadow-xs flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-yellow-sunshine/20 text-yellow-sunshine flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-white leading-tight">Enable Lock-Screen Alerts</h4>
                <p className="text-[10px] text-cloud-grey/80 truncate">
                  Get expiry notices even when your app is closed or phone is locked.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={async () => {
                  const perm = await NotificationService.requestPermission();
                  setPushPermission(perm);
                }}
                className="px-2.5 py-1 rounded-lg bg-yellow-sunshine text-graphite font-black text-[10px] shadow-xs hover:bg-yellow-hover transition-all"
              >
                Enable
              </button>
              <button
                onClick={() => setDismissPushBanner(true)}
                className="p-1 text-cloud-grey/60 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Urgent Expiry Banner (if membership is ending in <= 7 days) */}
        {currentMember.daysLeft <= 7 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-3.5 shadow-xs flex items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-black text-amber-900">
                    Membership Ending in {currentMember.daysLeft} Day{currentMember.daysLeft !== 1 ? 's' : ''}!
                  </h4>
                  <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 text-[9px] font-black uppercase">
                    Urgent
                  </span>
                </div>
                <p className="text-[10px] text-amber-800/80 mt-0.5">
                  Push & SMS carrier alerts queued. Turnstile gate locks once expired.
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentScreen('renewal')}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-[11px] shadow-xs flex items-center gap-1 shrink-0 transition-all active:scale-95"
            >
              <span>Renew</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Active Membership Card (Deep Graphite #252A30) */}
        <div className="bg-graphite text-white rounded-3xl p-5 relative overflow-hidden shadow-md">
          {/* Subtle gym background overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-luminosity pointer-events-none"
            style={{ backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&auto=format&fit=crop&q=80')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-graphite via-graphite/85 to-transparent pointer-events-none" />
          
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-status-success/20 text-status-success font-bold text-[10px] tracking-wide mb-2 border border-status-success/30">
                <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
                Active Membership
              </span>
              <h3 className="text-xl font-black text-white">{currentMember.planName}</h3>
              <p className="text-xs text-cloud-grey/70 mt-0.5">Valid til {currentMember.expiryDate}</p>
            </div>

            {/* Circular Ring Countdown */}
            <div className="relative w-16 h-16 rounded-full border-[3.5px] border-yellow-sunshine bg-graphite/80 flex flex-col items-center justify-center text-center shrink-0 shadow-[0_0_15px_rgba(255,212,71,0.25)]">
              <span className="text-lg font-black text-yellow-sunshine leading-none">
                {currentMember.daysLeft}
              </span>
              <span className="text-[9px] font-bold text-white/80 leading-tight mt-0.5">
                Days Left
              </span>
            </div>
          </div>

          {/* Single Full-width Renew Membership Button */}
          <div className="relative z-10 pt-1">
            <button
              onClick={() => setCurrentScreen('renewal')}
              className="w-full py-3.5 rounded-2xl bg-yellow-sunshine hover:bg-yellow-hover text-graphite font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-yellow-btn transition-all active:scale-[0.99]"
            >
              <span>Renew Membership</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Quick Action Grid (3 Cards: Attendance, Plans, Payments) */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => setCurrentScreen('attendance')}
            className="bg-white rounded-2xl p-3.5 flex flex-col items-center justify-center text-center border border-cloud-border/70 hover:border-yellow-sunshine/80 shadow-xs transition-all active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-xl bg-cloud-grey/60 group-hover:bg-yellow-soft flex items-center justify-center text-graphite mb-1.5 transition-colors">
              <CalendarCheck className="w-4 h-4 text-graphite" strokeWidth={2.2} />
            </div>
            <span className="text-xs font-bold text-graphite">Attendance</span>
          </button>

          <button
            onClick={() => setCurrentScreen('plans')}
            className="bg-white rounded-2xl p-3.5 flex flex-col items-center justify-center text-center border border-cloud-border/70 hover:border-yellow-sunshine/80 shadow-xs transition-all active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-xl bg-cloud-grey/60 group-hover:bg-yellow-soft flex items-center justify-center text-graphite mb-1.5 transition-colors">
              <CreditCard className="w-4 h-4 text-graphite" strokeWidth={2.2} />
            </div>
            <span className="text-xs font-bold text-graphite">Plans</span>
          </button>

          <button
            onClick={() => setCurrentScreen('payment-history')}
            className="bg-white rounded-2xl p-3.5 flex flex-col items-center justify-center text-center border border-cloud-border/70 hover:border-yellow-sunshine/80 shadow-xs transition-all active:scale-95 group"
          >
            <div className="w-10 h-10 rounded-xl bg-cloud-grey/60 group-hover:bg-yellow-soft flex items-center justify-center text-graphite mb-1.5 transition-colors">
              <Receipt className="w-4 h-4 text-graphite" strokeWidth={2.2} />
            </div>
            <span className="text-xs font-bold text-graphite">Payments</span>
          </button>
        </div>

        {/* Recent Visit Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-black text-graphite">Recent Visit</h4>
            <button
              onClick={() => setCurrentScreen('attendance')}
              className="text-xs font-bold text-graphite-muted hover:text-graphite transition-colors"
            >
              View All
            </button>
          </div>

          <div className="bg-white rounded-2xl p-3.5 flex items-center justify-between border border-cloud-border/70 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-status-success/15 border border-status-success/20 text-status-success flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-graphite">{currentMember.lastVisit || 'Today, 7:32 AM'}</p>
                <p className="text-[11px] text-graphite-muted">Check-in Successful • Turnstile Gate A</p>
              </div>
            </div>

            <div className="w-6 h-6 rounded-full bg-status-success/20 text-status-success flex items-center justify-center">
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Nav (Screen 10: Home active) */}
      {renderBottomNav('home')}
    </div>
  );

  // ----------------------------------------------------
  // SCREEN 11: Membership Details Screen
  // ----------------------------------------------------
  const renderMembershipDetailsScreen = () => (
    <div className="flex-1 flex flex-col justify-between bg-cloud min-h-screen pb-36">
      <div className="p-4 space-y-4">
        {/* Top Bar with Back Arrow */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => setCurrentScreen('profile')}
            className="w-8 h-8 rounded-full bg-white border border-cloud-border flex items-center justify-center text-graphite shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-black text-graphite leading-tight">Membership Details</h2>
            <p className="text-[11px] text-graphite-muted">Digital Pass & Inclusions</p>
          </div>
        </div>

        {/* Digital Membership Card (Deep Graphite) */}
        <div className="bg-graphite text-white rounded-3xl p-5 shadow-lg border border-graphite-light relative overflow-hidden">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-yellow-sunshine flex items-center justify-center text-graphite shadow-xs">
                <Dumbbell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">{currentMember.planName}</h3>
                <span className="text-[10px] text-yellow-sunshine font-bold">MEMBER ID: {currentMember.id}</span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-full bg-status-success/20 text-status-success text-[10px] font-bold border border-status-success/30">
              Active
            </span>
          </div>

          {/* Barcode & Turnstile Pass */}
          <div className="p-3 bg-white rounded-2xl text-center space-y-1 my-3">
            <div className="h-10 flex items-center justify-center gap-1 overflow-hidden px-2">
              {[2, 4, 1, 3, 5, 2, 6, 1, 3, 2, 4, 1, 5, 2, 3, 6, 1, 4, 2].map((w, i) => (
                <div key={i} style={{ width: `${w * 2}px` }} className="h-full bg-graphite" />
              ))}
            </div>
            <span className="text-[10px] font-mono tracking-widest text-graphite font-bold">{currentMember.id}-2025-GATE-OK</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/10 text-white/80">
            <div>
              <span className="text-[10px] text-white/60 block">Member Name</span>
              <span className="font-bold">{currentMember.name}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-white/60 block">Valid Until</span>
              <span className="font-bold text-yellow-sunshine">{currentMember.expiryDate}</span>
            </div>
          </div>
        </div>

        {/* Dates & Validity Breakdown */}
        <div className="bg-white rounded-3xl p-4 border border-cloud-border shadow-xs space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-graphite-muted flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-graphite" />
              <span>Start Date</span>
            </span>
            <span className="font-bold text-graphite">{currentMember.startDate || '24 Nov 2025'}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-graphite-muted flex items-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-graphite" />
              <span>Expiry Date</span>
            </span>
            <span className="font-bold text-graphite">{currentMember.expiryDate}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-graphite-muted flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-graphite" />
              <span>Days Remaining</span>
            </span>
            <span className="font-black text-status-success">{currentMember.daysLeft} Days</span>
          </div>
        </div>

        {/* Plan Benefits Checklist */}
        <div className="bg-white rounded-3xl p-5 border border-cloud-border shadow-xs space-y-3">
          <h4 className="text-xs font-black text-graphite">Plan Benefits & Privileges</h4>
          <div className="space-y-2 text-xs text-graphite">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-yellow-active stroke-[3] shrink-0" />
              <span>Full Access to Strength & Cardio Zones</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-yellow-active stroke-[3] shrink-0" />
              <span>Dedicated Lockers & Shower Facilities</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-yellow-active stroke-[3] shrink-0" />
              <span>Complimentary Fitness & Body Composition Assessment</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-yellow-active stroke-[3] shrink-0" />
              <span>Optical Biometric Turnstile Express Check-in</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setCurrentScreen('renewal')}
          className="w-full py-3.5 rounded-2xl bg-yellow-sunshine hover:bg-yellow-hover text-graphite font-black text-xs sm:text-sm shadow-yellow-btn transition-all active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <span>Renew or Upgrade Plan</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>

      {/* Bottom Nav */}
      {renderBottomNav('profile')}
    </div>
  );

  // ----------------------------------------------------
  // SCREEN 12: Attendance History Screen
  // ----------------------------------------------------
  const renderAttendanceScreen = () => {
    const attendedDays = [8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24];

    return (
      <div className="flex-1 flex flex-col justify-between bg-cloud min-h-screen pb-36">
        <div className="p-4 space-y-4">
          {/* Top Bar with Back Arrow */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setCurrentScreen('home')}
              className="w-8 h-8 rounded-full bg-white border border-cloud-border flex items-center justify-center text-graphite shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-base font-black text-graphite leading-tight">Attendance History</h2>
              <p className="text-[11px] text-graphite-muted">Hardware Biometric Verified Logs</p>
            </div>
          </div>

          {/* 2 Stat Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-3xl p-4 border border-cloud-border shadow-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-full bg-yellow-soft flex items-center justify-center text-amber-500">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                </div>
                <span className="text-2xl font-black text-graphite">{currentMember.totalCheckIns || 48}</span>
              </div>
              <p className="text-xs font-bold text-graphite-muted">Total Visits</p>
            </div>

            <div className="bg-white rounded-3xl p-4 border border-cloud-border shadow-xs">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-7 h-7 rounded-full bg-yellow-soft flex items-center justify-center text-amber-500">
                  <Calendar className="w-3.5 h-3.5" />
                </div>
                <span className="text-2xl font-black text-graphite">12</span>
              </div>
              <p className="text-xs font-bold text-graphite-muted">This Month</p>
            </div>
          </div>

          {/* Interactive Dec 2025 Calendar */}
          <div className="bg-white rounded-3xl p-5 border border-cloud-border shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-cloud-border">
              <button className="p-1 rounded-full hover:bg-cloud-grey text-graphite-muted hover:text-graphite">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-black text-graphite tracking-tight">Dec 2025</span>
              <button className="p-1 rounded-full hover:bg-cloud-grey text-graphite-muted hover:text-graphite">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-graphite-muted">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold">
              <span className="text-cloud-border py-1.5">30</span>
              {[1, 2, 3, 4, 5, 6].map(d => (
                <span key={d} className="py-1.5 text-graphite-muted font-medium">{d}</span>
              ))}

              {[7, 8, 9, 10, 11, 12, 13].map(d => {
                const attended = attendedDays.includes(d);
                return (
                  <span
                    key={d}
                    className={`py-1.5 rounded-full flex items-center justify-center ${
                      attended ? 'bg-yellow-sunshine text-graphite font-black shadow-xs' : 'text-graphite-muted font-medium'
                    }`}
                  >
                    {d}
                  </span>
                );
              })}

              {[14, 15, 16, 17, 18, 19, 20].map(d => {
                const attended = attendedDays.includes(d);
                return (
                  <span
                    key={d}
                    className={`py-1.5 rounded-full flex items-center justify-center ${
                      attended ? 'bg-yellow-sunshine text-graphite font-black shadow-xs' : 'text-graphite-muted font-medium'
                    }`}
                  >
                    {d}
                  </span>
                );
              })}

              {[21, 22, 23, 24, 25, 26, 27].map(d => {
                const attended = attendedDays.includes(d);
                return (
                  <span
                    key={d}
                    className={`py-1.5 rounded-full flex items-center justify-center ${
                      attended ? 'bg-yellow-sunshine text-graphite font-black shadow-xs' : 'text-graphite-muted font-medium'
                    }`}
                  >
                    {d}
                  </span>
                );
              })}

              {[28, 29, 30, 31].map(d => (
                <span key={d} className="py-1.5 text-graphite-muted font-medium">{d}</span>
              ))}
            </div>
          </div>

          {/* Recent Check-in Logs */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-graphite">Recent Check-in Records</h4>
            
            <div className="space-y-2">
              {[
                { time: 'Today, 7:32 AM', gate: 'Turnstile Gate A', status: 'Granted' },
                { time: 'Yesterday, 6:45 PM', gate: 'Turnstile Gate B', status: 'Granted' },
                { time: '22 Dec 2025, 7:15 AM', gate: 'Turnstile Gate A', status: 'Granted' },
                { time: '21 Dec 2025, 8:00 AM', gate: 'Turnstile Gate A', status: 'Granted' }
              ].map((rec, i) => (
                <div key={i} className="bg-white rounded-2xl p-3.5 border border-cloud-border shadow-xs flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-status-success/15 text-status-success flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-graphite">{rec.time}</p>
                      <p className="text-[10px] text-graphite-muted">{rec.gate}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-status-success/20 text-status-success">
                    {rec.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3 rounded-2xl bg-white border border-cloud-border text-[11px] text-graphite-muted flex items-center gap-2">
            <Lock className="w-4 h-4 text-graphite shrink-0" />
            <span>Attendance records are hardware-verified by GymPro Biometric Gate System and cannot be altered manually.</span>
          </div>
        </div>

        {/* Bottom Nav */}
        {renderBottomNav('attendance')}
      </div>
    );
  };

  // ----------------------------------------------------
  // SCREEN 13: Notifications Screen
  // ----------------------------------------------------
  const renderNotificationsScreen = () => {
    const defaultNotifs = [
      {
        id: '1',
        title: 'Membership Expiring Soon',
        desc: 'Your membership will expire in 3 days. Renew now to avoid turnstile gate lockout.',
        time: '2h ago',
        type: 'membership',
        iconBg: 'bg-yellow-soft text-amber-600',
        icon: <Bell className="w-4 h-4" />
      },
      {
        id: '2',
        title: 'Payment Successful',
        desc: '₹1,499 paid for Monthly Plan via Razorpay. Tax Invoice generated.',
        time: '1d ago',
        type: 'payment',
        iconBg: 'bg-status-success/15 text-status-success',
        icon: <CheckCircle2 className="w-4 h-4" />
      },
      {
        id: '3',
        title: 'Membership Activated',
        desc: 'Your Monthly Plan is active with optical biometric access granted.',
        time: '1d ago',
        type: 'membership',
        iconBg: 'bg-graphite text-yellow-sunshine',
        icon: <Dumbbell className="w-4 h-4" />
      },
      {
        id: '4',
        title: 'Facility Announcement',
        desc: 'Gym will remain open extended hours this Saturday for powerlifting workshop.',
        time: '2d ago',
        type: 'announcements',
        iconBg: 'bg-yellow-soft text-amber-600',
        icon: <Sparkles className="w-4 h-4" />
      }
    ];

    const filteredNotifs = defaultNotifs.filter(n => {
      if (notificationFilter === 'all') return true;
      return n.type === notificationFilter;
    });

    return (
      <div className="flex-1 flex flex-col justify-between bg-cloud min-h-screen pb-36">
        <div className="p-4 space-y-4">
          {/* Top Bar with Back Arrow */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentScreen('home')}
                className="w-8 h-8 rounded-full bg-white border border-cloud-border flex items-center justify-center text-graphite shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-base font-black text-graphite leading-tight">Notifications</h2>
                <p className="text-[11px] text-graphite-muted">Broadcast Alerts & Receipts</p>
              </div>
            </div>

            <button
              onClick={clearNotifications}
              className="text-[11px] font-bold text-graphite-muted hover:text-graphite transition-colors"
            >
              Mark all read
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'membership', label: 'Membership' },
              { id: 'payment', label: 'Payment' },
              { id: 'announcements', label: 'Announce' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setNotificationFilter(tab.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  notificationFilter === tab.id
                    ? 'bg-yellow-sunshine text-graphite shadow-xs'
                    : 'bg-white text-graphite-muted border border-cloud-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Background & Lock-Screen Alerts Card (Delivers even when app is closed / phone turned off) */}
          <div className="bg-white rounded-3xl p-4 border border-cloud-border shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-yellow-soft flex items-center justify-center text-graphite">
                  <Bell className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-graphite">Lock-Screen & Offline Alerts</h3>
                  <p className="text-[10px] text-graphite-muted">Service Worker + Cellular SMS Queue</p>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                pushPermission === 'granted' 
                  ? 'bg-status-success/15 text-status-success border-status-success/30' 
                  : 'bg-yellow-soft text-amber-700 border-yellow-sunshine/40'
              }`}>
                {pushPermission === 'granted' ? '● System Push Active' : '● Setup Required'}
              </span>
            </div>

            <p className="text-[11px] text-graphite-muted leading-relaxed">
              When your membership is ending, alerts are pushed directly to your lock screen. If your phone is powered off, the notification is queued in telecommunication carrier servers and delivered the instant your device turns back on.
            </p>

            {/* Test Push Button with 4s Countdown */}
            <div className="pt-1 border-t border-cloud-border/60 flex items-center justify-between">
              <span className="text-[10px] text-graphite font-semibold">
                {testCountdown !== null 
                  ? `⏳ Close/Lock phone now! Firing in ${testCountdown}s...` 
                  : 'Verify on your device:'}
              </span>

              <button
                onClick={async () => {
                  if (pushPermission !== 'granted') {
                    const perm = await NotificationService.requestPermission();
                    setPushPermission(perm);
                    if (perm !== 'granted') return;
                  }

                  let count = 4;
                  setTestCountdown(count);
                  const timer = setInterval(() => {
                    count--;
                    if (count > 0) {
                      setTestCountdown(count);
                    } else {
                      clearInterval(timer);
                      setTestCountdown(null);
                      NotificationService.dispatchExpiryAlert(currentMember);
                    }
                  }, 1000);
                }}
                disabled={testCountdown !== null}
                className="px-3 py-1.5 rounded-xl bg-yellow-sunshine hover:bg-yellow-hover text-graphite font-black text-[11px] shadow-xs flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{testCountdown !== null ? `Testing (${testCountdown}s)` : 'Test Lock-Screen Alert'}</span>
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {filteredNotifs.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-3xl p-4 border border-cloud-border shadow-xs flex items-start gap-3.5 hover:border-yellow-sunshine/80 transition-all"
              >
                <div className={`w-10 h-10 rounded-2xl ${item.iconBg} flex items-center justify-center shrink-0 shadow-xs mt-0.5`}>
                  {item.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-graphite">{item.title}</h3>
                    <span className="text-[10px] text-graphite-muted font-medium">{item.time}</span>
                  </div>
                  <p className="text-[11px] text-graphite-muted mt-1 leading-snug">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Nav */}
        {renderBottomNav('notifications')}
      </div>
    );
  };

  // ----------------------------------------------------
  // SCREEN 14: Member Profile Screen
  // ----------------------------------------------------
  const handleProfileUpdate = () => {
    updateMember(currentMember.id, currentMember).catch(() => {});
    setProfileSaveSuccess(true);
    setTimeout(() => setProfileSaveSuccess(false), 2000);
  };

  const renderProfileScreen = () => (
    <div className="flex-1 flex flex-col justify-between bg-cloud min-h-screen pb-36">
      <div className="p-4 space-y-4">
        {/* Top Bar with Back Arrow */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => setCurrentScreen('home')}
            className="w-8 h-8 rounded-full bg-white border border-cloud-border flex items-center justify-center text-graphite shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-black text-graphite leading-tight">Member Profile</h2>
            <p className="text-[11px] text-graphite-muted">Account ID: {currentMember.id}</p>
          </div>
        </div>

        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl p-5 border border-cloud-border shadow-xs flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-yellow-sunshine overflow-hidden shadow-xs">
              <img
                src={currentMember.avatar}
                alt={currentMember.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-yellow-sunshine text-graphite flex items-center justify-center shadow-xs">
              <Edit2 className="w-3 h-3" />
            </div>
          </div>

          <div>
            <h3 className="text-base font-black text-graphite">{currentMember.name}</h3>
            <p className="text-xs font-mono font-bold text-graphite-muted">{currentMember.id}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-status-success/20 text-status-success font-bold text-[10px]">
              {currentMember.planName} • Active
            </span>
          </div>
        </div>

        {/* Editable Personal Details */}
        <div className="bg-white rounded-3xl p-5 border border-cloud-border shadow-xs space-y-3">
          <div className="flex justify-between items-center pb-1">
            <h4 className="text-xs font-black text-graphite uppercase tracking-wider">Personal Information</h4>
            {profileSaveSuccess && (
              <span className="text-[10px] font-bold text-status-success animate-fade-in">Saved!</span>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-graphite-muted block mb-1">Phone Number</label>
            <input
              type="tel"
              value={currentMember.phone}
              onChange={(e) => setCurrentMember({ ...currentMember, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-cloud-grey/40 border border-cloud-border text-xs font-bold text-graphite outline-none focus:border-yellow-sunshine"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-graphite-muted block mb-1">Registered Email</label>
            <input
              type="email"
              value={currentMember.email}
              onChange={(e) => setCurrentMember({ ...currentMember, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-cloud-grey/40 border border-cloud-border text-xs font-bold text-graphite outline-none focus:border-yellow-sunshine"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-graphite-muted block mb-1">Emergency Contact</label>
            <input
              type="tel"
              value={currentMember.emergencyContact}
              onChange={(e) => setCurrentMember({ ...currentMember, emergencyContact: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-cloud-grey/40 border border-cloud-border text-xs font-bold text-graphite outline-none focus:border-yellow-sunshine"
            />
          </div>

          <button
            onClick={handleProfileUpdate}
            className="w-full py-2.5 rounded-xl bg-graphite hover:bg-graphite-light text-white font-black text-xs transition-all active:scale-95"
          >
            Update Details
          </button>
        </div>

        {/* Navigation Menu List */}
        <div className="bg-white rounded-3xl p-2 border border-cloud-border shadow-xs divide-y divide-cloud-border/60">
          <button
            onClick={() => setCurrentScreen('membership-details')}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-cloud-grey/30 rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cloud-grey/70 flex items-center justify-center text-graphite">
                <CreditCard className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-graphite">Membership Details</span>
            </div>
            <ChevronRight className="w-4 h-4 text-graphite-muted" />
          </button>

          <button
            onClick={() => setCurrentScreen('payment-history')}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-cloud-grey/30 rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cloud-grey/70 flex items-center justify-center text-graphite">
                <Receipt className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-graphite">Payment History & Invoices</span>
            </div>
            <ChevronRight className="w-4 h-4 text-graphite-muted" />
          </button>

          <button
            onClick={() => setCurrentScreen('attendance')}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-cloud-grey/30 rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-cloud-grey/70 flex items-center justify-center text-graphite">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-graphite">Attendance Records</span>
            </div>
            <ChevronRight className="w-4 h-4 text-graphite-muted" />
          </button>

          <button
            onClick={() => setCurrentScreen('notifications')}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-cloud-grey/30 rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-yellow-soft flex items-center justify-center text-graphite">
                <Bell className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <span className="text-xs font-bold text-graphite block">Lock-Screen & Expiry Alerts</span>
                <span className="text-[10px] text-graphite-muted font-medium">Delivers even if phone is off or app closed</span>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-status-success/15 text-status-success text-[10px] font-bold">
              Active
            </span>
          </button>

          <button
            onClick={() => {
              setSplashProgress(0);
              setCurrentScreen('splash');
            }}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-cloud-grey/30 rounded-2xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-yellow-soft flex items-center justify-center text-graphite">
                <Sparkles className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <span className="text-xs font-bold text-graphite block">Replay Gym Splash Screen</span>
                <span className="text-[10px] text-graphite-muted font-medium">View dynamic gym animation & entrance</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-graphite-muted" />
          </button>

          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                localStorage.removeItem('gympro_member_session');
              }
              setCurrentScreen('splash');
            }}
            className="w-full p-3 flex items-center justify-between text-left hover:bg-red-50 rounded-2xl transition-colors text-status-error"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-status-error/15 flex items-center justify-center text-status-error">
                <LogOut className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold">Logout</span>
            </div>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Nav */}
      {renderBottomNav('profile')}
    </div>
  );

  // ----------------------------------------------------
  // SCREEN 15: Payment History Screen
  // ----------------------------------------------------
  const renderPaymentHistoryScreen = () => {
    const historyItems = [
      { id: 'pay_rzp_10042', amount: 1499, planName: 'Monthly Plan', date: '24 Nov 2025', invoice: 'INV-2025-1104', method: 'Razorpay UPI' },
      { id: 'pay_rzp_08412', amount: 3999, planName: 'Quarterly Plan', date: '24 Aug 2025', invoice: 'INV-2025-0824', method: 'Razorpay Card' },
      { id: 'pay_rzp_07101', amount: 1499, planName: 'Monthly Plan', date: '24 Jul 2025', invoice: 'INV-2025-0724', method: 'Razorpay NetBanking' }
    ];

    return (
      <div className="flex-1 flex flex-col justify-between bg-cloud min-h-screen pb-36">
        <div className="p-4 space-y-4">
          {/* Top Bar with Back Arrow */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => setCurrentScreen('profile')}
              className="w-8 h-8 rounded-full bg-white border border-cloud-border flex items-center justify-center text-graphite shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-base font-black text-graphite leading-tight">Payment History</h2>
              <p className="text-[11px] text-graphite-muted">Invoices & Receipts</p>
            </div>
          </div>

          {/* Transactions List */}
          <div className="space-y-3">
            {historyItems.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-3xl p-4 border border-cloud-border shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-status-success/15 border border-status-success/20 text-status-success flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>

                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base font-black text-graphite">₹{item.amount.toLocaleString()}</span>
                    </div>
                    <p className="text-xs font-bold text-graphite mt-0.5">{item.planName}</p>
                    <p className="text-[10px] text-graphite-muted">{item.date} • {item.method}</p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveReceipt({
                    id: item.id,
                    amount: item.amount,
                    planName: item.planName,
                    date: item.date,
                    invoiceNumber: item.invoice,
                    method: item.method
                  })}
                  className="px-3 py-1.5 rounded-xl bg-cloud-grey hover:bg-yellow-sunshine hover:text-graphite transition-all text-xs font-bold text-graphite flex items-center gap-1.5 border border-cloud-border active:scale-95 shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Receipt</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Nav */}
        {renderBottomNav('profile')}
      </div>
    );
  };

  // ----------------------------------------------------
  // SCREEN 16: Membership Renewal Screen
  // ----------------------------------------------------
  const renderRenewalScreen = () => (
    <div className="flex-1 flex flex-col justify-between bg-cloud min-h-screen pb-36">
      <div className="p-4 space-y-4">
        {/* Top Bar with Back Arrow */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => setCurrentScreen('home')}
            className="w-8 h-8 rounded-full bg-white border border-cloud-border flex items-center justify-center text-graphite shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-base font-black text-graphite leading-tight">Renew Membership</h2>
            <p className="text-[11px] text-graphite-muted">Extend days without losing current validity</p>
          </div>
        </div>

        {/* Current Validity Card */}
        <div className="bg-graphite text-white rounded-3xl p-5 shadow-md">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs text-white/70">Current Subscription</span>
            <span className="px-2.5 py-0.5 rounded-full bg-yellow-sunshine text-graphite text-[10px] font-black">
              {currentMember.daysLeft} Days Remaining
            </span>
          </div>

          <h3 className="text-xl font-black text-white">{currentMember.planName}</h3>
          <p className="text-xs text-cloud-grey/70 mt-0.5">Expires on {currentMember.expiryDate}</p>

          <div className="mt-3 p-3 rounded-2xl bg-white/10 text-xs text-white/80">
            💡 Early Renewal Guarantee: Extra days are added on top of your current expiry date.
          </div>
        </div>

        {/* Renewal Plan Options */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-graphite">Select Renewal Package</h4>

          {/* Option 1: Quick Renew Same Plan */}
          <div className="bg-white rounded-3xl p-5 border border-yellow-sunshine shadow-xs space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-yellow-soft text-yellow-active mb-1 inline-block">
                  RECOMMENDED
                </span>
                <h4 className="text-base font-black text-graphite">Monthly Plan (+30 Days)</h4>
                <p className="text-xs text-graphite-muted">Continue standard access seamlessly</p>
              </div>
              <span className="text-lg font-black text-graphite">₹1,499</span>
            </div>

            <button
              onClick={() => {
                setSelectedPlanForCheckout(plans[0]);
                setCurrentScreen('payment-summary');
              }}
              className="w-full py-3 rounded-xl bg-yellow-sunshine text-graphite font-black text-xs shadow-yellow-btn flex items-center justify-center gap-1.5"
            >
              <span>Quick Renew @ ₹1,499</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Option 2: Upgrade Quarterly */}
          <div className="bg-white rounded-3xl p-5 border border-cloud-border shadow-xs space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-status-success/20 text-status-success mb-1 inline-block">
                  SAVE 15%
                </span>
                <h4 className="text-base font-black text-graphite">Quarterly Plan (+90 Days)</h4>
                <p className="text-xs text-graphite-muted">Personal trainer consultation included</p>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-graphite">₹3,999</span>
                <span className="text-[10px] text-graphite-muted block line-through">₹4,497</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedPlanForCheckout(plans[1] || plans[0]);
                setCurrentScreen('payment-summary');
              }}
              className="w-full py-3 rounded-xl bg-cloud-grey hover:bg-yellow-sunshine text-graphite font-black text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Upgrade to Quarterly →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      {renderBottomNav('plans')}
    </div>
  );

  // ----------------------------------------------------
  // Dynamic Screen Router: Switches across all 16 screens
  // ----------------------------------------------------
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return renderSplashScreen();
      case 'login':
        return renderLoginScreen();
      case 'register':
        return renderRegisterScreen();
      case 'profile-setup':
        return renderProfileSetupScreen();
      case 'plans':
        return renderMembershipPlansScreen();
      case 'payment-summary':
        return renderPaymentSummaryScreen();
      case 'razorpay-checkout':
        return renderRazorpayCheckoutScreen();
      case 'payment-confirmation':
        return renderPaymentConfirmationScreen();
      case 'approval-status':
        return renderApprovalStatusScreen();
      case 'home':
        return renderHomeScreen();
      case 'membership-details':
        return renderMembershipDetailsScreen();
      case 'attendance':
        return renderAttendanceScreen();
      case 'notifications':
        return renderNotificationsScreen();
      case 'profile':
        return renderProfileScreen();
      case 'payment-history':
        return renderPaymentHistoryScreen();
      case 'renewal':
        return renderRenewalScreen();
      default:
        return renderHomeScreen();
    }
  };

  return (
    <div className="w-full min-h-[100dvh] bg-cloud text-graphite flex flex-col items-center relative select-none">
      {/* Real Full-Viewport Mobile App Container */}
      <main className={`w-full max-w-md min-h-[100dvh] bg-cloud flex flex-col relative sm:border-x sm:border-cloud-border sm:shadow-lg ${
        ['home', 'plans', 'attendance', 'notifications', 'profile', 'membership-details', 'payment-history', 'renewal'].includes(currentScreen)
          ? 'pt-[max(1.75rem,env(safe-area-inset-top))]'
          : ''
      }`}>
        {renderCurrentScreen()}
      </main>

      {/* PERSISTENT LIQUID MOVEMENT BOTTOM DOCK (Fluid Gliding & Droplet Stretch) */}
      {[
        'home', 
        'plans', 
        'attendance', 
        'notifications', 
        'profile', 
        'membership-details', 
        'payment-history', 
        'renewal'
      ].includes(currentScreen) && (
        <LiquidBottomDock 
          activeTab={
            currentScreen === 'home' ? 'home' :
            currentScreen === 'plans' || currentScreen === 'renewal' ? 'plans' :
            currentScreen === 'attendance' ? 'attendance' :
            currentScreen === 'notifications' ? 'notifications' : 'profile'
          } 
          onNavigate={(screen) => setCurrentScreen(screen)} 
        />
      )}

      {/* Official Tax Invoice & Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-graphite/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-cloud-border space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <GymProLogo size="sm" />
                <p className="text-[10px] text-graphite-muted mt-0.5">GSTIN: 29AABCS1429B1Z8</p>
              </div>
              <button
                onClick={() => setActiveReceipt(null)}
                className="p-1 rounded-full bg-cloud-grey text-graphite-muted hover:text-graphite"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-cloud-grey/40 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-graphite-muted">Invoice No.</span>
                <span className="font-mono font-bold text-graphite">{activeReceipt.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite-muted">Member Name</span>
                <span className="font-bold text-graphite">{currentMember.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite-muted">Member ID</span>
                <span className="font-mono font-bold text-graphite">{currentMember.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite-muted">Package</span>
                <span className="font-bold text-graphite">{activeReceipt.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite-muted">Date</span>
                <span className="font-bold text-graphite">{activeReceipt.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-graphite-muted">Payment Mode</span>
                <span className="font-bold text-sky-600">Razorpay Verified</span>
              </div>
              <div className="pt-2 border-t border-cloud-border flex justify-between items-center">
                <span className="font-bold text-graphite">Total Paid (Incl. 18% GST)</span>
                <span className="text-base font-black text-graphite">₹{activeReceipt.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => alert('Official Tax Invoice PDF downloaded to device storage.')}
                className="flex-1 py-2.5 rounded-xl bg-graphite text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save PDF</span>
              </button>
              <button
                onClick={() => setActiveReceipt(null)}
                className="flex-1 py-2.5 rounded-xl bg-yellow-sunshine text-graphite font-black text-xs shadow-yellow-btn"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
