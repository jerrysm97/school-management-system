import { db } from "../db";
import {
    fees, studentAccounts, feeStructures, enrollmentHistory, financialTransactions, financialAidAwards,
    finIncome, finExpenses, finAssets, finBudgets, finAuditLogs, finCompliance,
    glJournalEntries, glTransactions, chartOfAccounts, fiscalPeriods, glFunds,
    arStudentBills, arBillLineItems, arPayments, arPaymentAllocations, arRefunds, arDunningHistory, arAutoBillRules, arChargeItems,
    apVendors, apInvoices, apInvoiceLineItems, apExpenseReports, apExpenseReportItems,
    payrollRuns, payrollDetails,
    scholarshipTypes, scholarshipApplications, studentScholarships,
    courseCategories as courseCategoriesTable, courses as coursesTable, courseSections, courseModules, courseEnrollments,
    academicPeriods, users, students,
    type InsertFinIncome, type FinIncome,
    type InsertFinExpense, type FinExpense,
    type InsertFinAsset, type FinAsset,
    type InsertFinBudget, type FinBudget,
    type InsertFinCompliance, type FinCompliance,
    type InsertArStudentBill, type ArStudentBill,
    type InsertArBillLineItem, type ArBillLineItem,
    type InsertArPayment, type ArPayment,
    type InsertApVendor, type ApVendor,
    type InsertApInvoice, type ApInvoice,
    type InsertPayrollRun, type PayrollRun,
    type InsertPayrollDetail, type PayrollDetail,
    type InsertScholarshipType, type ScholarshipType,
    type InsertScholarshipApplication, type ScholarshipApplication,
    type InsertStudentScholarship, type StudentScholarship,
    type InsertCourseCategory, type InsertCourse, type Course, type InsertCourseSection, type CourseSection, type CourseModule,
    type InsertArAutoBillRule, type ArAutoBillRule,
    type Fee, type InsertFee,
    type PaymentPlan, type InsertPaymentPlan, type PaymentPlanInstallment, type InsertPaymentPlanInstallment,
    type FinAidAward, type InsertFinAidAward,
    type FeeCategory, type InsertFeeCategory,
    type FeeStructureV2, type InsertFeeStructureV2,
    type StudentFee, type InsertStudentFee,
    type InsertGlJournalEntry, type GlJournalEntry,
    type InsertGlTransaction, type GlTransaction,
    type ChartOfAccount, type FiscalPeriod,
    type StudentEnrollment, type InsertStudentEnrollment,
    type InsertExpenseCategory, type ExpenseCategory, type InsertVendor, type Vendor, type InsertExpense, type Expense,
    expenseCategories, vendors, expenses, paymentPlans, paymentPlanInstallments, feeStructuresv2, studentFees, feeCategories, studentEnrollments
} from "@shared/schema";
import { eq, and, desc, sql, lt, ne, isNull, isNotNull, inArray, sum } from "drizzle-orm";
import { encrypt, decrypt } from "../utils/encryption";
import { sanitizeUser } from "./user.service";

export class FinanceService {

    // ========================================
    // CORE FINANCE: FEES & ACCOUNTS
    // ========================================

    async getFees(studentId?: number): Promise<any[]> {
        const query = db
            .select({
                fee: fees,
                student: students,
                user: users
            })
            .from(fees)
            .innerJoin(students, eq(fees.studentId, students.id))
            .innerJoin(users, eq(students.userId, users.id));

        if (studentId) {
            query.where(eq(fees.studentId, studentId));
        }

        const rows = await query.execute();
        return rows.map(row => ({ ...row.fee, student: { ...row.student, user: row.user } }));
    }

    async createFee(fee: InsertFee): Promise<Fee> {
        const [newFee] = await db.insert(fees).values(fee).returning();
        return newFee;
    }

    async bulkCreateFees(feesData: InsertFee[]): Promise<Fee[]> {
        if (feesData.length === 0) return [];
        const newFees = await db.insert(fees).values(feesData).returning();
        return newFees;
    }

