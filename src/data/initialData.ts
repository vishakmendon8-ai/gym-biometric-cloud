import { Member, Plan, Subscription, AttendanceRecord, AccessLog, PaymentRecord, NotificationItem, AdminProfile } from '../types/gym';

export const ADMIN_PROFILE: AdminProfile = {
  name: 'Admin',
  role: 'Super Admin',
  email: 'admin@gympro.in',
  avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
  facilityName: 'GymPro Fitness Center'
};

export const INITIAL_PLANS: Plan[] = [
  {
    id: 'plan-monthly',
    name: 'Monthly Plan',
    tagline: 'Standard 1-Month Membership Access',
    price: 1499,
    joiningFee: 500,
    durationMonths: 1,
    active: true,
    features: [
      'Full Gym Floor Access (6 AM - 10 PM)',
      'Locker room & Shower Access',
      '1 Free Fitness Assessment',
      'Mobile Workout Tracking'
    ]
  },
  {
    id: 'plan-quarterly',
    name: 'Quarterly Plan',
    tagline: '3-Month Comprehensive Fitness Routine',
    price: 3999,
    originalPrice: 4499,
    offerTag: 'POPULAR (SAVE ₹500)',
    joiningFee: 0,
    durationMonths: 3,
    popular: true,
    active: true,
    features: [
      'All Monthly Plan Amenities',
      '2 Dedicated Personal Trainer Sessions',
      'Nutritional & Diet Consultation',
      'Biometric Fast-Gate Priority Access'
    ]
  },
  {
    id: 'plan-half-yearly',
    name: 'Half-Yearly Plan',
    tagline: '6-Month Goal-Driven Fitness Program',
    price: 6999,
    originalPrice: 8999,
    offerTag: 'SAVE ₹2,000',
    joiningFee: 0,
    durationMonths: 6,
    active: true,
    features: [
      'All Quarterly Plan Benefits',
      'Unlimited Group Fitness & Yoga Classes',
      'Monthly InBody Composition Scans',
      'Complimentary Protein Shake / Month'
    ]
  },
  {
    id: 'plan-yearly',
    name: 'Yearly Plan',
    tagline: '12-Month All-Inclusive Premium VIP Tier',
    price: 11999,
    originalPrice: 17999,
    offerTag: 'BEST VALUE (33% OFF)',
    joiningFee: 0,
    durationMonths: 12,
    active: true,
    features: [
      'All Half-Yearly Privileges',
      'Dedicated Locker & Towel Service',
      'Unlimited Spa & Steam Sauna Access',
      '4 Free Guest Passes Every Month',
      'Priority VIP Gate Pass'
    ]
  }
];

