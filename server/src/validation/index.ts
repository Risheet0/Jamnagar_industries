import { z } from 'zod';

// Auth
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters long')
});

// Worker
export const workerSchema = z.object({
  workerId: z.string().optional(),
  name: z.string().min(1, 'Worker name is required'),
  photo: z.string().optional(),
  mobile: z.string().min(5, 'Valid mobile number is required'),
  address: z.string().min(1, 'Address is required'),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  skill: z.string().min(1, 'Skill is required'),
  department: z.string().min(1, 'Department is required'),
  salaryType: z.enum(['Monthly Fixed', 'Daily Wage', 'Hourly Rate', 'Piece Rate (Karigar)']),
  salary: z.number().nonnegative('Salary must be non-negative'),
  salaryNotes: z.string().optional(),
  overtimeRate: z.number().nonnegative().optional(),
  status: z.enum(['Active', 'Inactive', 'On Leave', 'Terminated']).default('Active'),
  shift: z.string().optional(),
  emergencyContact: z.string().optional(),
  aadharNumber: z.string().optional()
});

export const updateWorkerSchema = workerSchema.partial();

// Material
export const materialSchema = z.object({
  materialCode: z.string().min(1, 'Material code is required'),
  materialName: z.string().min(1, 'Material name is required'),
  type: z.string().min(1, 'Material type is required'),
  grade: z.string().min(1, 'Grade is required'),
  size: z.string().min(1, 'Size is required'),
  unit: z.enum(['kg', 'meters', 'pieces', 'liters', 'rolls', 'boxes']),
  openingStock: z.number().nonnegative(),
  currentStock: z.number().nonnegative().optional(),
  minimumStock: z.number().nonnegative(),
  reorderQuantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  supplier: z.string().min(1, 'Supplier is required'),
  locationRack: z.string().min(1, 'Rack location is required'),
  status: z.enum(['In Stock', 'Low Stock', 'Out of Stock', 'On Order']).optional(),
  lastRestockedDate: z.string().optional()
});

export const updateMaterialSchema = materialSchema
  .omit({ currentStock: true }) // currentStock cannot be arbitrarily overwritten via PUT
  .partial();