    async updateFeeStatus(id: number, status: 'paid' | 'pending' | 'overdue'): Promise<Fee> {
        const [updated] = await db.update(fees).set({ status }).where(eq(fees.id, id)).returning();
        return updated;
    }

    // Legacy fees from old system
    async getLegacyStudentFees(studentId: string): Promise<Fee[]> {
        return await db.select().from(fees).where(eq(fees.studentId, studentId as any)).orderBy(desc(fees.dueDate));
    }

    async getStudentAccount(studentId: number): Promise<any> {
        const [account] = await db.select().from(studentAccounts).where(eq(studentAccounts.studentId, studentId));
        return account;
    }

    async createStudentAccount(data: any): Promise<any> {
        const [account] = await db.insert(studentAccounts).values(data).returning();
        return account;
    }

    async updateStudentBalance(accountId: number, amount: number, userId?: number): Promise<void> {
        const [oldAccount] = await db.select()
            .from(studentAccounts)
            .where(eq(studentAccounts.id, accountId));

        const oldBalance = oldAccount?.currentBalance || 0;

        await db.update(studentAccounts)
            .set({ currentBalance: amount })
            .where(eq(studentAccounts.id, accountId));

        if (userId && oldAccount) {
            await this.logFinAudit('update', 'student_account', accountId, userId, {
                old: { currentBalance: oldBalance },
                new: { currentBalance: amount }
            });
        }
    }

    async setFinancialHold(studentId: number, hasHold: boolean): Promise<void> {
        await db.update(studentAccounts)
            .set({ hasFinancialHold: hasHold })
            .where(eq(studentAccounts.studentId, studentId));
    }

    // Phase 2: Fee Structures V2 & Categories
    async getFeeCategories(): Promise<FeeCategory[]> {
        return await db.select().from(feeCategories);
    }

    async createFeeCategory(category: InsertFeeCategory): Promise<FeeCategory> {
        const [newCategory] = await db.insert(feeCategories).values(category).returning();
        return newCategory;
    }

    async getFeeStructuresV2(academicYearId?: number, programId?: number): Promise<FeeStructureV2[]> {
        let conditions = [];
        if (academicYearId) conditions.push(eq(feeStructuresv2.academicYearId, academicYearId));
        if (programId) conditions.push(eq(feeStructuresv2.programId, programId));

        if (conditions.length === 0) return await db.select().from(feeStructuresv2);

        return await db.select().from(feeStructuresv2).where(and(...conditions));
    }

    async createFeeStructureV2(structure: InsertFeeStructureV2): Promise<FeeStructureV2> {
        const [newStructure] = await db.insert(feeStructuresv2).values(structure).returning();
        return newStructure;
    }

    async getStudentFees(studentId: number): Promise<StudentFee[]> {
        return await db.select().from(studentFees).where(eq(studentFees.studentId, studentId));
    }

    async createStudentFee(fee: InsertStudentFee): Promise<StudentFee> {
        const [newFee] = await db.insert(studentFees).values(fee).returning();
        return newFee;
    }