export const INITIAL_MEMBERS: Member[] = [
  {
    id: 'GYM0341',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@gmail.com',
    phone: '+91 98765 43210',
    dob: '1995-04-12',
    gender: 'Male',
    address: 'A-204, Green Heights, Mangalore',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    planId: 'plan-monthly',
    planName: 'Monthly Plan',
    status: 'active',
    joinDate: '24 Nov 2026',
    expiryDate: '24 Dec 2026',
    biometricId: '341',
    biometricRegistered: true,
    daysLeft: 30,
    totalCheckIns: 18,
    lastCheckIn: 'Today at 10:24 AM',
    emergencyContact: 'Sunita Sharma (+91 98765 00001)'
  },
  {
    id: 'GYM0342',
    name: 'Priya Singh',
    email: 'priya.singh@outlook.com',
    phone: '+91 98111 22334',
    dob: '1998-08-23',
    gender: 'Female',
    address: '402, Royal Palms, Kadri, Mangalore',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    planId: 'plan-quarterly',
    planName: 'Quarterly Plan',
    status: 'active',
    joinDate: '24 Nov 2026',
    expiryDate: '24 Feb 2027',
    biometricId: '342',
    biometricRegistered: true,
    daysLeft: 90,
    totalCheckIns: 42,
    lastCheckIn: 'Today at 09:15 AM',
    emergencyContact: 'Rakesh Singh (+91 98111 99999)'
  },
  {
    id: 'GYM0343',
    name: 'Aman Verma',
    email: 'aman.verma@techcorp.in',
    phone: '+91 99887 76655',
    dob: '1992-11-05',
    gender: 'Male',
    address: '12, Ocean View Layout, Surathkal',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    planId: 'plan-yearly',
    planName: 'Yearly Plan',
    status: 'active',
    joinDate: '24 Nov 2026',
    expiryDate: '24 Nov 2027',
    biometricId: '343',
    biometricRegistered: true,
    daysLeft: 365,
    totalCheckIns: 112,
    lastCheckIn: 'Today at 09:45 AM',
    emergencyContact: 'Pooja Verma (+91 99887 00000)'
  },
  {
    id: 'GYM0344',
    name: 'Ajay Kumar',
    email: 'ajay.kumar@fitness.in',
    phone: '+91 97654 32109',
    dob: '1994-02-18',
    gender: 'Male',
    address: '88, Hilltop Colony, Mangalore',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    planId: 'plan-monthly',
    planName: 'Monthly Plan',
    status: 'expired',
    joinDate: '15 Oct 2026',
    expiryDate: '15 Nov 2026',
    biometricId: '344',
    biometricRegistered: true,
    daysLeft: 0,
    totalCheckIns: 24,
    lastCheckIn: '15 Nov 2026 at 06:30 PM',
    emergencyContact: 'Kavita Kumar (+91 97654 00000)'
  },
  {
    id: 'GYM0345',
    name: 'Neha Patel',
    email: 'neha.patel@designstudio.com',
    phone: '+91 96543 21098',
    dob: '1997-06-30',
    gender: 'Female',
    address: 'B-12, Palm Grove, Bejai, Mangalore',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    planId: 'plan-quarterly',
    planName: 'Quarterly Plan',
    status: 'active',
    joinDate: '10 Oct 2026',
    expiryDate: '10 Jan 2027',
    biometricId: '345',
    biometricRegistered: true,
    daysLeft: 47,
    totalCheckIns: 36,
    lastCheckIn: 'Today at 10:18 AM',
    emergencyContact: 'Mahesh Patel (+91 96543 00000)'
  },
  {
    id: 'GYM0346',
    name: 'Rohan Gupta',
    email: 'rohan.gupta@venture.io',
    phone: '+91 95432 10987',
    dob: '1993-09-14',
    gender: 'Male',
    address: '55, Coastal Road, Mangalore',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    planId: 'plan-half-yearly',
    planName: 'Half-Yearly Plan',
    status: 'expiring',
    joinDate: '01 Jun 2026',
    expiryDate: '27 Nov 2026',
    biometricId: '346',
    biometricRegistered: true,
    daysLeft: 3,
    totalCheckIns: 78,
    lastCheckIn: 'Yesterday at 07:15 PM',
    emergencyContact: 'Anita Gupta (+91 95432 00000)'
  },
  {
    id: 'GYM0347',
    name: 'Ananya Desai',
    email: 'ananya.desai@startup.in',
    phone: '+91 94321 09876',
    dob: '1999-12-01',
    gender: 'Female',
    address: 'Flat 101, Sunshine Heights, Mangalore',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    planId: 'plan-monthly',
    planName: 'Monthly Plan',
    status: 'pending',
    joinDate: '24 Nov 2026',
    expiryDate: 'Pending Payment',
    biometricId: '',
    biometricRegistered: false,
    daysLeft: 0,
    totalCheckIns: 0,
    emergencyContact: 'Sanjay Desai (+91 94321 00000)'
  },
  {
    id: 'GYM0348',
    name: 'Vikram Malhotra',
    email: 'vikram.m@finance.org',
    phone: '+91 93210 98765',
    dob: '1989-03-21',
    gender: 'Male',
    address: 'Villa 7, Grand Avenue, Mangalore',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    planId: 'plan-yearly',
    planName: 'Yearly Plan',
    status: 'inactive',
    joinDate: '10 Jan 2026',
    expiryDate: '10 Jan 2027',
    biometricId: '348',
    biometricRegistered: true,
    daysLeft: 0,
    totalCheckIns: 15,
    lastCheckIn: '12 Sep 2026 at 08:00 AM',
    emergencyContact: 'Deepa Malhotra (+91 93210 00000)'
  }
];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'SUB-2026-001',
    memberId: 'GYM0341',
    memberName: 'Rahul Sharma',
    memberAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    planId: 'plan-monthly',
    planName: 'Monthly Plan',
    startDate: '2026-11-24',
    expiryDate: '2026-12-24',
    amount: 1499,
    paymentStatus: 'paid',
    status: 'active'
  },
  {
    id: 'SUB-2026-002',
    memberId: 'GYM0342',
    memberName: 'Priya Singh',
    memberAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    planId: 'plan-quarterly',
    planName: 'Quarterly Plan',
    startDate: '2026-11-24',
    expiryDate: '2027-02-24',
    amount: 3999,
    paymentStatus: 'paid',
    status: 'active'
  },
  {
    id: 'SUB-2026-003',
    memberId: 'GYM0343',
    memberName: 'Aman Verma',
    memberAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    planId: 'plan-yearly',
    planName: 'Yearly Plan',
    startDate: '2026-11-24',
    expiryDate: '2027-11-24',
    amount: 11999,
    paymentStatus: 'paid',
    status: 'active'
  },
  {
    id: 'SUB-2026-004',
    memberId: 'GYM0344',
    memberName: 'Ajay Kumar',
    memberAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    planId: 'plan-monthly',
    planName: 'Monthly Plan',
    startDate: '2026-10-15',
    expiryDate: '2026-11-15',
    amount: 1499,
    paymentStatus: 'paid',
    status: 'expired'
  },
  {
    id: 'SUB-2026-005',
    memberId: 'GYM0345',
    memberName: 'Neha Patel',
    memberAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    planId: 'plan-quarterly',
    planName: 'Quarterly Plan',
    startDate: '2026-10-10',
    expiryDate: '2027-01-10',
    amount: 3999,
    paymentStatus: 'paid',
    status: 'active'
  },
  {
    id: 'SUB-2026-006',
    memberId: 'GYM0346',
    memberName: 'Rohan Gupta',
    memberAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
    planId: 'plan-half-yearly',
    planName: 'Half-Yearly Plan',
    startDate: '2026-05-27',
    expiryDate: '2026-11-27',
    amount: 6999,
    paymentStatus: 'paid',
    status: 'expiring'
  },
  {
    id: 'SUB-2026-007',
    memberId: 'GYM0347',
    memberName: 'Ananya Desai',
    memberAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    planId: 'plan-monthly',
    planName: 'Monthly Plan',
    startDate: '2026-11-24',
    expiryDate: '2026-12-24',
    amount: 1499,
    paymentStatus: 'pending',
    status: 'pending'
  }
];

