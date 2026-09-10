import { CompanyProfile } from '../types';

export const mockCompanyProfile: CompanyProfile = {
  name: 'Vadilal Engineering Industries',
  location: 'Ahmedabad, Gujarat',
  plantAddress: 'Plot No. 48/B, Phase 2, GIDC Industrial Estate, Vatva, Ahmedabad - 382445, Gujarat, India',
  gstNumber: '24AAACV1234F1Z5',
  phone: '+91 (079) 2583-4900',
  email: 'factory.manager@vadilaleng.in',
  currentUser: {
    name: 'Ramesh Patel',
    username: 'Admin',
    role: 'Factory Manager',
    department: 'Plant Operations & Production Control',
    avatarInitials: 'RP'
  },
  shiftTiming: {
    currentShift: 'Shift A (08:00 AM - 08:00 PM)',
    plantStatus: 'Operational',
    operatorCount: 42
  }
};
