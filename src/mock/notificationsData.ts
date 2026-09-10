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
  }
];
