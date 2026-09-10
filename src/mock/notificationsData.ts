import { NotificationItem } from '../types';

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-01',
    title: 'Low Stock Alert',
    message: 'Brass Round Rod CW614N (MAT-BRS-ROD-25) is below min threshold (480 kg remaining / 600 kg min).',
    type: 'stock',
    severity: 'danger',
    timestamp: '15 mins ago',
    isRead: false,
    actionRoute: '/materials',
    actionLabel: 'View Material'
  },
  {
    id: 'notif-02',
    title: 'Pending Quality Inspection',
    message: '1,200 pcs of Valve Spindle Stem (JOB-2026-002) awaiting final dimensional inspection.',
    type: 'quality',
    severity: 'warning',
    timestamp: '45 mins ago',
    isRead: false,
    actionRoute: '/quality',
    actionLabel: 'Inspect Job'
  },
  {
    id: 'notif-03',
    title: 'Production Job Overdue',
    message: 'JOB-2026-004 (SS Pump Shaft for L&T) missed due date of 08-Sep-2026. Required: 500, Done: 120.',
    type: 'production',
    severity: 'danger',
    timestamp: '2 hours ago',
    isRead: false,
    actionRoute: '/production/jobs',
    actionLabel: 'View Job'
  },
  {
    id: 'notif-04',
    title: 'Salary Payment Pending',
    message: 'Monthly wage computation ready for 8 Karigars & Machinists for current cycle.',
    type: 'salary',
    severity: 'info',
    timestamp: 'Yesterday',
    isRead: true,
    actionRoute: '/workers',
    actionLabel: 'Review Wages'
  },
  {
    id: 'notif-05',
    title: 'CNC Machine 02 Maintenance',
    message: 'Preventive lubrication & spindle alignment scheduled for Ace Micromatic Jobber.',
    type: 'system',
    severity: 'warning',
    timestamp: '1 day ago',
    isRead: true,
    actionRoute: '/production',
    actionLabel: 'Schedule'
  }
];
