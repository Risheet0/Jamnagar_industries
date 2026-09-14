import React from 'react';
import { DailyAttendanceDetailPage } from './DailyAttendanceDetailPage';
import { getTodayDateString } from '../context/AttendanceContext';

export const AttendancePage: React.FC = () => {
  return <DailyAttendanceDetailPage date={getTodayDateString()} />;
};
