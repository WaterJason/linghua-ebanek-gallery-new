-- AlterTable
ALTER TABLE "SystemSetting" ADD COLUMN     "basicWorkingDays" INTEGER NOT NULL DEFAULT 22,
ADD COLUMN     "basicWorkingHours" DOUBLE PRECISION NOT NULL DEFAULT 8,
ADD COLUMN     "holidayOvertimeRate" DOUBLE PRECISION NOT NULL DEFAULT 3,
ADD COLUMN     "overtimeRate" DOUBLE PRECISION NOT NULL DEFAULT 1.5,
ADD COLUMN     "socialInsuranceRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "weekendOvertimeRate" DOUBLE PRECISION NOT NULL DEFAULT 2;

-- CreateTable
CREATE TABLE "SalaryRecord" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "baseSalary" DOUBLE PRECISION NOT NULL,
    "scheduleSalary" DOUBLE PRECISION NOT NULL,
    "salesCommission" DOUBLE PRECISION NOT NULL,
    "pieceWorkIncome" DOUBLE PRECISION NOT NULL,
    "workshopIncome" DOUBLE PRECISION NOT NULL,
    "coffeeShiftCommission" DOUBLE PRECISION NOT NULL,
    "overtimePay" DOUBLE PRECISION NOT NULL,
    "bonus" DOUBLE PRECISION NOT NULL,
    "deductions" DOUBLE PRECISION NOT NULL,
    "socialInsurance" DOUBLE PRECISION NOT NULL,
    "tax" DOUBLE PRECISION NOT NULL,
    "totalIncome" DOUBLE PRECISION NOT NULL,
    "netIncome" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "paymentDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryAdjustment" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "adjustmentDate" TIMESTAMP(3) NOT NULL,
    "oldSalary" DOUBLE PRECISION NOT NULL,
    "newSalary" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "approvedBy" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalaryRecord_employeeId_year_month_key" ON "SalaryRecord"("employeeId", "year", "month");

-- AddForeignKey
ALTER TABLE "SalaryRecord" ADD CONSTRAINT "SalaryRecord_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