export const INITIAL_ACCESS_LOGS: AccessLog[] = [
  {
    id: 'log-01',
    memberId: 'GYM0341',
    memberName: 'Rahul Sharma',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    time: '10:24 AM',
    status: 'granted',
    terminalId: 'Turnstile Gateway #01 (Alpha)'
  },
  {
    id: 'log-02',
    memberId: 'GYM0344',
    memberName: 'Ajay Kumar',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    time: '10:20 AM',
    status: 'denied',
    reason: 'Membership expired on 15 Nov 2026',
    terminalId: 'Turnstile Gateway #01 (Alpha)'
  },
  {
    id: 'log-03',
    memberId: 'GYM0345',
    memberName: 'Neha Patel',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    time: '10:18 AM',
    status: 'granted',
    terminalId: 'Turnstile Gateway #02 (Beta)'
  },
  {
    id: 'log-04',
    memberId: 'GYM0343',
    memberName: 'Aman Verma',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    time: '09:45 AM',
    status: 'granted',
    terminalId: 'Turnstile Gateway #01 (Alpha)'
  },
  {
    id: 'log-05',
    memberId: 'GYM0342',
    memberName: 'Priya Singh',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    time: '09:15 AM',
    status: 'granted',
    terminalId: 'Turnstile Gateway #02 (Beta)'
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'att-101',
    memberId: 'GYM0341',
    memberName: 'Rahul Sharma',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
    checkInDate: '2026-11-24',
    checkInTime: '10:24 AM',
    timestamp: 'Today at 10:24 AM',
    method: 'biometric',
    status: 'granted',
    terminalId: 'Turnstile Gateway #01 (Alpha)'
  },
  {
    id: 'att-102',
    memberId: 'GYM0345',
    memberName: 'Neha Patel',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80',
    checkInDate: '2026-11-24',
    checkInTime: '10:18 AM',
    timestamp: 'Today at 10:18 AM',
    method: 'biometric',
    status: 'granted',
    terminalId: 'Turnstile Gateway #02 (Beta)'
  },
  {
    id: 'att-103',
    memberId: 'GYM0343',
    memberName: 'Aman Verma',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    checkInDate: '2026-11-24',
    checkInTime: '09:45 AM',
    timestamp: 'Today at 09:45 AM',
    method: 'biometric',
    status: 'granted',
    terminalId: 'Turnstile Gateway #01 (Alpha)'
  },
  {
    id: 'att-104',
    memberId: 'GYM0342',
    memberName: 'Priya Singh',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    checkInDate: '2026-11-24',
    checkInTime: '09:15 AM',
    timestamp: 'Today at 09:15 AM',
    method: 'biometric',
    status: 'granted',
    terminalId: 'Turnstile Gateway #02 (Beta)'
  }
];