export const stockInwardSchema = z.object({
  quantity: z.number().positive('Quantity must be greater than 0'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  reference: z.string().optional(),
  supplier: z.string().optional(),
  heatNumber: z.string().optional(),
  notes: z.string().optional()
});

export const stockOutwardSchema = z.object({
  quantity: z.number().positive('Quantity must be greater than 0'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  reference: z.string().optional(),
  issuedTo: z.string().optional(),
  notes: z.string().optional()
});

// Product
export const productSchema = z.object({
  productCode: z.string().min(1, 'Product code is required'),
  productName: z.string().min(1, 'Product name is required'),
  photo: z.string().optional(),
  drawing: z.string().min(1, 'Drawing reference is required'),
  drawingRevision: z.string().min(1, 'Drawing revision is required'),
  drawingUrl: z.string().optional(),
  drawingFileName: z.string().optional(),
  drawingFileSize: z.string().optional(),
  drawingUploadDate: z.string().optional(),
  material: z.string().min(1, 'Material description is required'),
  materialCode: z.string().min(1, 'Material code is required'),
  weight: z.number().positive('Weight must be positive'),
  weightUnit: z.enum(['g', 'kg']),
  unit: z.enum(['pieces', 'sets', 'lots']),
  targetCycleTimeSec: z.number().int().positive('Target cycle time must be positive integer'),
  unitPrice: z.number().positive('Unit price must be positive'),
  status: z.enum(['Active Production', 'Sample / Prototype', 'Discontinued', 'On Hold']),
  category: z.enum(['Fittings', 'Valves', 'Fasteners', 'Shafts', 'Bushings', 'Custom Component'])
});

export const updateProductSchema = productSchema.partial();

// Production Job
export const productionJobSchema = z.object({
  jobNumber: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  customer: z.string().min(1, 'Customer name is required'),
  productCode: z.string().min(1, 'Product code is required'),
  productName: z.string().min(1, 'Product name is required'),
  requiredQuantity: z.number().int().positive('Required quantity must be a positive integer'),
  producedQuantity: z.number().int().nonnegative().default(0),
  rejectedQuantity: z.number().int().nonnegative().default(0),
  assignedWorker: z.string().min(1, 'Assigned worker name is required'),
  assignedWorkerId: z.string().min(1, 'Assigned worker ID is required'),
  machine: z.string().min(1, 'Machine is required'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
  status: z.enum(['In Production', 'Pending', 'Completed', 'Delayed', 'Quality Check', 'Cancelled']).default('In Production'),
  priority: z.enum(['High', 'Medium', 'Critical', 'Normal']).default('Normal'),
  notes: z.string().optional(),
  // For atomic material deduction on job creation
  deductMaterialStock: z.boolean().optional().default(true),
  materialCode: z.string().optional(),
  materialQuantityToDeduct: z.number().positive().optional()
});

export const updateProductionJobSchema = productionJobSchema.partial();

export const logProductionSchema = z.object({
  additionalProduced: z.number().int().nonnegative('Produced quantity must be non-negative'),
  additionalRejected: z.number().int().nonnegative().default(0),
  notes: z.string().optional()
});

// Quality Inspection
export const qualityInspectionSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  jobNumber: z.string().min(1, 'Job number is required'),
  productCode: z.string().min(1, 'Product code is required'),
  productName: z.string().min(1, 'Product name is required'),
  inspectionType: z.enum(['First-Piece', 'In-Process Sample', 'Final']),
  sampleSize: z.number().int().positive('Sample size must be positive'),
  inspectedQuantity: z.number().int().positive('Inspected quantity must be positive'),
  passedQuantity: z.number().int().nonnegative(),
  rejectedQuantity: z.number().int().nonnegative(),
  defectTypes: z.array(z.string()).default([]),
  dimensionalNotes: z.string().optional(),
  result: z.enum(['Pass', 'Fail', 'Pending']),
  inspectedBy: z.string().min(1, 'Inspector name is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  remarks: z.string().optional()
});

export const updateQualityInspectionSchema = qualityInspectionSchema.partial();

// Attendance
export const attendanceMarkSchema = z.object({
  workerId: z.string().min(1, 'Worker ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  status: z.enum(['Present', 'Absent', 'Half Day', 'On Leave', 'Holiday']),
  checkInTime: z.string().optional(),
  checkOutTime: z.string().optional(),
  notes: z.string().optional(),
  leaveRecordId: z.string().optional()
});

export const attendanceBulkMarkSchema = z.object({
  workerIds: z.array(z.string()).min(1, 'At least one worker ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  status: z.enum(['Present', 'Absent', 'Half Day', 'On Leave', 'Holiday'])
});

// Leaves
export const applyLeaveSchema = z.object({
  workerId: z.string().min(1, 'Worker ID is required'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  leaveType: z.enum(['Sick', 'Casual', 'Personal', 'Emergency', 'Other']),
  reason: z.string().optional(),
  includeWeekends: z.boolean().default(false),
  force: z.boolean().default(false)
});

// Payroll & Salary Adjustments
export const salaryAdjustmentSchema = z.object({
  workerId: z.string().min(1, 'Worker ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  type: z.enum(['Uppad', 'Jama']),
  amount: z.number().positive('Amount must be positive'),
  reason: z.string().optional()
});

export const shiftConfigSchema = z.object({
  standardStartTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:mm 24-hr format'),
  standardEndTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:mm 24-hr format'),
  overtimeMultiplier: z.number().positive('Multiplier must be positive')
});

// Factory Calendar
export const calendarOverrideSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  status: z.enum(['Open', 'Closed']),
  title: z.string().min(1, 'Title is required'),
  category: z.enum([
    'Weekly Off',
    'Festival',
    'National Holiday',
    'Plant Maintenance',
    'Power Outage / Torrent',
    'Emergency Shutdown',
    'Custom Holiday',
    'Special Working Day'
  ]),
  notes: z.string().optional(),
  shiftTimings: z.string().optional(),
  declaredBy: z.string().optional()
});

export const plantConfigSchema = z.object({
  defaultWeeklyOffDay: z.number().int().min(0).max(6),
  weeklyOffTitle: z.string().min(1),
  standardShiftTimings: z.string().min(1),
  emergencyContact: z.string().optional()
});

// Company Profile
export const companyProfileSchema = z.object({
  name: z.string().min(1),
  location: z.string().min(1),
  plantAddress: z.string().min(1),
  gstNumber: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  currentUser: z.object({
    name: z.string(),
    username: z.string(),
    role: z.string(),
    department: z.string(),
    avatarInitials: z.string()
  }).optional(),
  shiftTiming: z.object({
    currentShift: z.string(),
    plantStatus: z.enum(['Operational', 'Shift Change', 'Maintenance']),
    operatorCount: z.number()
  }).optional()
});
