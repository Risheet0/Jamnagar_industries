// ==========================================================================
// INDUSTRIAL ERP DOMAIN MODEL TYPES
// Vadilal Engineering Industries
// ==========================================================================

import React from 'react';

export type WorkerSkill = 'CNC Operator' | 'VMC Specialist' | 'Lathe Master' | 'Welder / Fabricator' | 'Tool & Die Maker' | 'Assembly Specialist' | 'Helper / Trainee';

export type WorkerDepartment = 'Machining' | 'Fabrication' | 'Quality & Inspection' | 'Tool Room' | 'Assembly & Packing' | 'Maintenance' | 'Store';

export type SalaryType = 'Monthly Fixed' | 'Daily Wage' | 'Piece Rate (Karigar)';

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
  shift?: 'General' | 'Shift A (Morning)' | 'Shift B (Evening)' | 'Shift C (Night)';
  emergencyContact?: string;
  aadharNumber?: string;
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