export const INITIAL_PAYMENTS: PaymentRecord[] = [
  {
    id: 'PAY-8821',
    memberId: 'GYM0343',
    memberName: 'Aman Verma',
    planName: 'Yearly Plan (12 Mo)',
    amount: 11999,
    date: '24 Nov 2026',
    status: 'completed',
    paymentMethod: 'Razorpay UPI',
    invoiceNumber: 'INV-2026-8821'
  },
  {
    id: 'PAY-8820',
    memberId: 'GYM0342',
    memberName: 'Priya Singh',
    planName: 'Quarterly Plan (3 Mo)',
    amount: 3999,
    date: '24 Nov 2026',
    status: 'completed',
    paymentMethod: 'Credit Card',
    invoiceNumber: 'INV-2026-8820'
  },
  {
    id: 'PAY-8819',
    memberId: 'GYM0341',
    memberName: 'Rahul Sharma',
    planName: 'Monthly Plan (1 Mo)',
    amount: 1499,
    date: '24 Nov 2026',
    status: 'completed',
    paymentMethod: 'Cash',
    invoiceNumber: 'INV-2026-8819'
  },
  {
    id: 'PAY-8818',
    memberId: 'GYM0345',
    memberName: 'Neha Patel',
    planName: 'Quarterly Plan (3 Mo)',
    amount: 3999,
    date: '10 Oct 2026',
    status: 'completed',
    paymentMethod: 'Razorpay NetBanking',
    invoiceNumber: 'INV-2026-8818'
  },
  {
    id: 'PAY-8817',
    memberId: 'GYM0346',
    memberName: 'Rohan Gupta',
    planName: 'Half-Yearly Plan (6 Mo)',
    amount: 6999,
    date: '01 Jun 2026',
    status: 'completed',
    paymentMethod: 'Razorpay Card',
    invoiceNumber: 'INV-2026-8817'
  }
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-01',
    title: 'Membership Expiring Soon',
    message: 'Rohan Gupta (GYM0346) subscription expires in 3 days. Send renewal reminder.',
    date: 'Today',
    time: '10:00 AM',
    category: 'membership',
    isRead: false
  },
  {
    id: 'notif-02',
    title: 'Access Denied Alert',
    message: 'Ajay Kumar (GYM0344) attempted gate access with expired membership plan.',
    date: 'Today',
    time: '10:20 AM',
    category: 'alert',
    isRead: false
  },
  {
    id: 'notif-03',
    title: 'Payment Received',
    message: 'Aman Verma completed ₹11,999 payment for Yearly VIP Plan via Razorpay.',
    date: 'Today',
    time: '09:40 AM',
    category: 'payment',
    isRead: true
  },
  {
    id: 'notif-04',
    title: 'New Member Registered',
    message: 'Rahul Sharma enrolled in Monthly Plan with biometric token BIO-FP-0341.',
    date: 'Today',
    time: '08:30 AM',
    category: 'membership',
    isRead: true
  }
];