    async calculateStudentBill(studentId: number): Promise<{ totalDue: number; breakdown: any }> {
        const [activePeriod] = await db.select().from(academicPeriods).where(eq(academicPeriods.isActive, true));
        if (!activePeriod) {
            return { totalDue: 0, breakdown: { error: "No active academic period" } };
        }

        const enrollments = await db.select().from(enrollmentHistory)
            .where(and(
                eq(enrollmentHistory.studentId, studentId),
                eq(enrollmentHistory.academicPeriodId, activePeriod.id),
                eq(enrollmentHistory.status, 'enrolled')
            ));

        // Fix: Cast credits to number safely
        const totalCredits = enrollments.reduce((sum, e) => sum + (Number(e.credits) || 0), 0);

        const allFees = await db.select().from(feeStructures)
            .where(eq(feeStructures.academicPeriodId, activePeriod.id));

        let tuitionFee = 0;
        let courseFees = 0;
        let termFees = 0;

        for (const fee of allFees) {
            if (fee.feeType === 'tuition') {
                tuitionFee = fee.isPerCredit ? fee.amount * totalCredits : fee.amount;
            } else if (fee.subjectId) {
                const isEnrolled = enrollments.some(e => e.subjectId === fee.subjectId);
                if (isEnrolled) courseFees += fee.amount;
            } else {
                termFees += fee.amount;
            }
        }

        const aidAwards = await db.select().from(financialAidAwards)
            .where(and(
                eq(financialAidAwards.studentId, studentId),
                eq(financialAidAwards.academicPeriodId, activePeriod.id)
            ));

        const disbursedAid = aidAwards
            .filter(a => a.status === 'disbursed')
            .reduce((sum, a) => sum + a.amount, 0);

        const pendingAid = aidAwards
            .filter(a => a.status === 'pending' || a.status === 'approved')
            .reduce((sum, a) => sum + a.amount, 0);

        const totalCharges = tuitionFee + courseFees + termFees;
        const totalDue = totalCharges - disbursedAid;

        for (const enrollment of enrollments) {
            await db.update(enrollmentHistory)
                .set({ calculationRequired: false })
                .where(eq(enrollmentHistory.id, enrollment.id));
        }

        return {
            totalDue,
            breakdown: {
                credits: totalCredits,
                tuition: tuitionFee,
                courseFees,
                termFees,
                totalCharges,
                disbursedAid,
                pendingAid,
                amountDueNow: totalDue - pendingAid
            }
        };
    }

    // ========================================
    // GENERAL LEDGER (GL)
    // ========================================

    async getChartOfAccounts(): Promise<ChartOfAccount[]> {
        return await db.select().from(chartOfAccounts).orderBy(chartOfAccounts.accountCode);
    }

    async createJournalEntry(entry: InsertGlJournalEntry, transactions: InsertGlTransaction[]): Promise<GlJournalEntry> {
        const [newEntry] = await db.insert(glJournalEntries).values(entry).returning();

        for (const txn of transactions) {
            await db.insert(glTransactions).values({
                ...txn,
                journalEntryId: newEntry.id
            });
        }

        return newEntry;
    }

    async getTrialBalance(fiscalPeriodId: number): Promise<any[]> {
        const entries = await db.select().from(glJournalEntries).where(eq(glJournalEntries.fiscalPeriodId, fiscalPeriodId));
        if (entries.length === 0) return [];

        // logic simplified for brevity, assume aggregation query
        const txns = await db.select().from(glTransactions)
            .where(inArray(glTransactions.journalEntryId, entries.map(e => e.id)));

        // ... complex aggregation logic ...
        return []; // Placeholder for complex logic in storage.ts
    }

    async getCurrentFiscalPeriod(): Promise<FiscalPeriod | undefined> {
        const today = new Date().toISOString().split('T')[0];
        const [period] = await db.select().from(fiscalPeriods)
            .where(and(
                // @ts-ignore
                sql`${fiscalPeriods.startDate} <= ${today}`,
                // @ts-ignore
                sql`${fiscalPeriods.endDate} >= ${today}`,
                eq(fiscalPeriods.status, 'open')
            ));
        return period;
    }

