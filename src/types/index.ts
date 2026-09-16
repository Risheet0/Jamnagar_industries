// ==========================================================================
// INDUSTRIAL ERP DOMAIN MODEL TYPES
// Vadilal Engineering Industries
// ==========================================================================

import React from 'react';

export type WorkerSkill = 'CNC Operator' | 'VMC Specialist' | 'Lathe Master' | 'Welder / Fabricator' | 'Tool & Die Maker' | 'Assembly Specialist' | 'Helper / Trainee' | string;

export type WorkerDepartment = 'Machining' | 'Fabrication' | 'Quality & Inspection' | 'Tool Room' | 'Assembly & Packing' | 'Maintenance' | 'Store' | string;

export type SalaryType = 'Monthly Fixed' | 'Daily Wage' | 'Hourly Rate' | 'Piece Rate (Karigar)';

export type WorkerStatus = 'Active' | 'Inactive' | 'On Leave' | 'Terminated';

export interface Worker {
  id: string;              // e.g. WRK-001
  workerId: string;        // WRK-001
  name: string;            // e.g. Rajeshbhai Panchal
  photo?: string;
  mobile: string;          // e.g. +91 98251 44321
  address: string;         // e.g. GIDC Phase 2, Vatva, Ahmedabad
  joiningDate: string;     // YYYY-MM-DD
  skill: WorkerSkill;
  department: WorkerDepartment;
  salaryType: SalaryType;
  salary: number;          // In INR
  salaryNotes?: string;    // Custom rate notes (e.g. piece rate per component, overtime formula)
  overtimeRate?: number;   // Overtime rate per hour in INR
  status: WorkerStatus;
  shift?: string;
  emergencyContact?: string;
  aadharNumber?: string;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Half Day' | 'On Leave' | 'Holiday';

export type LeaveType = 'Sick' | 'Casual' | 'Personal' | 'Emergency' | 'Other';

export interface LeaveRecord {
  id: string;                 // LV-0001
  workerId: string;
  startDate: string;          // YYYY-MM-DD
  endDate: string;            // YYYY-MM-DD (same as startDate for a 1-day leave)
  totalDays: number;          // computed inclusive day count
  leaveType: LeaveType;
  reason?: string;
  appliedDate: string;        // YYYY-MM-DD
  includeWeekends: boolean;   // whether Sat/Sun within range count as leave days
}

export interface AttendanceRecord {
  workerId: string;
  date: string;              // YYYY-MM-DD
  status: AttendanceStatus;
  checkInTime?: string;      // "HH:mm" (24-hr) e.g. "08:15" — only relevant for Present/Half Day
  checkOutTime?: string;     // "HH:mm" (24-hr) e.g. "20:30"
  notes?: string;            // e.g. "Casual Leave", "Left at 1 PM"
  leaveRecordId?: string;    // set only on records auto-created by a LeaveRecord
}

export interface ShiftConfig {
  standardStartTime: string;   // "08:00" (24-hr HH:mm)
  standardEndTime: string;     // "20:00"
  overtimeMultiplier: number;  // default 1.5
}

export type AdjustmentType = 'Uppad' | 'Jama';

export interface SalaryAdjustment {
  id: string;             // ADJ-0001
  workerId: string;
  date: string;           // YYYY-MM-DD
  type: AdjustmentType;
  amount: number;         // always positive
  reason?: string;        // e.g. "Advance for medical", "Festival bonus"
}

export type MaterialType = 'Brass Bar / Rod' | 'Stainless Steel' | 'Mild Steel' | 'Aluminum Alloy' | 'Cutting Tool' | 'Consumable / Oil' | 'Fastener / Hardware';

export type MaterialUnit = 'kg' | 'meters' | 'pieces' | 'liters' | 'rolls' | 'boxes';

export type MaterialStatus = 'In Stock' | 'Low Stock' | 'Out of Stock' | 'On Order';

export interface Material {
  id: string;              // e.g. MAT-001
  materialCode: string;    // MAT-BRS-001
  materialName: string;    // e.g. Brass Round Rod CW614N (IS 319 Free Cutting)
  type: MaterialType;
  grade: string;           // CW614N / SS 304 / EN8 / Al 6061
  size: string;            // e.g. Dia 25mm x 3000mm
  unit: MaterialUnit;
  openingStock: number;
  currentStock: number;
  minimumStock: number;
  reorderQuantity: number;
  unitPrice: number;       // INR per unit
  supplier: string;        // e.g. Jamnagar Brass Syndicate Ltd.
  locationRack: string;    // e.g. Rack B-04
  status: MaterialStatus;
  lastRestockedDate?: string;
}

export type ProductStatus = 'Active Production' | 'Sample / Prototype' | 'Discontinued' | 'On Hold';

export interface Product {
  id: string;              // e.g. PRD-001
  productCode: string;     // PRD-BRS-FIT-01
  productName: string;     // e.g. 1/2" Male Hex Brass Flare Fitting
  photo?: string;
  drawing: string;         // e.g. DWG-2026-BF-01.pdf
  drawingRevision: string; // e.g. Rev 3.2
  drawingUrl?: string;     // Base64 data URL, PDF blob URL or CAD preview
  drawingFileName?: string;// Original uploaded file name
  drawingFileSize?: string;// e.g. "1.4 MB"
  drawingUploadDate?: string; // YYYY-MM-DD
  material: string;        // Brass IS 319 Gr 1
  materialCode: string;    // MAT-BRS-001
  weight: number;          // In grams or kg
  weightUnit: 'g' | 'kg';
  unit: 'pieces' | 'sets' | 'lots';
  targetCycleTimeSec: number;
  unitPrice: number;       // Selling price INR
  status: ProductStatus;
  category: 'Fittings' | 'Valves' | 'Fasteners' | 'Shafts' | 'Bushings' | 'Custom Component';
}

export type JobStatus = 'In Production' | 'Pending' | 'Completed' | 'Delayed' | 'Quality Check' | 'Cancelled';

export interface ProductionJob {
  id: string;              // e.g. JOB-2026-001
  jobNumber: string;       // JOB-2026-001
  date: string;            // YYYY-MM-DD
  customer: string;        // e.g. Bharat Heavy Machinery Corp.
  productCode: string;     // PRD-BRS-FIT-01
  productName: string;     // 1/2" Male Hex Brass Flare Fitting
  requiredQuantity: number;
  producedQuantity: number;
  rejectedQuantity: number;
  assignedWorker: string;  // e.g. Rajeshbhai Panchal (WRK-001)
  assignedWorkerId: string;
  machine: string;         // e.g. CNC Lathe 01 (Doosan Lynx 220)
  dueDate: string;         // YYYY-MM-DD
  status: JobStatus;
  priority: 'High' | 'Medium' | 'Critical' | 'Normal';
  notes?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'stock' | 'quality' | 'salary' | 'production' | 'system';
  severity: 'warning' | 'danger' | 'info' | 'success';
  timestamp: string;
  isRead: boolean;
  actionRoute?: string;
  actionLabel?: string;
}

export interface CompanyProfile {
  name: string;
  location: string;
  plantAddress: string;
  gstNumber: string;
  phone: string;
  email: string;
  currentUser: {
    name: string;
    username: string;
    role: string;
    department: string;
    avatarInitials: string;
  };
  shiftTiming: {
    currentShift: string;
    plantStatus: 'Operational' | 'Shift Change' | 'Maintenance';
    operatorCount: number;
  };
}

export interface StockMovement {
  id: string;                 // e.g. MOV-0001
  materialId: string;
  materialCode: string;
  type: 'Inward' | 'Outward';
  quantity: number;
  date: string;                // YYYY-MM-DD
  reference?: string;          // invoice number, job ID, etc.
  supplier?: string;           // for Inward
  issuedTo?: string;           // for Outward — worker name or job card
  heatNumber?: string;         // for Inward, brass/steel traceability
  notes?: string;
}

export type InspectionResult = 'Pass' | 'Fail' | 'Pending';
export type DefectType = 'Burr' | 'Thread Damage' | 'Undersize' | 'Oversize' | 'Surface Finish' | 'Other';

export interface QualityInspection {
  id: string;                  // QC-0001
  jobId: string;                // linked Production Job ID
  jobNumber: string;
  productCode: string;
  productName: string;
  inspectionType: 'First-Piece' | 'In-Process Sample' | 'Final';
  sampleSize: number;
  inspectedQuantity: number;
  passedQuantity: number;
  rejectedQuantity: number;
  defectTypes: DefectType[];
  dimensionalNotes?: string;   // free text for now, e.g. "OD 24.98mm vs 25.00 ±0.02"
  result: InspectionResult;
  inspectedBy: string;         // worker name or QC inspector name
  date: string;
  remarks?: string;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export type TableColumn<T> = {
  header: string;
  accessor?: keyof T;
  render?: (row: T) => React.ReactNode;
  id?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  className?: string;
};

// ==========================================================================
// UNIVERSAL FACTORY OPERATIONAL CALENDAR TYPES
// ==========================================================================

export type FactoryDayStatus = 'Open' | 'Closed';

export type HolidayCategory =
  | 'Weekly Off'
  | 'Festival'
  | 'National Holiday'
  | 'Plant Maintenance'
  | 'Power Outage / Torrent'
  | 'Emergency Shutdown'
  | 'Custom Holiday'
  | 'Special Working Day';

export interface FactoryCalendarEntry {
  id: string;                    // e.g. CAL-2026-09-18
  date: string;                  // YYYY-MM-DD
  status: FactoryDayStatus;      // 'Open' | 'Closed'
  title: string;                 // e.g. "Friday Weekly Factory Off", "Diwali Plant Holiday"
  category: HolidayCategory;
  shiftTimings?: string;         // e.g. "Standard Plant Shift (8:00 AM - 8:00 PM)"
  notes?: string;
  isCustomOverride?: boolean;    // true if user manually configured this date
  declaredBy?: string;           // e.g. "Plant Admin"
}

export interface PlantOperationalConfig {
  defaultWeeklyOffDay: number;   // 5 = Friday (Standard for Jamnagar Brass / Engineering Plants)
  weeklyOffTitle: string;        // "Friday Factory Weekly Off"
  standardShiftTimings: string;  // "8:00 AM - 8:00 PM (12h Plant Shift)"
  emergencyContact?: string;
}


