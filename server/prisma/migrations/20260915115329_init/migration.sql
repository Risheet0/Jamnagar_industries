-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "photo" TEXT,
    "mobile" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "joiningDate" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "salaryType" TEXT NOT NULL,
    "salary" REAL NOT NULL,
    "salaryNotes" TEXT,
    "overtimeRate" REAL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "shift" TEXT,
    "emergencyContact" TEXT,
    "aadharNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialCode" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "openingStock" REAL NOT NULL,
    "currentStock" REAL NOT NULL,
    "minimumStock" REAL NOT NULL,
    "reorderQuantity" REAL NOT NULL,
    "unitPrice" REAL NOT NULL,
    "supplier" TEXT NOT NULL,
    "locationRack" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastRestockedDate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "materialId" TEXT NOT NULL,
    "materialCode" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "date" TEXT NOT NULL,
    "reference" TEXT,
    "supplier" TEXT,
    "issuedTo" TEXT,
    "heatNumber" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productCode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "photo" TEXT,
    "drawing" TEXT NOT NULL,
    "drawingRevision" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "materialCode" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "weightUnit" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "targetCycleTimeSec" INTEGER NOT NULL,
    "unitPrice" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ProductionJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobNumber" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "requiredQuantity" INTEGER NOT NULL,
    "producedQuantity" INTEGER NOT NULL DEFAULT 0,
    "rejectedQuantity" INTEGER NOT NULL DEFAULT 0,
    "assignedWorker" TEXT NOT NULL,
    "assignedWorkerId" TEXT NOT NULL,
    "machine" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'In Production',
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "QualityInspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "productCode" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "inspectionType" TEXT NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "inspectedQuantity" INTEGER NOT NULL,
    "passedQuantity" INTEGER NOT NULL,
    "rejectedQuantity" INTEGER NOT NULL,
    "defectTypes" TEXT NOT NULL,
    "dimensionalNotes" TEXT,
    "result" TEXT NOT NULL,
    "inspectedBy" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "workerId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "checkInTime" TEXT,
    "checkOutTime" TEXT,
    "notes" TEXT,
    "leaveRecordId" TEXT,
    "updatedAt" DATETIME NOT NULL,

    PRIMARY KEY ("workerId", "date")
);

-- CreateTable
CREATE TABLE "LeaveRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "leaveType" TEXT NOT NULL,
    "reason" TEXT,
    "appliedDate" TEXT NOT NULL,
    "includeWeekends" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "SalaryAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workerId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ShiftConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "standardStartTime" TEXT NOT NULL DEFAULT '08:00',
    "standardEndTime" TEXT NOT NULL DEFAULT '20:00',
    "overtimeMultiplier" REAL NOT NULL DEFAULT 1.5
);

-- CreateTable
CREATE TABLE "FactoryCalendarEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "shiftTimings" TEXT,
    "notes" TEXT,
    "isCustomOverride" BOOLEAN NOT NULL DEFAULT false,
    "declaredBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PlantOperationalConfig" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "defaultWeeklyOffDay" INTEGER NOT NULL DEFAULT 5,
    "weeklyOffTitle" TEXT NOT NULL DEFAULT 'Friday Factory Weekly Off',
    "standardShiftTimings" TEXT NOT NULL DEFAULT '8:00 AM - 8:00 PM (12h Plant Shift)',
    "emergencyContact" TEXT
);

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "plantAddress" TEXT NOT NULL,
    "gstNumber" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "currentUserJson" TEXT NOT NULL,
    "shiftTimingJson" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_workerId_key" ON "Worker"("workerId");

-- CreateIndex
CREATE UNIQUE INDEX "Material_materialCode_key" ON "Material"("materialCode");

-- CreateIndex
CREATE UNIQUE INDEX "Product_productCode_key" ON "Product"("productCode");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionJob_jobNumber_key" ON "ProductionJob"("jobNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FactoryCalendarEntry_date_key" ON "FactoryCalendarEntry"("date");