    async getIncomeStatement(startDate: string, endDate: string): Promise<any> {
        const accounts = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.isActive, true));

        const revenue: any[] = [];
        const expenses: any[] = [];

        for (const account of accounts) {
            // Get transactions in date range
            const txns = await db.select({
                transactionType: glTransactions.transactionType,
                amount: glTransactions.amount
            })
                .from(glTransactions)
                .innerJoin(glJournalEntries, and(
                    eq(glTransactions.journalEntryId, glJournalEntries.id),
                    eq(glJournalEntries.status, 'posted'),
                    sql`${glJournalEntries.entryDate} >= ${startDate}`,
                    sql`${glJournalEntries.entryDate} <= ${endDate}`
                ))
                .where(eq(glTransactions.accountId, account.id));

            let netActivity = 0;
            for (const txn of txns) {
                if (account.normalBalance === txn.transactionType) {
                    netActivity += txn.amount;
                } else {
                    netActivity -= txn.amount;
                }
            }

            if (netActivity === 0) continue;

            const item = {
                accountCode: account.accountCode,
                accountName: account.accountName,
                amount: netActivity
            };

            if (account.accountType === 'revenue') revenue.push(item);
            else if (account.accountType === 'expense') expenses.push(item);
        }

        const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
        const netIncome = totalRevenue - totalExpenses;

        return {
            startDate,
            endDate,
            revenue,
            expenses,
            totalRevenue,
            totalExpenses,
            netIncome
        };
    }

    // ========================================
    // ACCOUNTS RECEIVABLE (AR)
    // ========================================

    async createStudentBill(bill: InsertArStudentBill, lineItems: InsertArBillLineItem[]): Promise<ArStudentBill> {
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const count = await db.select({ count: sql<number>`count(*)` }).from(arStudentBills);
        const billNumber = `BILL-${today.substring(0, 4)}-${String(Number(count[0].count) + 1).padStart(6, '0')}`;

        const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

        const [newBill] = await db.insert(arStudentBills).values({
            ...bill,
            billNumber,
            totalAmount,
            balanceDue: totalAmount
        }).returning();

        for (const item of lineItems) {
            await db.insert(arBillLineItems).values({
                ...item,
                billId: newBill.id
            });
        }

        return newBill;
    }

    async getStudentBills(studentId?: string, status?: string): Promise<ArStudentBill[]> {
        let conditions = [];
        if (studentId) conditions.push(eq(arStudentBills.studentId, studentId));
        if (status) conditions.push(eq(arStudentBills.status, status as any));

        return conditions.length > 0
            ? await db.select().from(arStudentBills).where(and(...conditions)).orderBy(desc(arStudentBills.billDate))
            : await db.select().from(arStudentBills).orderBy(desc(arStudentBills.billDate));
    }

    async getStudentBill(id: number): Promise<(ArStudentBill & { lineItems: ArBillLineItem[], student: Student }) | undefined> {
        const [bill] = await db.select().from(arStudentBills).where(eq(arStudentBills.id, id));
        if (!bill) return undefined;

        const lineItems = await db.select().from(arBillLineItems).where(eq(arBillLineItems.billId, id));

        // Assuming we need student access here. This crosses service boundaries (Finance -> Academic).
        // For now, we will do a direct DB call to keep services decoupled or inject AcademicService?
        // Direct DB call to avoid circular dependency or complex injection for now.
        const [studentRow] = await db.select({ student: students, user: users })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .where(eq(students.id, bill.studentId));

        if (!studentRow) return undefined;

        // Helper to sanitize without full service injection
        const student = { ...studentRow.student, user: sanitizeUser(studentRow.user) };

        return { ...bill, lineItems, student };
    }

    async postStudentBillToGL(billId: number): Promise<void> {
        const bill = await this.getStudentBill(billId);
        if (!bill) throw new Error('Bill not found');
        if (bill.glJournalEntryId) throw new Error('Bill already posted to GL');

        const period = await this.getCurrentFiscalPeriod();
        if (!period) throw new Error('No active fiscal period');

        // Create GL entry: DR Accounts Receivable, CR Revenue accounts
        const transactions: Omit<InsertGlTransaction, 'journalEntryId'>[] = [
            {
                accountId: 2, // Accounts Receivable (need to get this from COA)
                transactionType: 'debit' as const,
                amount: bill.totalAmount,
                description: `Student Bill ${bill.billNumber}`
            }
        ];

        // Add credit transactions for each line item
        for (const item of bill.lineItems) {
            if (item.glAccountId) {
                transactions.push({
                    accountId: item.glAccountId,
                    transactionType: 'credit',
                    amount: item.amount,
                    description: item.description
                });
            }
        }

        const journalEntry = await this.createJournalEntry({
            entryDate: bill.billDate,
            fiscalPeriodId: period.id,
            description: `Student Bill ${bill.billNumber} - ${(bill.student as any).user.name}`,
            createdBy: bill.createdBy!, // Assumes bill has createdBy
            referenceType: 'AR_Bill',
            referenceId: billId
        }, transactions);

        // Link bill to GL entry
        await db.update(arStudentBills)
            .set({ glJournalEntryId: journalEntry.id, status: 'open' })
            .where(eq(arStudentBills.id, billId));
    }

    async createArPayment(payment: InsertArPayment, allocations: { billId: number, amount: number }[]): Promise<ArPayment> {
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const count = await db.select({ count: sql<number>`count(*)` }).from(arPayments);
        const paymentNumber = `PAY-${today.substring(0, 4)}-${String(Number(count[0].count) + 1).padStart(6, '0')}`;

        const [newPayment] = await db.insert(arPayments).values({
            ...payment,
            paymentNumber
        }).returning();

        for (const alloc of allocations) {
            await db.insert(arPaymentAllocations).values({
                paymentId: newPayment.id,
                billId: alloc.billId,
                amount: alloc.amount
            });

            const [bill] = await db.select().from(arStudentBills).where(eq(arStudentBills.id, alloc.billId));
            if (bill) {
                const newPaidAmount = bill.paidAmount + alloc.amount;
                const newBalance = bill.totalAmount - newPaidAmount;
                const newStatus = newBalance === 0 ? 'paid' : (newPaidAmount > 0 ? 'partial' : bill.status);

                await db.update(arStudentBills)
                    .set({ paidAmount: newPaidAmount, balanceDue: newBalance, status: newStatus as any })
                    .where(eq(arStudentBills.id, alloc.billId));
            }
        }

        return newPayment;
    }

    async getArPayments(studentId?: string): Promise<ArPayment[]> {
        if (studentId) {
            return await db.select().from(arPayments).where(eq(arPayments.studentId, studentId));
        }
        return await db.select().from(arPayments).orderBy(desc(arPayments.paymentDate));
    }

    async postArPaymentToGL(paymentId: number): Promise<void> {
        const [payment] = await db.select().from(arPayments).where(eq(arPayments.id, paymentId));
        if (!payment) throw new Error('Payment not found');
        if (payment.glJournalEntryId) throw new Error('Payment already posted to GL');

        const period = await this.getCurrentFiscalPeriod();
        if (!period) throw new Error('No active fiscal period');

        // DR Cash, CR Accounts Receivable
        const journalEntry = await this.createJournalEntry({
            entryDate: payment.paymentDate,
            fiscalPeriodId: period.id,
            description: `Payment ${payment.paymentNumber}`,
            createdBy: payment.createdBy || 1,
            referenceType: 'AR_Payment',
            referenceId: paymentId
        }, [
            {
                accountId: 1, // Cash account
                transactionType: 'debit' as const,
                amount: payment.amount,
                description: `Cash received - Payment ${payment.paymentNumber}`
            },
            {
                accountId: 2, // Accounts Receivable
                transactionType: 'credit' as const,
                amount: payment.amount,
                description: `Payment allocation`
            }
        ]);

        await db.update(arPayments)
            .set({ glJournalEntryId: journalEntry.id })
            .where(eq(arPayments.id, paymentId));
    }

    // ========================================
    // ACCOUNTS PAYABLE (AP) & EXPENSES
    // ========================================

    async createApVendor(vendor: InsertApVendor): Promise<ApVendor> {
        const encryptedVendor = {
            ...vendor,
            bankAccountInfo: vendor.bankAccountInfo ? encrypt(vendor.bankAccountInfo) : null
        };
        const [newVendor] = await db.insert(apVendors).values(encryptedVendor).returning();
        return {
            ...newVendor,
            bankAccountInfo: newVendor.bankAccountInfo ? decrypt(newVendor.bankAccountInfo) : null
        };
    }

    async getVendors(): Promise<Vendor[]> {
        return await db.select().from(vendors).where(eq(vendors.isActive, true));
    }

    async createExpenseCategory(category: InsertExpenseCategory): Promise<ExpenseCategory> {
        const [newCat] = await db.insert(expenseCategories).values(category).returning();
        return newCat;
    }

    async getExpenseCategories(): Promise<ExpenseCategory[]> {
        return await db.select().from(expenseCategories).where(eq(expenseCategories.isActive, true));
    }

    async createExpense(expense: InsertExpense): Promise<Expense> {
        const [newExpense] = await db.insert(expenses).values(expense).returning();
        return newExpense;
    }

    async getExpenses(departmentId?: number): Promise<Expense[]> {
        const query = db.select().from(expenses);
        if (departmentId) {
            query.where(eq(expenses.departmentId, departmentId));
        }
        return await query.orderBy(desc(expenses.expenseDate));
    }

    // ========================================
    // SCHOLARSHIPS & FINANCIAL AID
    // ========================================

    async createScholarshipType(type: InsertScholarshipType): Promise<ScholarshipType> {
        const [newType] = await db.insert(scholarshipTypes).values(type).returning();
        return newType;
    }

    async getScholarshipTypes(): Promise<ScholarshipType[]> {
        return await db.select().from(scholarshipTypes).where(eq(scholarshipTypes.isActive, true));
    }

    async createScholarshipApplication(app: InsertScholarshipApplication): Promise<ScholarshipApplication> {
        const [newApp] = await db.insert(scholarshipApplications).values(app).returning();
        return newApp;
    }

    async getScholarshipApplications(studentId?: number): Promise<ScholarshipApplication[]> {
        const query = db.select().from(scholarshipApplications);
        if (studentId) {
            query.where(eq(scholarshipApplications.studentId, studentId));
        }
        return await query.orderBy(desc(scholarshipApplications.applicationDate));
    }

    async createStudentScholarship(scholarship: InsertStudentScholarship): Promise<StudentScholarship> {
        const [newScholarship] = await db.insert(studentScholarships).values(scholarship).returning();
        return newScholarship;
    }

    async getStudentScholarships(studentId?: number): Promise<StudentScholarship[]> {
        const query = db.select().from(studentScholarships);
        if (studentId) {
            query.where(eq(studentScholarships.studentId, studentId));
        }
        return await query.orderBy(desc(studentScholarships.createdAt));
    }

    async getFinancialAidAwards(studentId?: number): Promise<FinAidAward[]> {
        const query = db.select().from(financialAidAwards);
        if (studentId) {
            query.where(eq(financialAidAwards.studentId, studentId));
        }
        return await query.execute();
    }

    async createFinancialAidAward(award: InsertFinAidAward): Promise<FinAidAward> {
        const [newAward] = await db.insert(financialAidAwards).values(award).returning();
        return newAward;
    }

    async updateFinancialAidStatus(id: number, status: string): Promise<FinAidAward> {
        const [updated] = await db.update(financialAidAwards)
            .set({
                status: status as any,
                disbursedAt: status === 'disbursed' ? new Date() : undefined
            })
            .where(eq(financialAidAwards.id, id))
            .returning();
        return updated;
    }

    // ========================================
    // PAYROLL
    // ========================================

    async createPayrollRun(run: InsertPayrollRun): Promise<PayrollRun> {
        const [newRun] = await db.insert(payrollRuns).values(run).returning();
        return newRun;
    }

    async getPayrollRuns(): Promise<PayrollRun[]> {
        return await db.select().from(payrollRuns).orderBy(desc(payrollRuns.periodEnd));
    }

    async addPayrollDetail(detail: InsertPayrollDetail): Promise<PayrollDetail> {
        const [newDetail] = await db.insert(payrollDetails).values(detail).returning();
        return newDetail;
    }

    // ========================================
    // PAYMENT PLANS
    // ========================================

    async getPaymentPlans(studentId?: number): Promise<PaymentPlan[]> {
        const query = db.select().from(paymentPlans);
        if (studentId) {
            query.where(eq(paymentPlans.studentId, studentId));
        }
        return await query.execute();
    }

    async getPaymentPlan(id: number): Promise<(PaymentPlan & { installments: PaymentPlanInstallment[] }) | undefined> {
        const [plan] = await db.select().from(paymentPlans).where(eq(paymentPlans.id, id));
        if (!plan) return undefined;

        const installments = await db.select().from(paymentPlanInstallments).where(eq(paymentPlanInstallments.paymentPlanId, id));
        return { ...plan, installments };
    }

    async createPaymentPlan(plan: InsertPaymentPlan): Promise<PaymentPlan> {
        const [newPlan] = await db.insert(paymentPlans).values(plan).returning();
        return newPlan;
    }

    async createPaymentPlanInstallment(installment: InsertPaymentPlanInstallment): Promise<PaymentPlanInstallment> {
        const [newInstallment] = await db.insert(paymentPlanInstallments).values(installment).returning();
        return newInstallment;
    }

    async updatePaymentPlanStatus(id: number, status: string): Promise<void> {
        await db.update(paymentPlans).set({ status }).where(eq(paymentPlans.id, id));
    }

    // ========================================
    // AUDIT & UTIL
    // ========================================

    async logFinAudit(action: string, entityType: string, entityId: number, userId: number, changes?: { old?: any, new?: any }): Promise<void> {
        await db.insert(finAuditLogs).values({
            action: action as any,
            entityType,
            entityId,
            userId,
            oldValue: changes?.old,
            newValue: changes?.new
        });
    }

    // ========================================
    // ASSETS, COMPLIANCE, BUDGETS
    // ========================================

    async createFinIncome(income: InsertFinIncome, userId: number): Promise<FinIncome> {
        const [newIncome] = await db.insert(finIncome).values(income).returning();
        if (newIncome && userId) {
            try {
                await this.logFinAudit('create', 'income', newIncome.id, userId, { new: newIncome });
            } catch (auditError) {
                console.error('Audit log failed:', auditError);
            }
        }
        return newIncome;
    }

    async getFinIncomes(periodId?: number, type?: string, payerId?: number): Promise<FinIncome[]> {
        let conditions = [];
        if (periodId) conditions.push(eq(finIncome.academicPeriodId, periodId));
        if (type) conditions.push(eq(finIncome.sourceType, type as any));
        if (payerId) conditions.push(eq(finIncome.payerId, payerId));

        if (conditions.length > 0) {
            return await db.select().from(finIncome).where(and(...conditions)).orderBy(desc(finIncome.date));
        }
        return await db.select().from(finIncome).orderBy(desc(finIncome.date));
    }

    async createFinExpense(expense: InsertFinExpense): Promise<FinExpense> {
        const [newExpense] = await db.insert(finExpenses).values(expense).returning();
        return newExpense;
    }

    async getFinExpenses(periodId?: number, category?: string, userId?: number): Promise<FinExpense[]> {
        // Basic implementation
        return await db.select().from(finExpenses);
    }

    async createFinAsset(asset: InsertFinAsset): Promise<FinAsset> {
        const [newAsset] = await db.insert(finAssets).values(asset).returning();
        return newAsset;
    }

    async getFinAssets(type?: string): Promise<FinAsset[]> {
        if (type) {
            return await db.select().from(finAssets).where(eq(finAssets.type, type as any));
        }
        return await db.select().from(finAssets);
    }

    async createFinBudget(budget: InsertFinBudget): Promise<FinBudget> {
        const [newBudget] = await db.insert(finBudgets).values(budget).returning();
        return newBudget;
    }

    async getFinBudgets(periodId?: number): Promise<FinBudget[]> {
        return await db.select().from(finBudgets);
    }

    async createFinCompliance(compliance: InsertFinCompliance): Promise<FinCompliance> {
        const [newComp] = await db.insert(finCompliance).values(compliance).returning();
        return newComp;
    }

    async getFinComplianceItems(type?: string): Promise<FinCompliance[]> {
        return await db.select().from(finCompliance);
    }
}
