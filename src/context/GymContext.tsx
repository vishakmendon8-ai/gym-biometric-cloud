import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Member, 
  Plan, 
  Subscription, 
  AttendanceRecord, 
  AccessLog, 
  PaymentRecord, 
  NotificationItem, 
  AdminProfile, 
  AdminTab,
  BiometricDevice,
  BiometricConnectorStatus,
  BiometricSyncLog
} from '../types/gym';
import { 
  ADMIN_PROFILE, 
  INITIAL_MEMBERS, 
  INITIAL_PLANS, 
  INITIAL_SUBSCRIPTIONS, 
  INITIAL_ATTENDANCE, 
  INITIAL_ACCESS_LOGS, 
  INITIAL_PAYMENTS, 
  INITIAL_NOTIFICATIONS 
} from '../data/initialData';
import { db, auth } from '../firebase';
import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';

interface GymContextType {
  // Navigation & UI state
  currentTab: AdminTab;
  setCurrentTab: (tab: AdminTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  adminProfile: AdminProfile;
  setAdminProfile: React.Dispatch<React.SetStateAction<AdminProfile>>;
  isAddMemberOpen: boolean;
  setIsAddMemberOpen: (open: boolean) => void;

  // Collections
  members: Member[];
  plans: Plan[];
  subscriptions: Subscription[];
  attendance: AttendanceRecord[];
  accessLogs: AccessLog[];
  payments: PaymentRecord[];
  notifications: NotificationItem[];

  // Real Secureye Biometric Collections (Live from Firestore)
  biometricDevices: BiometricDevice[];
  biometricConnectors: BiometricConnectorStatus[];
  biometricSyncLogs: BiometricSyncLog[];

  // Firebase Auth state
  firebaseUser: User | null;
  signInAdmin: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  signOutAdmin: () => Promise<void>;

  // Selected Member
  selectedMember: Member | null;
  setSelectedMember: (member: Member | null) => void;

  // Actions: Members
  addMember: (memberData: Omit<Member, 'id'>) => Promise<Member>;
  updateMember: (memberId: string, memberData: Partial<Member>) => Promise<void>;
  deleteMember: (memberId: string) => Promise<void>;
  linkMemberBiometricId: (memberId: string, biometricUserId: string) => Promise<{ ok: boolean; error?: string }>;

  // Actions: Plans
  addPlan: (planData: Omit<Plan, 'id'>) => Promise<Plan>;
  updatePlan: (planId: string, planData: Partial<Plan>) => Promise<void>;
  deletePlan: (planId: string) => Promise<void>;

  // Actions: Subscriptions
  createSubscription: (memberId: string, planId: string, paymentMethod?: string) => Promise<Subscription>;
  renewSubscription: (subscriptionId: string) => Promise<void>;
  deactivateSubscription: (subscriptionId: string) => Promise<void>;

  // Actions: Payments
  recordPayment: (paymentData: Omit<PaymentRecord, 'id' | 'invoiceNumber'>) => Promise<PaymentRecord>;

  // Actions: Biometric (Legacy compatibility)
  saveBiometricEnrollment: (memberId: string, token: string, samples: { sample1: boolean; sample2: boolean; sample3: boolean }) => Promise<void>;
  deleteBiometricEnrollment: (memberId: string) => Promise<void>;

  // Actions: Live Access Monitoring
  simulateAccessScan: (memberIdOrToken: string) => Promise<{ status: 'granted' | 'denied' | 'unknown'; member?: Member; message: string; log: AccessLog }>;

  // Sound & Notifications
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playAccessTone: (type: 'granted' | 'denied' | 'beep') => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Database Sync
  firebaseConnected: boolean;
  firestoreError: string | null;
  isSyncing: boolean;
  seedFirestoreData: () => Promise<void>;

  // Multi-view & Member Compatibility
  activeView: 'admin' | 'member' | 'biometric';
  setActiveView: (view: 'admin' | 'member' | 'biometric') => void;
  loginMember: (email: string, password?: string) => { success: boolean; error?: string; member?: Member };
  updateMemberStatus: (memberId: string, status: any, daysToAdd?: number) => Promise<void>;
  updateMemberBiometric: (memberId: string, tokenOrRegistered: any) => Promise<any>;
  recordBiometricScan: (biometricId: string) => Promise<{ status: 'granted' | 'denied' | 'unknown'; member?: Member; message: string }>;
  activateMemberPlan: (memberId: string, planId: string, paymentMethod?: string) => Promise<void>;
}

const GymContext = createContext<GymContextType | undefined>(undefined);

export const GymProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [adminProfile, setAdminProfile] = useState<AdminProfile>(ADMIN_PROFILE);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState<boolean>(false);

  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS);
  const [plans, setPlans] = useState<Plan[]>(INITIAL_PLANS);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(INITIAL_ATTENDANCE);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>(INITIAL_ACCESS_LOGS);
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const [biometricDevices, setBiometricDevices] = useState<BiometricDevice[]>([]);
  const [biometricConnectors, setBiometricConnectors] = useState<BiometricConnectorStatus[]>([]);
  const [biometricSyncLogs, setBiometricSyncLogs] = useState<BiometricSyncLog[]>([]);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Listen to Firebase Authentication state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsub();
  }, []);

  // Subscribe to real-time Firestore collections so real biometric scans update the dashboard automatically
  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    const handleSnapshotError = (collectionName: string, err: any) => {
      const msg = err?.message || `Unable to listen to Firestore collection "${collectionName}".`;
      setFirestoreError(msg);
      if (err?.code === 'permission-denied') {
        setFirebaseConnected(false);
      }
    };

    const LEGACY_DUMMY_EMAILS = new Set([
      'rahul.sharma@gmail.com',
      'priya.singh@outlook.com',
      'aman.verma@techcorp.in',
      'ajay.kumar@fitness.in',
      'neha.patel@designstudio.com',
      'rohan.gupta@venture.io',
      'ananya.desai@startup.in',
      'vikram.m@finance.org',
    ]);

    try {
      // 1. Live Members (also auto-purges legacy dummy seed records if still in Firestore)
      unsubscribers.push(
        onSnapshot(
          collection(db, 'members'),
          (snap) => {
            setFirebaseConnected(true);
            setFirestoreError(null);
            const liveMembers: Member[] = [];
            snap.docs.forEach((d) => {
              const data = d.data() as Omit<Member, 'id'>;
              const emailLower = (data.email || '').trim().toLowerCase();
              if (LEGACY_DUMMY_EMAILS.has(emailLower)) {
                deleteDoc(doc(db, 'members', d.id)).catch(() => {});
                return;
              }
              liveMembers.push({ id: d.id, ...data });
            });
            setMembers(liveMembers);
          },
          (err) => handleSnapshotError('members', err)
        )
      );

      // 2. Live Attendance Records (updates Dashboard & Attendance View immediately on real scans)
      unsubscribers.push(
        onSnapshot(
          query(collection(db, 'attendance'), orderBy('createdAt', 'desc'), limit(200)),
          (snap) => {
            setFirebaseConnected(true);
            setFirestoreError(null);
            const liveAttendance = snap.docs.map((d) => ({
              id: d.id,
              ...(d.data() as Omit<AttendanceRecord, 'id'>),
            }));
            setAttendance(liveAttendance);
          },
          (err) => {
            // Fallback without orderBy if existing seeded docs lack createdAt
            if (err?.code === 'failed-precondition') {
              unsubscribers.push(
                onSnapshot(
                  collection(db, 'attendance'),
                  (snap) => {
                    if (!snap.empty) {
                      setAttendance(
                        snap.docs.map((d) => ({
                          id: d.id,
                          ...(d.data() as Omit<AttendanceRecord, 'id'>),
                        }))
                      );
                    }
                  },
                  (fallbackErr) => handleSnapshotError('attendance', fallbackErr)
                )
              );
            } else {
              handleSnapshotError('attendance', err);
            }
          }
        )
      );

      // 3. Live Access Logs
      unsubscribers.push(
        onSnapshot(
          query(collection(db, 'access_logs'), orderBy('createdAt', 'desc'), limit(100)),
          (snap) => {
            if (!snap.empty) {
              setAccessLogs(
                snap.docs.map((d) => ({
                  id: d.id,
                  ...(d.data() as Omit<AccessLog, 'id'>),
                }))
              );
            }
          },
          () => {
            // Access logs optional until first event
          }
        )
      );

      // 4. Registered Secureye Biometric Devices
      unsubscribers.push(
        onSnapshot(
          collection(db, 'biometric_devices'),
          (snap) => {
            setFirebaseConnected(true);
            setFirestoreError(null);
            setBiometricDevices(
              snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<BiometricDevice, 'id'>),
              }))
            );
          },
          (err) => handleSnapshotError('biometric_devices', err)
        )
      );

      // 5. Local Biometric Connectors Status
      unsubscribers.push(
        onSnapshot(
          collection(db, 'biometric_connectors'),
          (snap) => {
            setBiometricConnectors(
              snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<BiometricConnectorStatus, 'id'>),
              }))
            );
          },
          () => {
            // Handled via biometric_devices error listener
          }
        )
      );

      // 6. Biometric Synchronization & Diagnostic Logs
      unsubscribers.push(
        onSnapshot(
          query(collection(db, 'biometric_sync_logs'), orderBy('createdAt', 'desc'), limit(100)),
          (snap) => {
            setBiometricSyncLogs(
              snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<BiometricSyncLog, 'id'>),
              }))
            );
          },
          () => {
            // Handled via biometric_devices error listener
          }
        )
      );
    } catch (err: any) {
      setFirestoreError(err?.message || 'Failed to initialize Firestore listeners.');
    }

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [firebaseUser?.uid]);

  const signInAdmin = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Firebase Admin sign-in failed.' };
    }
  };

  const signOutAdmin = async () => {
    await signOut(auth);
  };

  const linkMemberBiometricId = async (memberId: string, biometricUserId: string) => {
    const raw = biometricUserId.trim();
    const cleaned = /^\d+$/.test(raw) ? String(Number(raw)) : raw;
    const isLinked = cleaned.length > 0 && cleaned !== 'NONE' && cleaned !== 'BIO-FP-UNREGISTERED';

    if (isLinked) {
      const duplicateOwner = members.find(
        (m) =>
          m.id !== memberId &&
          m.biometricId &&
          m.biometricId.trim().toLowerCase() === cleaned.toLowerCase()
      );
      if (duplicateOwner) {
        return {
          ok: false,
          error: `Biometric User ID "${cleaned}" is already assigned to ${duplicateOwner.name} (${duplicateOwner.id}). Each Secureye machine User ID must be unique.`,
        };
      }
    }

    const patch: Partial<Member> = {
      biometricId: isLinked ? cleaned : '',
      biometricRegistered: isLinked,
    };

    try {
      await setDoc(doc(db, 'members', memberId), patch, { merge: true });
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, ...patch } : m)));
      return { ok: true };
    } catch (err: any) {
      return {
        ok: false,
        error: err?.message || 'Failed to save biometric User ID to Firestore. Verify Admin sign-in.',
      };
    }
  };

  // Determine active view from URL path, query params, or hash
  const getInitialView = (): 'admin' | 'member' | 'biometric' => {
    if (typeof window === 'undefined') return 'admin';
    const path = window.location.pathname.toLowerCase();
    const search = new URLSearchParams(window.location.search).get('view')?.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    if (path.includes('/member') || search === 'member' || hash.includes('member')) {
      return 'member';
    }
    if (path.includes('/biometric') || search === 'biometric' || hash.includes('biometric')) {
      return 'biometric';
    }
    return 'admin';
  };

  const [activeView, setActiveViewState] = useState<'admin' | 'member' | 'biometric'>(getInitialView);

  const setActiveView = (view: 'admin' | 'member' | 'biometric') => {
    setActiveViewState(view);
    if (typeof window !== 'undefined') {
      const targetPath = `/${view}`;
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    }
  };

  // Sync with browser navigation (popstate & hashchange)
  useEffect(() => {
    const handleLocationChange = () => {
      setActiveViewState(getInitialView());
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const loginMember = (email: string, _password?: string) => {
    const member = members.find(m => m.email.toLowerCase() === email.trim().toLowerCase());
    if (!member) {
      return { success: false, error: 'No member found with this email' };
    }
    setSelectedMember(member);
    return { success: true, member };
  };

  const updateMemberStatus = async (memberId: string, status: any, daysToAdd?: number) => {
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        return {
          ...m,
          status,
          daysLeft: daysToAdd !== undefined ? (m.daysLeft || 0) + daysToAdd : m.daysLeft
        };
      }
      return m;
    }));
  };

  const updateMemberBiometric = async (memberId: string, tokenOrRegistered: string | boolean) => {
    const token = typeof tokenOrRegistered === 'string' ? tokenOrRegistered : `BIO-FP-${Date.now().toString().slice(-4)}`;
    const target = members.find(m => m.id === memberId);
    if (target) {
      const updated = { ...target, biometricId: token, biometricRegistered: true };
      await updateMember(memberId, { biometricId: token, biometricRegistered: true });
      return { success: true, member: updated };
    }
    return { success: false };
  };

  const recordBiometricScan = async (biometricId: string) => {
    const res = await simulateAccessScan(biometricId);
    return {
      status: res.status,
      member: res.member,
      message: res.message
    };
  };

  const activateMemberPlan = async (memberId: string, planId: string, paymentMethod = 'Razorpay UPI') => {
    await createSubscription(memberId, planId, paymentMethod);
  };

  // Sound Synthesizer
  const playAccessTone = (type: 'granted' | 'denied' | 'beep') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'beep') {
        osc.frequency.setValueAtTime(750, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
      } else if (type === 'granted') {
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.16); // G5
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      } else if (type === 'denied') {
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        osc.frequency.setValueAtTime(160, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.35);
      }
    } catch {}
  };

  // Add Member
  const addMember = async (memberData: Omit<Member, 'id'>): Promise<Member> => {
    // Generate next serial member ID: GYM0349...
    const count = members.length + 341;
    const newId = `GYM0${count + 1}`;
    const newMember: Member = {
      ...memberData,
      id: newId
    };

    setMembers(prev => [newMember, ...prev]);

    // Create initial subscription if plan assigned
    if (memberData.planId) {
      const plan = plans.find(p => p.id === memberData.planId) || plans[0];
      const newSub: Subscription = {
        id: `SUB-${Date.now().toString().slice(-4)}`,
        memberId: newId,
        memberName: newMember.name,
        memberAvatar: newMember.avatar,
        planId: plan.id,
        planName: plan.name,
        startDate: memberData.joinDate,
        expiryDate: memberData.expiryDate,
        amount: plan.price,
        paymentStatus: memberData.status === 'active' ? 'paid' : 'pending',
        status: memberData.status
      };
      setSubscriptions(prev => [newSub, ...prev]);

      // Record payment if active
      if (memberData.status === 'active') {
        const newPay: PaymentRecord = {
          id: `PAY-${Date.now().toString().slice(-4)}`,
          memberId: newId,
          memberName: newMember.name,
          planName: `${plan.name} (${plan.durationMonths} Mo)`,
          amount: plan.price,
          date: memberData.joinDate,
          status: 'completed',
          paymentMethod: 'Razorpay UPI',
          invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`
        };
        setPayments(prev => [newPay, ...prev]);
      }
    }

    // Add notification
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'New Member Registered',
      message: `${newMember.name} (${newMember.id}) enrolled in ${newMember.planName}.`,
      date: 'Today',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'membership',
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    try {
      await setDoc(doc(db, 'members', newId), newMember);
    } catch {}

    return newMember;
  };

  // Update Member
  const updateMember = async (memberId: string, memberData: Partial<Member>) => {
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, ...memberData } : m));
    if (selectedMember?.id === memberId) {
      setSelectedMember(prev => prev ? { ...prev, ...memberData } : null);
    }
    try {
      await updateDoc(doc(db, 'members', memberId), memberData);
    } catch {}
  };

  // Delete Member
  const deleteMember = async (memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
    setSubscriptions(prev => prev.filter(s => s.memberId !== memberId));
    if (selectedMember?.id === memberId) {
      setSelectedMember(null);
    }
    try {
      await deleteDoc(doc(db, 'members', memberId));
    } catch {}
  };

  // Add Plan
  const addPlan = async (planData: Omit<Plan, 'id'>): Promise<Plan> => {
    const newId = `plan-${Date.now().toString().slice(-4)}`;
    const newPlan: Plan = {
      ...planData,
      id: newId
    };
    setPlans(prev => [...prev, newPlan]);
    try {
      await setDoc(doc(db, 'plans', newId), newPlan);
    } catch {}
    return newPlan;
  };

  // Update Plan
  const updatePlan = async (planId: string, planData: Partial<Plan>) => {
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, ...planData } : p));
    if (planData.name) {
      setMembers(prev => prev.map(m => m.planId === planId ? { ...m, planName: planData.name! } : m));
      setSubscriptions(prev => prev.map(s => s.planId === planId ? { ...s, planName: planData.name! } : s));
    }
    try {
      await updateDoc(doc(db, 'plans', planId), planData);
    } catch {}
  };

  // Delete Plan
  const deletePlan = async (planId: string) => {
    setPlans(prev => prev.filter(p => p.id !== planId));
    try {
      await deleteDoc(doc(db, 'plans', planId));
    } catch {}
  };

  // Create Subscription
  const createSubscription = async (memberId: string, planId: string, paymentMethod = 'Razorpay'): Promise<Subscription> => {
    const member = members.find(m => m.id === memberId);
    const plan = plans.find(p => p.id === planId) || plans[0];
    const now = new Date();
    const expiry = new Date();
    expiry.setMonth(now.getMonth() + plan.durationMonths);

    const startStr = now.toISOString().split('T')[0];
    const expiryStr = expiry.toISOString().split('T')[0];

    const newSub: Subscription = {
      id: `SUB-${Date.now().toString().slice(-4)}`,
      memberId,
      memberName: member?.name || 'Member',
      memberAvatar: member?.avatar,
      planId: plan.id,
      planName: plan.name,
      startDate: startStr,
      expiryDate: expiryStr,
      amount: plan.price,
      paymentStatus: 'paid',
      status: 'active'
    };

    setSubscriptions(prev => [newSub, ...prev]);

    // Update member
    await updateMember(memberId, {
      planId: plan.id,
      planName: plan.name,
      status: 'active',
      expiryDate: expiryStr,
      daysLeft: plan.durationMonths * 30
    });

    // Record Payment
    await recordPayment({
      memberId,
      memberName: member?.name || 'Member',
      planName: `${plan.name} (${plan.durationMonths} Mo)`,
      amount: plan.price,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'completed',
      paymentMethod
    });

    return newSub;
  };

  // Renew Subscription
  const renewSubscription = async (subscriptionId: string) => {
    const sub = subscriptions.find(s => s.id === subscriptionId);
    if (!sub) return;

    const plan = plans.find(p => p.id === sub.planId) || plans[0];
    const now = new Date();
    const expiry = new Date();
    expiry.setMonth(now.getMonth() + plan.durationMonths);
    const expiryStr = expiry.toISOString().split('T')[0];

    setSubscriptions(prev => prev.map(s => s.id === subscriptionId ? {
      ...s,
      expiryDate: expiryStr,
      status: 'active',
      paymentStatus: 'paid'
    } : s));

    await updateMember(sub.memberId, {
      status: 'active',
      expiryDate: expiryStr,
      daysLeft: plan.durationMonths * 30
    });

    await recordPayment({
      memberId: sub.memberId,
      memberName: sub.memberName,
      planName: `${sub.planName} (Renewal)`,
      amount: sub.amount,
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'completed',
      paymentMethod: 'Razorpay UPI'
    });

    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Subscription Renewed',
      message: `${sub.memberName} renewed ${sub.planName} (+${plan.durationMonths} Months).`,
      date: 'Today',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'membership',
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Deactivate Subscription
  const deactivateSubscription = async (subscriptionId: string) => {
    const sub = subscriptions.find(s => s.id === subscriptionId);
    if (!sub) return;

    setSubscriptions(prev => prev.map(s => s.id === subscriptionId ? { ...s, status: 'inactive' } : s));
    await updateMember(sub.memberId, { status: 'inactive' });
  };

  // Record Payment
  const recordPayment = async (paymentData: Omit<PaymentRecord, 'id' | 'invoiceNumber'>): Promise<PaymentRecord> => {
    const newPayment: PaymentRecord = {
      ...paymentData,
      id: `PAY-${Date.now().toString().slice(-4)}`,
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`
    };

    setPayments(prev => [newPayment, ...prev]);

    try {
      await setDoc(doc(db, 'payments', newPayment.id), newPayment);
    } catch {}

    return newPayment;
  };

  // Biometric Enrollment (Simulation Mode)
  const saveBiometricEnrollment = async (
    memberId: string, 
    token: string, 
    samples: { sample1: boolean; sample2: boolean; sample3: boolean }
  ) => {
    await updateMember(memberId, {
      biometricId: token,
      biometricRegistered: true,
      biometricSamples: samples
    });

    const member = members.find(m => m.id === memberId);
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: 'Biometric Enrolled (Simulated)',
      message: `3 fingerprint samples captured and verified for ${member?.name || 'Member'}. Token: ${token}.`,
      date: 'Today',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'membership',
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const deleteBiometricEnrollment = async (memberId: string) => {
    await updateMember(memberId, {
      biometricId: 'BIO-FP-UNREGISTERED',
      biometricRegistered: false,
      biometricSamples: { sample1: false, sample2: false, sample3: false }
    });
  };

  // Live Access Scan Verification
  const simulateAccessScan = async (memberIdOrToken: string): Promise<{ 
    status: 'granted' | 'denied' | 'unknown'; 
    member?: Member; 
    message: string; 
    log: AccessLog 
  }> => {
    playAccessTone('beep');
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Find member by ID or biometricId
    const member = members.find(m => 
      m.id.toLowerCase() === memberIdOrToken.trim().toLowerCase() ||
      m.biometricId.toLowerCase() === memberIdOrToken.trim().toLowerCase()
    );

    if (!member) {
      playAccessTone('denied');
      const deniedLog: AccessLog = {
        id: `log-${Date.now()}`,
        memberId: 'UNKNOWN',
        memberName: 'Unrecognized Fingerprint',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        time: timeStr,
        status: 'denied',
        reason: 'Fingerprint token not enrolled in GymPro database',
        terminalId: 'Turnstile Gateway #01 (Alpha)'
      };
      setAccessLogs(prev => [deniedLog, ...prev]);
      return { status: 'unknown', message: 'Unknown member: Access Denied', log: deniedLog };
    }

    if (!member.biometricRegistered) {
      playAccessTone('denied');
      const deniedLog: AccessLog = {
        id: `log-${Date.now()}`,
        memberId: member.id,
        memberName: member.name,
        avatar: member.avatar,
        time: timeStr,
        status: 'denied',
        reason: 'Biometric profile not enrolled',
        terminalId: 'Turnstile Gateway #01 (Alpha)'
      };
      setAccessLogs(prev => [deniedLog, ...prev]);
      return { status: 'denied', member, message: 'Biometric not registered: Access Denied', log: deniedLog };
    }

    if (member.status === 'expired' || member.status === 'inactive') {
      playAccessTone('denied');
      const deniedLog: AccessLog = {
        id: `log-${Date.now()}`,
        memberId: member.id,
        memberName: member.name,
        avatar: member.avatar,
        time: timeStr,
        status: 'denied',
        reason: member.status === 'expired' ? `Membership expired on ${member.expiryDate}` : 'Account suspended/inactive',
        terminalId: 'Turnstile Gateway #01 (Alpha)'
      };
      setAccessLogs(prev => [deniedLog, ...prev]);
      return { status: 'denied', member, message: `Access Denied: ${deniedLog.reason}`, log: deniedLog };
    }

    // Access Granted
    playAccessTone('granted');
    const grantedLog: AccessLog = {
      id: `log-${Date.now()}`,
      memberId: member.id,
      memberName: member.name,
      avatar: member.avatar,
      time: timeStr,
      status: 'granted',
      terminalId: 'Turnstile Gateway #01 (Alpha)'
    };
    setAccessLogs(prev => [grantedLog, ...prev]);

    // Create real attendance record
    const newAtt: AttendanceRecord = {
      id: `att-${Date.now()}`,
      memberId: member.id,
      memberName: member.name,
      avatar: member.avatar,
      checkInDate: new Date().toISOString().split('T')[0],
      checkInTime: timeStr,
      timestamp: `Today at ${timeStr}`,
      method: 'biometric',
      status: 'granted',
      terminalId: 'Turnstile Gateway #01 (Alpha)'
    };
    setAttendance(prev => [newAtt, ...prev]);

    // Update member's checkin count and last seen
    await updateMember(member.id, {
      totalCheckIns: (member.totalCheckIns || 0) + 1,
      lastCheckIn: `Today at ${timeStr}`
    });

    return { status: 'granted', member, message: `Access Granted: Welcome, ${member.name}!`, log: grantedLog };
  };

  // Notification management
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const clearNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Seed Firestore
  const seedFirestoreData = async () => {
    setIsSyncing(true);
    try {
      for (const m of members) await setDoc(doc(db, 'members', m.id), m);
      for (const p of plans) await setDoc(doc(db, 'plans', p.id), p);
      for (const s of subscriptions) await setDoc(doc(db, 'subscriptions', s.id), s);
      for (const a of attendance) await setDoc(doc(db, 'attendance', a.id), a);
      for (const l of accessLogs) await setDoc(doc(db, 'access_logs', l.id), l);
      for (const pay of payments) await setDoc(doc(db, 'payments', pay.id), pay);
      for (const n of notifications) await setDoc(doc(db, 'notifications', n.id), n);
      setFirebaseConnected(true);
    } catch (e: any) {
      console.warn('Firestore seeding:', e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <GymContext.Provider value={{
      currentTab,
      setCurrentTab,
      searchQuery,
      setSearchQuery,
      adminProfile,
      setAdminProfile,
      isAddMemberOpen,
      setIsAddMemberOpen,
      members,
      plans,
      subscriptions,
      attendance,
      accessLogs,
      payments,
      notifications,
      biometricDevices,
      biometricConnectors,
      biometricSyncLogs,
      firebaseUser,
      signInAdmin,
      signOutAdmin,
      selectedMember,
      setSelectedMember,
      addMember,
      updateMember,
      deleteMember,
      linkMemberBiometricId,
      addPlan,
      updatePlan,
      deletePlan,
      createSubscription,
      renewSubscription,
      deactivateSubscription,
      recordPayment,
      saveBiometricEnrollment,
      deleteBiometricEnrollment,
      simulateAccessScan,
      soundEnabled,
      setSoundEnabled,
      playAccessTone,
      markNotificationRead,
      clearNotifications,
      firebaseConnected,
      firestoreError,
      isSyncing,
      seedFirestoreData,
      activeView,
      setActiveView,
      loginMember,
      updateMemberStatus,
      updateMemberBiometric,
      recordBiometricScan,
      activateMemberPlan
    }}>
      {children}
    </GymContext.Provider>
  );
};

export const useGym = () => {
  const context = useContext(GymContext);
  if (!context) {
    throw new Error('useGym must be used within a GymProvider');
  }
  return context;
};
