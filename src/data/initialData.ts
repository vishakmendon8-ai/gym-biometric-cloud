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

// Clean production defaults — zero dummy users, subscriptions, logs, or payments
export const INITIAL_MEMBERS: Member[] = [];
export const INITIAL_SUBSCRIPTIONS: Subscription[] = [];
export const INITIAL_ACCESS_LOGS: AccessLog[] = [];
export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];
export const INITIAL_PAYMENTS: PaymentRecord[] = [];
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];
