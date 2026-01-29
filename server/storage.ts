import { db } from "./db";
import {
  users, students, teachers, classes, attendance, marks, fees, parents, subjects, classSubjects, timetable, exams,
  academicPeriods, courseHistory,
  studentAccounts, feeStructures, enrollmentHistory, financialTransactions, financialAidAwards,
  finIncome, finExpenses, finAssets, finBudgets, finAuditLogs, finCompliance,
  type InsertUser, type InsertStudent, type InsertTeacher, type InsertClass, type InsertAttendance,
  type User, type Student, type Teacher, type Class, type Attendance,
  type InsertFinIncome, type FinIncome,
  type InsertFinExpense, type FinExpense,
  type InsertFinAsset, type FinAsset,
  type InsertFinBudget, type FinBudget,
  type Fee, // Added Fee import
  type InsertFinCompliance, type FinCompliance,
  type InsertFinAuditLog, type FinAuditLog,
  // LMS Types  
  courseCategories as courseCategoriesTable, courses as coursesTable, courseSections, courseModules, lmsAssignments, lmsQuizzes, lmsForums, courseEnrollments, lmsSubmissions,
  type InsertCourse, type Course,
  type InsertCourseCategory, type CourseCategory,
  type InsertCourseSection, type CourseSection,
  type InsertCourseModule, type CourseModule,
  type InsertLmsAssignment, type LmsAssignment,
  type InsertLmsSubmission, type LmsSubmission,
  // HR Types
  jobPostings, jobApplications, staff,
  type InsertJobPosting, type JobPosting,
  type InsertJobApplication, type JobApplication,
  type InsertStaff, type Staff,
  // GL Module Types
  chartOfAccounts, glFunds, fiscalPeriods, glJournalEntries, glTransactions, glReconciliations, glReconciliationItems,
  type InsertChartOfAccount, type ChartOfAccount,
  type InsertGlFund, type GlFund,
  type InsertFiscalPeriod, type FiscalPeriod,
  type InsertGlJournalEntry, type GlJournalEntry,
  type InsertGlTransaction, type GlTransaction,
  type InsertGlReconciliation, type GlReconciliation,
  type InsertGlReconciliationItem, type GlReconciliationItem,
  // AR Module Types
  arStudentBills, arBillLineItems, arPayments, arPaymentAllocations, arRefunds, arDunningHistory,
  type InsertArStudentBill, type ArStudentBill,
  type InsertArBillLineItem, type ArBillLineItem,
  type InsertArPayment, type ArPayment,
  arChargeItems, type ArChargeItem, type InsertArChargeItem,
  arAutoBillRules, type InsertArAutoBillRule, type ArAutoBillRule,
  // AP Module Types
  apVendors, apInvoices, apInvoiceLineItems, apPayments, apExpenseReports, apExpenseReportItems, ap1099Records,
  purchaseOrders, poLineItems,
  type InsertApVendor, type ApVendor,
  type InsertApInvoice, type ApInvoice,
  type InsertApPayment, type ApPayment,
  type InsertPurchaseOrder, type PurchaseOrder,
  type InsertPoLineItem, type PoLineItem,
  // Payroll Types
  payrollRuns, payrollDetails,
  type InsertPayrollRun, type PayrollRun,
  type InsertPayrollDetail, type PayrollDetail
} from "@shared/schema";
import { eq, and, or, desc, sql, sum } from "drizzle-orm";

export interface IStorage {
  // Users & Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByIdentifier(identifier: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: number, password: string): Promise<void>;

  // Students
  getStudents(classId?: number, status?: "pending" | "approved" | "rejected"): Promise<(Student & { user: User, class: Class | null })[]>;
  getStudent(id: number): Promise<(Student & { user: User }) | undefined>;
  getStudentByUserId(userId: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudentStatus(id: number, status: "approved" | "rejected"): Promise<void>;

  // Teachers
  getTeachers(): Promise<(Teacher & { user: User })[]>;
  getTeacher(id: number): Promise<Teacher | undefined>;
  getTeacherByUserId(userId: number): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;

  // Classes
  getClasses(): Promise<(Class & { classTeacher: Teacher | null })[]>;
  createClass(cls: InsertClass): Promise<Class>;

  // Attendance
  markAttendance(records: InsertAttendance[]): Promise<void>;
  getAttendance(classId?: number, date?: string, studentId?: number): Promise<Attendance[]>;

  // Stats
  getAdminStats(): Promise<{ totalStudents: number; totalTeachers: number; totalClasses: number }>;

  // Fees
  getFees(studentId?: number): Promise<any[]>;
  createFee(fee: any): Promise<any>;
  updateFeeStatus(id: number, status: 'paid' | 'pending' | 'overdue'): Promise<any>;
  getFeeStats(): Promise<{ totalCollected: number; totalPending: number; totalOverdue: number }>;

  // Exams
  getExams(classId?: number): Promise<any[]>;
  createExam(exam: any): Promise<any>;

  // Marks
  getMarks(examId?: number, studentId?: number): Promise<any[]>;
  createMark(mark: any): Promise<any>;
  updateMark(id: number, score: number): Promise<any>;

  // Timetable
  getTimetable(classId?: number): Promise<any[]>;
  createTimetableSlot(slot: any): Promise<any>;
  deleteTimetableSlot(id: number): Promise<void>;

  // Academic Periods
  getAcademicPeriods(): Promise<any[]>;
  createAcademicPeriod(period: any): Promise<any>;
  toggleAcademicPeriod(id: number, isActive: boolean): Promise<void>;

  // Course History
  getStudentCourseHistory(studentId: number): Promise<any[]>;
  createCourseHistory(history: any): Promise<any>;

  // Financial Engine
  getStudentAccount(studentId: number): Promise<any>;
  createStudentAccount(data: any): Promise<any>;
  updateStudentBalance(accountId: number, amount: number): Promise<void>;
  setFinancialHold(studentId: number, hasHold: boolean): Promise<void>;
  getFeeStructures(academicPeriodId?: number): Promise<any[]>;
  createFeeStructure(data: any): Promise<any>;
  getEnrollmentHistory(studentId: number): Promise<any[]>;
  createEnrollment(data: any): Promise<any>;
  updateEnrollmentStatus(id: number, status: string): Promise<void>;
  getFinancialTransactions(accountId: number): Promise<any[]>;
  createFinancialTransaction(data: any): Promise<any>;
  getFinancialAidAwards(studentId: number): Promise<any[]>;
  createFinancialAidAward(award: any): Promise<any>;
  updateAidStatus(id: number, status: string): Promise<void>;

  // Advanced Finance Module
  createFinIncome(income: InsertFinIncome): Promise<FinIncome>;
  getFinIncomes(periodId?: number, type?: string, payerId?: number): Promise<FinIncome[]>;
  createFinExpense(expense: InsertFinExpense): Promise<FinExpense>;
  getFinExpenses(periodId?: number, category?: string, userId?: number): Promise<FinExpense[]>;
  createFinAsset(asset: InsertFinAsset): Promise<FinAsset>;
  getFinAssets(type?: string): Promise<FinAsset[]>;
  createFinBudget(budget: InsertFinBudget): Promise<FinBudget>;
  getFinBudgets(periodId?: number): Promise<FinBudget[]>;
  createFinCompliance(compliance: InsertFinCompliance): Promise<FinCompliance>;
  getFinComplianceItems(type?: string): Promise<FinCompliance[]>;
  logFinAudit(action: string, entityType: string, entityId: number, userId: number, changes?: { old?: any, new?: any }): Promise<void>;
  calculateStudentBill(studentId: number): Promise<{ totalDue: number; breakdown: any }>;

  // LMS Module
  getCourseCategories(): Promise<any[]>;
  createCourseCategory(data: InsertCourseCategory): Promise<any>;

  getCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(data: InsertCourse): Promise<Course>;

  getCourseSections(courseId: number): Promise<CourseSection[]>;
  createCourseSection(data: InsertCourseSection): Promise<CourseSection>;

  getCourseModules(sectionId: number): Promise<CourseModule[]>;
  createCourseModule(data: InsertCourseModule): Promise<CourseModule>;

  createLmsAssignment(data: InsertLmsAssignment): Promise<LmsAssignment>;
  getLmsAssignment(id: number): Promise<LmsAssignment | undefined>;
  createLmsSubmission(data: InsertLmsSubmission): Promise<LmsSubmission>;
  getLmsSubmissions(assignmentId: number): Promise<LmsSubmission[]>;

  // HR & Admissions
  createJobPosting(data: InsertJobPosting): Promise<JobPosting>;
  getJobPostings(status?: "open" | "closed"): Promise<JobPosting[]>;
  createJobApplication(data: InsertJobApplication): Promise<JobApplication>;
  getJobApplications(jobId?: number): Promise<JobApplication[]>;
  updateJobApplicationStatus(id: number, status: string): Promise<void>;
  createStaff(data: InsertStaff): Promise<Staff>;
  getStaffList(): Promise<(Staff & { user: User })[]>;

  // ========================================
  // GENERAL LEDGER (GL) MODULE
  // ========================================
  // Chart of Accounts
  getChartOfAccounts(isActive?: boolean): Promise<ChartOfAccount[]>;
  getChartOfAccount(id: number): Promise<ChartOfAccount | undefined>;
  createChartOfAccount(data: InsertChartOfAccount): Promise<ChartOfAccount>;
  updateChartOfAccount(id: number, data: Partial<InsertChartOfAccount>): Promise<ChartOfAccount>;

  // Funds
  getGlFunds(isActive?: boolean): Promise<GlFund[]>;
  createGlFund(data: InsertGlFund): Promise<GlFund>;

  // Fiscal Periods
  getFiscalPeriods(year?: number): Promise<FiscalPeriod[]>;
  getCurrentFiscalPeriod(): Promise<FiscalPeriod | undefined>;
  createFiscalPeriod(data: InsertFiscalPeriod): Promise<FiscalPeriod>;
  closeFiscalPeriod(id: number, userId: number): Promise<void>;

  // Journal Entries
  createJournalEntry(entry: Omit<InsertGlJournalEntry, 'journalNumber'> & { journalNumber?: string }, transactions: Omit<InsertGlTransaction, 'journalEntryId'>[]): Promise<GlJournalEntry>;
  getJournalEntries(periodId?: number, status?: string): Promise<(GlJournalEntry & { transactions: GlTransaction[] })[]>;
  getJournalEntry(id: number): Promise<(GlJournalEntry & { transactions: GlTransaction[] }) | undefined>;
  postJournalEntry(id: number, userId: number): Promise<void>;
  reverseJournalEntry(id: number, userId: number, reason: string): Promise<GlJournalEntry>;

  // GL Transactions & Reports
  getAccountBalance(accountId: number, fundId?: number, asOfDate?: string): Promise<number>;
  getTrialBalance(periodId: number): Promise<any[]>;
  getBalanceSheet(asOfDate: string): Promise<any>;
  getIncomeStatement(startDate: string, endDate: string): Promise<any>;

  // GL Reconciliations
  getReconciliations(accountId?: number, status?: string): Promise<GlReconciliation[]>;
  getReconciliation(id: number): Promise<any>;
  createReconciliation(data: InsertGlReconciliation): Promise<GlReconciliation>;
  updateReconciliation(id: number, data: Partial<InsertGlReconciliation>): Promise<GlReconciliation>;
  completeReconciliation(id: number, userId: number): Promise<GlReconciliation>;
  getReconciliationItems(reconciliationId: number): Promise<any[]>;
  markTransactionCleared(reconciliationId: number, transactionId: number, isCleared: boolean, clearedDate?: string): Promise<GlReconciliationItem>;
  getUnclearedTransactions(accountId: number, asOfDate: string): Promise<any[]>;
  getReconciliationSummary(reconciliationId: number): Promise<any>;


  // ========================================
  // ACCOUNTS RECEIVABLE (AR) MODULE
  // ========================================
  createStudentBill(bill: InsertArStudentBill, lineItems: InsertArBillLineItem[]): Promise<ArStudentBill>;
  getStudentBills(studentId?: number, status?: string): Promise<ArStudentBill[]>;
  getStudentBill(id: number): Promise<(ArStudentBill & { lineItems: ArBillLineItem[], student: Student }) | undefined>;
  postStudentBillToGL(billId: number): Promise<void>;

  createArPayment(payment: InsertArPayment, allocations: { billId: number, amount: number }[]): Promise<ArPayment>;
  getArPayments(studentId?: number): Promise<ArPayment[]>;
  postArPaymentToGL(paymentId: number): Promise<void>;

  // AR Refunds
  createRefundRequest(refund: any): Promise<any>;
  getRefundRequests(status?: string, studentId?: number): Promise<any[]>;
  approveRefund(id: number, userId: number): Promise<any>;
  rejectRefund(id: number, userId: number, reason: string): Promise<any>;
  processRefund(id: number, checkNumber: string): Promise<any>;
  postRefundToGL(id: number): Promise<void>;

  // AR Dunning
  getOverdueBills(daysOverdue?: number): Promise<any[]>;
  sendDunningNotice(studentId: number, billId: number, level: number): Promise<any>;
  getDunningHistory(studentId?: number, billId?: number): Promise<any[]>;

  // AR Auto-Billing
  createAutoBillRule(rule: InsertArAutoBillRule): Promise<ArAutoBillRule>;
  getAutoBillRules(periodId?: number): Promise<ArAutoBillRule[]>;
  generateBillsFromEnrollment(studentId: number, enrollmentId: number): Promise<ArStudentBill[]>;

  getAgingReport(): Promise<any[]>;

  // ========================================
  // ACCOUNTS PAYABLE (AP) MODULE
  // ========================================
  createApVendor(vendor: InsertApVendor): Promise<ApVendor>;
  getApVendors(isActive?: boolean): Promise<ApVendor[]>;

  createApInvoice(invoice: InsertApInvoice, lineItems: any[]): Promise<ApInvoice>;
  getApInvoices(vendorId?: number, status?: string): Promise<ApInvoice[]>;
  approveApInvoice(id: number, userId: number): Promise<void>;
  postApInvoiceToGL(invoiceId: number): Promise<void>;

  // AP Expense Reports
  createExpenseReport(report: any, items: any[]): Promise<any>;
  getExpenseReports(userId?: number, status?: string): Promise<any[]>;
  submitExpenseReport(id: number): Promise<void>;
  approveExpenseReport(id: number, approverId: number): Promise<void>;
  rejectExpenseReport(id: number, approverId: number, reason: string): Promise<void>;
  postExpenseReportToGL(id: number): Promise<void>;

  // AP 1099 Reporting
  generate1099Records(taxYear: number): Promise<any[]>;
  get1099Records(taxYear: number): Promise<any[]>;

  // AP PO Matching
  createPurchaseOrder(po: any, items: any[]): Promise<PurchaseOrder>;
  getPurchaseOrders(vendorId?: number, status?: string): Promise<PurchaseOrder[]>;
  receivePO(poId: number, items: any[]): Promise<void>;
  matchInvoiceToPO(invoiceId: number, poId: number): Promise<boolean>; // Returns true if matched fully
  getUnmatchedInvoices(): Promise<ApInvoice[]>;

  createApPayment(payment: InsertApPayment): Promise<ApPayment>;
  postApPaymentToGL(paymentId: number): Promise<void>;

  // ========================================
  // PAYROLL MODULE
  // ========================================
  createPayrollRun(run: InsertPayrollRun, details: InsertPayrollDetail[]): Promise<PayrollRun>;
  getPayrollRuns(status?: string): Promise<PayrollRun[]>;
  postPayrollToGL(runId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Academic Periods
  async getAcademicPeriods(): Promise<any[]> {
    return await db.select().from(academicPeriods).orderBy(academicPeriods.startDate);
  }

  async createAcademicPeriod(period: any): Promise<any> {
    const [newPeriod] = await db.insert(academicPeriods).values(period).returning();
    return newPeriod;
  }

  async toggleAcademicPeriod(id: number, isActive: boolean): Promise<void> {
    if (isActive) {
      // Deactivate all others first if activating one
      await db.update(academicPeriods).set({ isActive: false });
    }
    await db.update(academicPeriods).set({ isActive }).where(eq(academicPeriods.id, id));
  }

  // Course History
  async getStudentCourseHistory(studentId: number): Promise<any[]> {
    return await db
      .select({
        history: courseHistory,
        subject: subjects,
        period: academicPeriods
      })
      .from(courseHistory)
      .innerJoin(subjects, eq(courseHistory.subjectId, subjects.id))
      .innerJoin(academicPeriods, eq(courseHistory.academicPeriodId, academicPeriods.id))
      .where(eq(courseHistory.studentId, studentId));
  }

  async createCourseHistory(history: any): Promise<any> {
    const [entry] = await db.insert(courseHistory).values(history).returning();
    return entry;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByIdentifier(identifier: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(
      or(
        eq(users.username, identifier),
        eq(users.email, identifier)
      )
    );
    return user;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUserPassword(id: number, password: string): Promise<void> {
    await db.update(users)
      .set({ password, mustChangePassword: false }) // Reset the flag
      .where(eq(users.id, id));
  }

  // Students
  async getStudents(classId?: number, status?: "pending" | "approved" | "rejected"): Promise<(Student & { user: User, class: Class | null })[]> {
    const query = db
      .select({
        student: students,
        user: users,
        class: classes
      })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .leftJoin(classes, eq(students.classId, classes.id));

    const conditions = [];
    if (classId) conditions.push(eq(students.classId, classId));
    if (status) conditions.push(eq(students.status, status));

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    const rows = await query.execute();
    return rows.map(row => ({ ...row.student, user: row.user, class: row.class }));
  }

  async updateStudentStatus(id: number, status: "approved" | "rejected"): Promise<void> {
    await db.update(students).set({ status }).where(eq(students.id, id));
  }

  async getStudent(id: number): Promise<(Student & { user: User }) | undefined> {
    const [row] = await db
      .select({
        student: students,
        user: users
      })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(eq(students.id, id));

    if (!row) return undefined;
    return { ...row.student, user: row.user };
  }

  async getStudentByUserId(userId: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.userId, userId));
    return student;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  // Teachers
  async getTeachers(): Promise<(Teacher & { user: User })[]> {
    const rows = await db
      .select({
        teacher: teachers,
        user: users
      })
      .from(teachers)
      .innerJoin(users, eq(teachers.userId, users.id));

    return rows.map(row => ({ ...row.teacher, user: row.user }));
  }

  async getTeacher(id: number): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher;
  }

  async getTeacherByUserId(userId: number): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.userId, userId));
    return teacher;
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const [newTeacher] = await db.insert(teachers).values(teacher).returning();
    return newTeacher;
  }

  // Classes
  async getClasses(): Promise<(Class & { classTeacher: Teacher | null })[]> {
    const rows = await db
      .select({
        class: classes,
        teacher: teachers
      })
      .from(classes)
      .leftJoin(teachers, eq(classes.classTeacherId, teachers.id));

    return rows.map(row => ({ ...row.class, classTeacher: row.teacher }));
  }

  async createClass(cls: InsertClass): Promise<Class> {
    const [newClass] = await db.insert(classes).values(cls).returning();
    return newClass;
  }

  // Attendance
  async markAttendance(records: InsertAttendance[]): Promise<void> {
    if (records.length === 0) return;
    await db.insert(attendance).values(records);
  }

  async getAttendance(classId?: number, date?: string, studentId?: number): Promise<Attendance[]> {
    let conditions = [];
    if (date) conditions.push(eq(attendance.date, date));
    if (studentId) conditions.push(eq(attendance.studentId, studentId));

    const query = db.select().from(attendance);

    if (classId) {
      const studentIdsInClass = db.select({ id: students.id }).from(students).where(eq(students.classId, classId));
      conditions.push(sql`${attendance.studentId} IN ${studentIdsInClass}`);
    }

    if (conditions.length > 0) {
      // @ts-ignore
      query.where(and(...conditions));
    }

    return await query.execute();
  }

  // Stats
  async getAdminStats(): Promise<{ totalStudents: number; totalTeachers: number; totalClasses: number }> {
    const [s] = await db.select({ count: sql<number>`count(*)` }).from(students);
    const [t] = await db.select({ count: sql<number>`count(*)` }).from(teachers);
    const [c] = await db.select({ count: sql<number>`count(*)` }).from(classes);

    return {
      totalStudents: Number(s.count),
      totalTeachers: Number(t.count),
      totalClasses: Number(c.count),
    };
  }

  // Fees
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

  async createFee(fee: any): Promise<any> {
    const [newFee] = await db.insert(fees).values(fee).returning();
    return newFee;
  }

  async updateFeeStatus(id: number, status: 'paid' | 'pending' | 'overdue'): Promise<any> {
    const [updated] = await db.update(fees).set({ status }).where(eq(fees.id, id)).returning();
    return updated;
  }

  async getFeeStats(): Promise<{ totalCollected: number; totalPending: number; totalOverdue: number }> {
    const allFees = await db.select().from(fees);
    let totalCollected = 0;
    let totalPending = 0;
    let totalOverdue = 0;

    for (const fee of allFees) {
      if (fee.status === 'paid') totalCollected += fee.amount;
      else if (fee.status === 'pending') totalPending += fee.amount;
      else if (fee.status === 'overdue') totalOverdue += fee.amount;
    }

    return { totalCollected, totalPending, totalOverdue };
  }

  // Exams
  async getExams(classId?: number): Promise<any[]> {
    const query = db.select().from(exams);
    if (classId) {
      query.where(eq(exams.classId, classId));
    }
    return await query.execute();
  }

  async createExam(exam: any): Promise<any> {
    const [newExam] = await db.insert(exams).values(exam).returning();
    return newExam;
  }

  // Marks
  async getMarks(examId?: number, studentId?: number): Promise<any[]> {
    const conditions = [];
    if (examId) conditions.push(eq(marks.examId, examId));
    if (studentId) conditions.push(eq(marks.studentId, studentId));

    const query = db.select().from(marks);
    if (conditions.length > 0) {
      // @ts-ignore
      query.where(and(...conditions));
    }
    return await query.execute();
  }

  async createMark(mark: any): Promise<any> {
    const [newMark] = await db.insert(marks).values(mark).returning();
    return newMark;
  }

  async updateMark(id: number, score: number): Promise<any> {
    const [updated] = await db.update(marks).set({ score }).where(eq(marks.id, id)).returning();
    return updated;
  }

  // Timetable
  async getTimetable(classId?: number): Promise<any[]> {
    const query = db.select().from(timetable);
    if (classId) {
      query.where(eq(timetable.classId, classId));
    }
    return await query.execute();
  }

  async createTimetableSlot(slot: any): Promise<any> {
    const [newSlot] = await db.insert(timetable).values(slot).returning();
    return newSlot;
  }

  async deleteTimetableSlot(id: number): Promise<void> {
    await db.delete(timetable).where(eq(timetable.id, id));
  }

  // ========================================
  // FINANCIAL ENGINE METHODS
  // ========================================

  async getStudentAccount(studentId: number): Promise<any> {
    const [account] = await db.select().from(studentAccounts).where(eq(studentAccounts.studentId, studentId));
    return account;
  }

  async createStudentAccount(data: any): Promise<any> {
    const [account] = await db.insert(studentAccounts).values(data).returning();
    return account;
  }

  async updateStudentBalance(accountId: number, amount: number): Promise<void> {
    await db.update(studentAccounts)
      .set({ currentBalance: amount })
      .where(eq(studentAccounts.id, accountId));
  }

  async setFinancialHold(studentId: number, hasHold: boolean): Promise<void> {
    await db.update(studentAccounts)
      .set({ hasFinancialHold: hasHold })
      .where(eq(studentAccounts.studentId, studentId));
  }

  async getFeeStructures(academicPeriodId?: number): Promise<any[]> {
    const query = db.select().from(feeStructures);
    if (academicPeriodId) {
      query.where(eq(feeStructures.academicPeriodId, academicPeriodId));
    }
    return await query.execute();
  }

  async createFeeStructure(data: any): Promise<any> {
    const [structure] = await db.insert(feeStructures).values(data).returning();
    return structure;
  }

  async getEnrollmentHistory(studentId: number): Promise<any[]> {
    return await db.select().from(enrollmentHistory).where(eq(enrollmentHistory.studentId, studentId));
  }

  async createEnrollment(data: any): Promise<any> {
    const [enrollment] = await db.insert(enrollmentHistory).values(data).returning();
    return enrollment;
  }

  async updateEnrollmentStatus(id: number, status: string): Promise<void> {
    await db.update(enrollmentHistory)
      .set({ status: status as any, calculationRequired: true, statusChangedAt: new Date() })
      .where(eq(enrollmentHistory.id, id));
  }

  async getFinancialTransactions(accountId: number): Promise<any[]> {
    return await db.select().from(financialTransactions)
      .where(eq(financialTransactions.accountId, accountId))
      .orderBy(desc(financialTransactions.createdAt));
  }

  async createFinancialTransaction(data: any): Promise<any> {
    const [tx] = await db.insert(financialTransactions).values(data).returning();
    return tx;
  }

  async getFinancialAidAwards(studentId: number): Promise<any[]> {
    return await db.select().from(financialAidAwards).where(eq(financialAidAwards.studentId, studentId));
  }

  async createFinancialAidAward(data: any): Promise<any> {
    const [award] = await db.insert(financialAidAwards).values(data).returning();
    return award;
  }

  async updateAidStatus(id: number, status: string): Promise<void> {
    const updates: any = { status: status as any };
    if (status === 'disbursed') {
      updates.disbursedAt = new Date();
    }
    await db.update(financialAidAwards).set(updates).where(eq(financialAidAwards.id, id));
  }

  // --- Advanced Finance Module Implementations ---

  async createFinIncome(income: InsertFinIncome): Promise<FinIncome> {
    const [newIncome] = await db.insert(finIncome).values(income).returning();
    // Auto-log audit
    if (newIncome) {
      await this.logFinAudit('create', 'income', newIncome.id, 0, { new: newIncome });
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

  async getStudentFees(studentId: number): Promise<Fee[]> {
    return await db.select().from(fees).where(eq(fees.studentId, studentId)).orderBy(desc(fees.dueDate));
  }

  async createFinExpense(expense: InsertFinExpense): Promise<FinExpense> {
    const [newExpense] = await db.insert(finExpenses).values(expense).returning();
    return newExpense;
  }

  async getFinExpenses(periodId?: number, category?: string): Promise<FinExpense[]> {
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

  /**
   * CALCULATION ENGINE
   * Total_Bill = (Base_Tuition × Credits) + Σ(Course_Fees) + Σ(Term_Fees) - Σ(Waivers)
   */
  async calculateStudentBill(studentId: number): Promise<{ totalDue: number; breakdown: any }> {
    // 1. Get active academic period
    const [activePeriod] = await db.select().from(academicPeriods).where(eq(academicPeriods.isActive, true));
    if (!activePeriod) {
      return { totalDue: 0, breakdown: { error: "No active academic period" } };
    }

    // 2. Get student's enrollments for this period
    const enrollments = await db.select().from(enrollmentHistory)
      .where(and(
        eq(enrollmentHistory.studentId, studentId),
        eq(enrollmentHistory.academicPeriodId, activePeriod.id),
        eq(enrollmentHistory.status, 'enrolled')
      ));

    const totalCredits = enrollments.reduce((sum, e) => sum + (e.credits || 0), 0);

    // 3. Get fee structures for this period
    const allFees = await db.select().from(feeStructures)
      .where(eq(feeStructures.academicPeriodId, activePeriod.id));

    // 4. Calculate components
    let tuitionFee = 0;
    let courseFees = 0;
    let termFees = 0;

    for (const fee of allFees) {
      if (fee.feeType === 'tuition') {
        tuitionFee = fee.isPerCredit ? fee.amount * totalCredits : fee.amount;
      } else if (fee.subjectId) {
        // Course-level fee
        const isEnrolled = enrollments.some(e => e.subjectId === fee.subjectId);
        if (isEnrolled) courseFees += fee.amount;
      } else {
        // Term-level fee (technology, insurance, etc.)
        termFees += fee.amount;
      }
    }

    // 5. Get disbursed financial aid
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

    // 6. Calculate total
    const totalCharges = tuitionFee + courseFees + termFees;
    const totalDue = totalCharges - disbursedAid;

    // 7. Mark calculations as complete
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
        amountDueNow: totalDue - pendingAid // Anticipated aid subtracted
      }
    };
  }
  /**
   * LMS IMPLEMENTATION
   */

  async getCourseCategories(): Promise<any[]> {
    return await db.select().from(courseCategoriesTable);
  }

  async createCourseCategory(data: InsertCourseCategory): Promise<any> {
    const [cat] = await db.insert(courseCategoriesTable).values(data).returning();
    return cat;
  }

  async getCourses(): Promise<Course[]> {
    return await db.select().from(coursesTable);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
    return course;
  }

  async createCourse(data: InsertCourse): Promise<Course> {
    const [course] = await db.insert(coursesTable).values(data).returning();
    return course;
  }

  async getCourseSections(courseId: number): Promise<CourseSection[]> {
    return await db.select().from(courseSections)
      .where(eq(courseSections.courseId, courseId))
      .orderBy(courseSections.order);
  }

  async createCourseSection(data: InsertCourseSection): Promise<CourseSection> {
    const [section] = await db.insert(courseSections).values(data).returning();
    return section;
  }

  async getCourseModules(sectionId: number): Promise<CourseModule[]> {
    return await db.select().from(courseModules)
      .where(eq(courseModules.sectionId, sectionId))
      .orderBy(courseModules.order);
  }

  async createCourseModule(data: InsertCourseModule): Promise<CourseModule> {
    const [module] = await db.insert(courseModules).values(data).returning();
    return module;
  }

  async createLmsAssignment(data: InsertLmsAssignment): Promise<LmsAssignment> {
    const [assign] = await db.insert(lmsAssignments).values(data).returning();
    return assign;
  }

  async getLmsAssignment(id: number): Promise<LmsAssignment | undefined> {
    const [assign] = await db.select().from(lmsAssignments).where(eq(lmsAssignments.id, id));
    return assign;
  }

  async createLmsSubmission(data: InsertLmsSubmission): Promise<LmsSubmission> {
    const [sub] = await db.insert(lmsSubmissions).values(data).returning();
    return sub;
  }

  async getLmsSubmissions(assignmentId: number): Promise<LmsSubmission[]> {
    return await db.select().from(lmsSubmissions).where(eq(lmsSubmissions.assignmentId, assignmentId));
  }

  // ========================================
  // HR & ADMISSIONS IMPLEMENTATION
  // ========================================

  async createJobPosting(data: InsertJobPosting): Promise<JobPosting> {
    const [job] = await db.insert(jobPostings).values(data).returning();
    return job;
  }

  async getJobPostings(status?: "open" | "closed"): Promise<JobPosting[]> {
    if (status) {
      return await db.select().from(jobPostings).where(eq(jobPostings.status, status));
    }
    return await db.select().from(jobPostings);
  }

  async createJobApplication(data: InsertJobApplication): Promise<JobApplication> {
    const [app] = await db.insert(jobApplications).values(data).returning();
    return app;
  }

  async getJobApplications(jobId?: number): Promise<JobApplication[]> {
    if (jobId) {
      return await db.select().from(jobApplications).where(eq(jobApplications.jobId, jobId));
    }
    return await db.select().from(jobApplications);
  }

  async updateJobApplicationStatus(id: number, status: string): Promise<void> {
    await db.update(jobApplications).set({ status: status as any }).where(eq(jobApplications.id, id));
  }

  async createStaff(data: InsertStaff): Promise<Staff> {
    const [s] = await db.insert(staff).values(data).returning();
    return s;
  }

  async getStaffList(): Promise<(Staff & { user: User })[]> {
    const rows = await db
      .select({
        staff: staff,
        user: users
      })
      .from(staff)
      .innerJoin(users, eq(staff.userId, users.id));
    return rows.map(r => ({ ...r.staff, user: r.user }));
  }

  // ========================================
  // GENERAL LEDGER (GL) MODULE IMPLEMENTATIONS
  // ========================================

  // Chart of Accounts
  async getChartOfAccounts(isActive?: boolean): Promise<ChartOfAccount[]> {
    if (isActive !== undefined) {
      return await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.isActive, isActive));
    }
    return await db.select().from(chartOfAccounts).orderBy(chartOfAccounts.accountCode);
  }

  async getChartOfAccount(id: number): Promise<ChartOfAccount | undefined> {
    const [account] = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.id, id));
    return account;
  }

  async createChartOfAccount(data: InsertChartOfAccount): Promise<ChartOfAccount> {
    const [account] = await db.insert(chartOfAccounts).values(data).returning();
    return account;
  }

  async updateChartOfAccount(id: number, data: Partial<InsertChartOfAccount>): Promise<ChartOfAccount> {
    const [updated] = await db.update(chartOfAccounts)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(chartOfAccounts.id, id))
      .returning();
    return updated;
  }

  // Funds
  async getGlFunds(isActive?: boolean): Promise<GlFund[]> {
    if (isActive !== undefined) {
      return await db.select().from(glFunds).where(eq(glFunds.isActive, isActive));
    }
    return await db.select().from(glFunds);
  }

  async createGlFund(data: InsertGlFund): Promise<GlFund> {
    const [fund] = await db.insert(glFunds).values(data).returning();
    return fund;
  }

  // Fiscal Periods
  async getFiscalPeriods(year?: number): Promise<FiscalPeriod[]> {
    if (year) {
      return await db.select().from(fiscalPeriods).where(eq(fiscalPeriods.fiscalYear, year));
    }
    return await db.select().from(fiscalPeriods).orderBy(desc(fiscalPeriods.startDate));
  }

  async getCurrentFiscalPeriod(): Promise<FiscalPeriod | undefined> {
    const today = new Date().toISOString().split('T')[0];
    const [period] = await db.select().from(fiscalPeriods)
      .where(and(
        sql`${fiscalPeriods.startDate} <= ${today}`,
        sql`${fiscalPeriods.endDate} >= ${today}`,
        eq(fiscalPeriods.isClosed, false)
      ));
    return period;
  }

  async createFiscalPeriod(data: InsertFiscalPeriod): Promise<FiscalPeriod> {
    const [period] = await db.insert(fiscalPeriods).values(data).returning();
    return period;
  }

  async closeFiscalPeriod(id: number, userId: number): Promise<void> {
    await db.update(fiscalPeriods)
      .set({ isClosed: true, closedAt: new Date(), closedBy: userId })
      .where(eq(fiscalPeriods.id, id));
  }

  // Journal Entries
  async createJournalEntry(entry: Omit<InsertGlJournalEntry, 'journalNumber'> & { journalNumber?: string }, transactions: Omit<InsertGlTransaction, 'journalEntryId'>[]): Promise<GlJournalEntry> {
    // Validate double-entry: debits must equal credits
    const totalDebit = transactions
      .filter(t => t.transactionType === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalCredit = transactions
      .filter(t => t.transactionType === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    if (totalDebit !== totalCredit) {
      throw new Error(`Double-entry validation failed: Debits (${totalDebit}) must equal Credits (${totalCredit})`);
    }

    // Generate journal number if not provided
    let journalNumber = entry.journalNumber;
    if (!journalNumber) {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const count = await db.select({ count: sql<number>`count(*)` }).from(glJournalEntries);
      journalNumber = `JE-${today}-${String(Number(count[0].count) + 1).padStart(6, '0')}`;
    }

    const [journalEntry] = await db.insert(glJournalEntries).values({
      ...entry,
      journalNumber,
      totalDebit,
      totalCredit
    }).returning();

    // Insert transactions
    for (const txn of transactions) {
      await db.insert(glTransactions).values({
        ...txn,
        journalEntryId: journalEntry.id
      });
    }

    return journalEntry;
  }

  async getJournalEntries(periodId?: number, status?: string): Promise<(GlJournalEntry & { transactions: GlTransaction[] })[]> {
    let conditions = [];
    if (periodId) conditions.push(eq(glJournalEntries.fiscalPeriodId, periodId));
    if (status) conditions.push(eq(glJournalEntries.status, status as any));

    const entries = conditions.length > 0
      ? await db.select().from(glJournalEntries).where(and(...conditions)).orderBy(desc(glJournalEntries.entryDate))
      : await db.select().from(glJournalEntries).orderBy(desc(glJournalEntries.entryDate));

    const result = [];
    for (const entry of entries) {
      const transactions = await db.select().from(glTransactions).where(eq(glTransactions.journalEntryId, entry.id));
      result.push({ ...entry, transactions });
    }
    return result;
  }

  async getJournalEntry(id: number): Promise<(GlJournalEntry & { transactions: GlTransaction[] }) | undefined> {
    const [entry] = await db.select().from(glJournalEntries).where(eq(glJournalEntries.id, id));
    if (!entry) return undefined;

    const transactions = await db.select().from(glTransactions).where(eq(glTransactions.journalEntryId, entry.id));
    return { ...entry, transactions };
  }

  async postJournalEntry(id: number, userId: number): Promise<void> {
    await db.update(glJournalEntries)
      .set({ status: 'posted', postedAt: new Date(), postedBy: userId })
      .where(eq(glJournalEntries.id, id));
  }

  async reverseJournalEntry(id: number, userId: number, reason: string): Promise<GlJournalEntry> {
    const original = await this.getJournalEntry(id);
    if (!original) throw new Error('Journal entry not found');

    // Create reversing entry
    const reversedTransactions = original.transactions.map(t => ({
      accountId: t.accountId,
      fundId: t.fundId,
      transactionType: t.transactionType === 'debit' ? 'credit' as const : 'debit' as const,
      amount: t.amount,
      description: `Reversal: ${reason}`
    }));

    // Generate journal number for reversal\n    const journalNumber = `REV-${new Date().toISOString().split('T')[0]}-${String(Date.now()).slice(-6)}`;

    const reversingEntry = await this.createJournalEntry({
      journalNumber,
      entryDate: new Date().toISOString().split('T')[0],
      fiscalPeriodId: original.fiscalPeriodId,
      description: `REVERSAL - ${original.description} - ${reason}`,
      createdBy: userId,
      referenceType: 'Manual_Reversal',
      referenceId: original.id
    }, reversedTransactions);

    // Mark original as reversed
    await db.update(glJournalEntries)
      .set({ status: 'reversed', reversedBy: reversingEntry.id })
      .where(eq(glJournalEntries.id, id));

    return reversingEntry;
  }

  // GL Reports
  async getAccountBalance(accountId: number, fundId?: number, asOfDate?: string): Promise<number> {
    let conditions = [eq(glTransactions.accountId, accountId)];
    if (fundId) conditions.push(eq(glTransactions.fundId, fundId));
    if (asOfDate) {
      conditions.push(sql`${glJournalEntries.entryDate} <= ${asOfDate}`);
    }

    const txns = await db.select({
      transactionType: glTransactions.transactionType,
      amount: glTransactions.amount
    })
      .from(glTransactions)
      .innerJoin(glJournalEntries, and(
        eq(glTransactions.journalEntryId, glJournalEntries.id),
        eq(glJournalEntries.status, 'posted')
      ))
      .where(and(...conditions));

    // Get account's normal balance
    const [account] = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.id, accountId));
    if (!account) return 0;

    let balance = 0;
    for (const txn of txns) {
      if (account.normalBalance === txn.transactionType) {
        balance += txn.amount;
      } else {
        balance -= txn.amount;
      }
    }
    return balance;
  }

  async getTrialBalance(periodId: number): Promise<any[]> {
    const accounts = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.isActive, true));
    const period = await db.select().from(fiscalPeriods).where(eq(fiscalPeriods.id, periodId));
    if (!period[0]) throw new Error('Fiscal period not found');

    const trialBalance = [];
    for (const account of accounts) {
      const balance = await this.getAccountBalance(account.id, undefined, period[0].endDate);
      if (balance !== 0) {
        trialBalance.push({
          accountCode: account.accountCode,
          accountName: account.accountName,
          accountType: account.accountType,
          debit: account.normalBalance === 'debit' && balance > 0 ? balance : (account.normalBalance === 'credit' && balance < 0 ? Math.abs(balance) : 0),
          credit: account.normalBalance === 'credit' && balance > 0 ? balance : (account.normalBalance === 'debit' && balance < 0 ? Math.abs(balance) : 0),
          balance
        });
      }
    }
    return trialBalance;
  }

  async getBalanceSheet(asOfDate: string): Promise<any> {
    const accounts = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.isActive, true));

    const assets: any[] = [];
    const liabilities: any[] = [];
    const equity: any[] = [];

    for (const account of accounts) {
      const balance = await this.getAccountBalance(account.id, undefined, asOfDate);
      if (balance === 0) continue;

      const item = {
        accountCode: account.accountCode,
        accountName: account.accountName,
        balance
      };

      if (account.accountType === 'asset') assets.push(item);
      else if (account.accountType === 'liability') liabilities.push(item);
      else if (account.accountType === 'equity') equity.push(item);
    }

    const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = liabilities.reduce((sum, l) => sum + l.balance, 0);
    const totalEquity = equity.reduce((sum, e) => sum + e.balance, 0);

    return {
      asOfDate,
      assets,
      liabilities,
      equity,
      totalAssets,
      totalLiabilities,
      totalEquity,
      balanceCheck: totalAssets === (totalLiabilities + totalEquity)
    };
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
  // ACCOUNTS RECEIVABLE (AR) MODULE IMPLEMENTATIONS
  // ========================================

  async createStudentBill(bill: InsertArStudentBill, lineItems: InsertArBillLineItem[]): Promise<ArStudentBill> {
    // Generate bill number
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

    // Insert line items
    for (const item of lineItems) {
      await db.insert(arBillLineItems).values({
        ...item,
        billId: newBill.id
      });
    }

    return newBill;
  }

  async getStudentBills(studentId?: number, status?: string): Promise<ArStudentBill[]> {
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
    const student = await this.getStudent(bill.studentId);
    if (!student) return undefined;

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
        transactionType: 'debit',
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
      createdBy: bill.createdBy || 1,
      referenceType: 'AR_Bill',
      referenceId: billId
    }, transactions);

    // Link bill to GL entry
    await db.update(arStudentBills)
      .set({ glJournalEntryId: journalEntry.id, status: 'open' })
      .where(eq(arStudentBills.id, billId));
  }

  async createArPayment(payment: InsertArPayment, allocations: { billId: number, amount: number }[]): Promise<ArPayment> {
    //  Generate payment number
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const count = await db.select({ count: sql<number>`count(*)` }).from(arPayments);
    const paymentNumber = `PAY-${today.substring(0, 4)}-${String(Number(count[0].count) + 1).padStart(6, '0')}`;

    const [newPayment] = await db.insert(arPayments).values({
      ...payment,
      paymentNumber
    }).returning();

    // Allocate to bills
    for (const alloc of allocations) {
      await db.insert(arPaymentAllocations).values({
        paymentId: newPayment.id,
        billId: alloc.billId,
        amount: alloc.amount
      });

      // Update bill amounts
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

  async getArPayments(studentId?: number): Promise<ArPayment[]> {
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
        transactionType: 'debit',
        amount: payment.amount,
        description: `Cash received - Payment ${payment.paymentNumber}`
      },
      {
        accountId: 2, // AR account
        transactionType: 'credit',
        amount: payment.amount,
        description: `AR payment - ${payment.paymentNumber}`
      }
    ]);

    await db.update(arPayments)
      .set({ glJournalEntryId: journalEntry.id })
      .where(eq(arPayments.id, paymentId));
  }

  async getAgingReport(): Promise<any[]> {
    const bills = await db.select().from(arStudentBills)
      .where(and(
        eq(arStudentBills.status, 'open'),
        sql`${arStudentBills.balanceDue} > 0`
      ));

    const today = new Date();
    const aging = [];

    for (const bill of bills) {
      const dueDate = new Date(bill.dueDate);
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

      const student = await this.getStudent(bill.studentId);
      aging.push({
        billNumber: bill.billNumber,
        studentName: student?.user.name || 'Unknown',
        billDate: bill.billDate,
        dueDate: bill.dueDate,
        totalAmount: bill.totalAmount,
        balanceDue: bill.balanceDue,
        daysOverdue,
        agingBucket: daysOverdue <= 0 ? 'Current' :
          daysOverdue <= 30 ? '1-30 days' :
            daysOverdue <= 60 ? '31-60 days' :
              daysOverdue <= 90 ? '61-90 days' : '90+ days'
      });
    }

    return aging;
  }

  // ========================================
  // AR REFUND PROCESSING
  // ========================================

  async createRefundRequest(refund: any): Promise<any> {
    const [created] = await db.insert(arRefunds).values({
      ...refund,
      status: 'pending',
      requestDate: new Date()
    }).returning();
    return created;
  }

  async getRefundRequests(status?: string, studentId?: number): Promise<any[]> {
    let conditions = [];
    if (status) conditions.push(eq(arRefunds.status, status as any));
    if (studentId) conditions.push(eq(arRefunds.studentId, studentId));

    const query = db.query.arRefunds.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        student: {
          with: {
            user: true
          }
        }
      },
      orderBy: [desc(arRefunds.requestDate)]
    });

    return await query;
  }

  async approveRefund(id: number, userId: number): Promise<any> {
    const [updated] = await db.update(arRefunds)
      .set({
        status: 'approved',
        approvedBy: userId,
        approvedAt: new Date()
      })
      .where(eq(arRefunds.id, id))
      .returning();
    return updated;
  }

  async rejectRefund(id: number, userId: number, reason: string): Promise<any> {
    const [updated] = await db.update(arRefunds)
      .set({
        status: 'rejected',
        approvedBy: userId,
        approvedAt: new Date(),
        notes: reason
      })
      .where(eq(arRefunds.id, id))
      .returning();
    return updated;
  }

  async processRefund(id: number, checkNumber: string): Promise<any> {
    const [updated] = await db.update(arRefunds)
      .set({
        status: 'processed',
        checkNumber,
        processedAt: new Date()
      })
      .where(eq(arRefunds.id, id))
      .returning();
    return updated;
  }

  async postRefundToGL(id: number): Promise<void> {
    const refund = await db.query.arRefunds.findFirst({
      where: eq(arRefunds.id, id)
    });

    if (!refund) throw new Error("Refund not found");
    if (refund.status !== 'processed') throw new Error("Refund must be processed before posting to GL");

    const journalNumber = `REF-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
    const period = await this.getCurrentFiscalPeriod();
    if (!period) throw new Error("No active fiscal period found");

    const entry = await this.createJournalEntry({
      entry: {
        journalNumber,
        entryDate: new Date().toISOString().split('T')[0],
        fiscalPeriodId: period.id,
        description: `Student Refund #${refund.refundNumber} - ${refund.reason}`,
        createdBy: refund.approvedBy!,
        referenceType: 'ar_refund',
        referenceId: refund.id
      },
      transactions: [
        {
          accountId: 4, // Tuition Revenue (contra) or Refund Expense
          transactionType: 'debit',
          amount: refund.amount,
          description: `Refund #${refund.refundNumber}`
        },
        {
          accountId: 1, // Cash
          transactionType: 'credit',
          amount: refund.amount,
          description: `Refund check #${refund.checkNumber || 'pending'}`
        }
      ]
    });

    await db.update(arRefunds)
      .set({ glJournalEntryId: entry.id })
      .where(eq(arRefunds.id, id));
  }

  // ========================================
  // AR DUNNING / COLLECTIONS
  // ========================================

  async getOverdueBills(daysOverdue: number = 1): Promise<any[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOverdue);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const overdue = await db.select({
      id: arStudentBills.id,
      billNumber: arStudentBills.billNumber,
      studentId: arStudentBills.studentId,
      billDate: arStudentBills.billDate,
      dueDate: arStudentBills.dueDate,
      totalAmount: arStudentBills.totalAmount,
      balanceDue: arStudentBills.balanceDue,
    })
      .from(arStudentBills)
      .where(and(
        sql`${arStudentBills.dueDate} < ${cutoffStr}`,
        sql`${arStudentBills.balanceDue} > 0`
      ));

    const today = new Date().toISOString().split('T')[0];
    return overdue.map(bill => {
      const daysOverdue = Math.floor((new Date(today).getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...bill,
        daysOverdue,
        suggestedLevel: daysOverdue >= 90 ? 4 :
          daysOverdue >= 60 ? 3 :
            daysOverdue >= 30 ? 2 : 1
      };
    });
  }

  async sendDunningNotice(studentId: number, billId: number, level: number): Promise<any> {
    const bill = await this.getStudentBill(billId);
    if (!bill) throw new Error("Bill not found");

    const today = new Date().toISOString().split('T')[0];
    const daysOverdue = Math.floor((new Date(today).getTime() - new Date(bill.dueDate).getTime()) / (1000 * 60 * 60 * 24));

    const [notice] = await db.insert(arDunningHistory).values({
      studentId,
      billId,
      dunningLevel: level,
      sentDate: today,
      daysOverdue: Math.max(0, daysOverdue),
      amountDue: bill.balanceDue,
      messageTemplate: `${level === 1 ? 'First' : level === 2 ? 'Second' : level === 3 ? 'Third' : 'Final'} notice sent`
    }).returning();

    // TODO: Integrate with email system to actually send notice
    // await emailService.sendDunningNotice(student, bill, level);

    return notice;
  }

  async getDunningHistory(studentId?: number, billId?: number): Promise<any[]> {
    let conditions = [];
    if (studentId) conditions.push(eq(arDunningHistory.studentId, studentId));
    if (billId) conditions.push(eq(arDunningHistory.billId, billId));

    return await db.query.arDunningHistory.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        student: { with: { user: true } },
        bill: true
      },
      orderBy: [desc(arDunningHistory.sentDate)]
    });
  }

  // AR Auto-Billing Implementation
  async createAutoBillRule(rule: InsertArAutoBillRule): Promise<ArAutoBillRule> {
    const [newRule] = await db.insert(arAutoBillRules).values(rule).returning();
    return newRule;
  }

  async getAutoBillRules(periodId?: number): Promise<ArAutoBillRule[]> {
    if (periodId) {
      return await db.select().from(arAutoBillRules).where(eq(arAutoBillRules.academicPeriodId, periodId));
    }
    return await db.select().from(arAutoBillRules);
  }

  async generateBillsFromEnrollment(studentId: number, enrollmentId: number): Promise<ArStudentBill[]> {
    // 1. Get enrollment details to find course
    const enrollment = await db.query.courseEnrollments.findFirst({
      where: eq(courseEnrollments.id, enrollmentId),
      with: {
        course: true
      }
    });

    if (!enrollment || !enrollment.courseId) {
      throw new Error("Enrollment not found or missing course");
    }

    // 2. Find matching billing rules for this course
    const rules = await db.select().from(arAutoBillRules)
      .where(and(
        eq(arAutoBillRules.isActive, true),
        eq(arAutoBillRules.courseId, enrollment.courseId)
      ));

    if (rules.length === 0) return []; // No rules, no bill

    // 3. Create a new bill
    const termId = 1; // Default to 1 for now
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // Due in 30 days

    const [bill] = await db.insert(arStudentBills).values({
      studentId,
      academicPeriodId: termId,
      billNumber: `BILL-${Date.now()}`,
      billDate: new Date().toISOString().split('T')[0],
      dueDate: dueDate.toISOString().split('T')[0],
      totalAmount: 0,
      balanceDue: 0,
      status: 'open',
      generatedBy: 'system'
    }).returning();

    // 4. Create line items
    let totalAmount = 0;

    for (const rule of rules) {
      const chargeItem = await db.query.arChargeItems.findFirst({
        where: eq(arChargeItems.id, rule.chargeItemId)
      });

      const amount = rule.amount;
      totalAmount += amount;

      await db.insert(arBillLineItems).values({
        billId: bill.id,
        chargeItemId: rule.chargeItemId,
        amount: amount,
        description: rule.description || (chargeItem ? chargeItem.name : "Tuition Fee")
      });
    }

    // 5. Update bill totals
    const [updatedBill] = await db.update(arStudentBills)
      .set({
        totalAmount: totalAmount,
        balanceDue: totalAmount
      })
      .where(eq(arStudentBills.id, bill.id))
      .returning();

    return [updatedBill];
  }



  // ========================================
  // ACCOUNTS PAYABLE (AP) MODULE IMPLEMENTATIONS
  // ========================================

  // AP Expense Report Implementation
  async createApVendor(vendor: InsertApVendor): Promise<ApVendor> {
    const [newVendor] = await db.insert(apVendors).values(vendor).returning();
    return newVendor;
  }

  async createExpenseReport(report: any, items: any[]): Promise<any> {
    const [newReport] = await db.insert(apExpenseReports).values(report).returning();

    for (const item of items) {
      await db.insert(apExpenseReportItems).values({
        ...item,
        expenseReportId: newReport.id
      });
    }

    return await db.query.apExpenseReports.findFirst({
      where: eq(apExpenseReports.id, newReport.id),
      with: { items: true }
    });
  }

  async getExpenseReports(userId?: number, status?: string): Promise<any[]> {
    return await db.query.apExpenseReports.findMany({
      where: and(
        userId ? eq(apExpenseReports.employeeId, userId) : undefined,
        status ? eq(apExpenseReports.status, status) : undefined
      ),
      with: { items: true, employee: true },
      orderBy: desc(apExpenseReports.createdAt)
    });
  }

  async submitExpenseReport(id: number): Promise<void> {
    await db.update(apExpenseReports)
      .set({ status: 'pending_approval' })
      .where(eq(apExpenseReports.id, id));
  }

  async approveExpenseReport(id: number, approverId: number): Promise<void> {
    await db.update(apExpenseReports)
      .set({
        status: 'approved',
        approvedBy: approverId
      })
      .where(eq(apExpenseReports.id, id));
  }

  async rejectExpenseReport(id: number, approverId: number, reason: string): Promise<void> {
    await db.update(apExpenseReports)
      .set({ status: 'rejected' }) // In real app, would store rejection reason in audit log
      .where(eq(apExpenseReports.id, id));
  }

  async postExpenseReportToGL(id: number): Promise<void> {
    const report = await db.query.apExpenseReports.findFirst({
      where: eq(apExpenseReports.id, id),
      with: { items: true }
    });

    if (!report || report.status !== 'approved') {
      throw new Error("Report not found or not approved");
    }

    const period = await this.getCurrentFiscalPeriod();
    if (!period) throw new Error("No active fiscal period");

    const journalNumber = `EXP-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Debit expenses, Credit AP Liability (or Cash/Reimbursement Clearing)
    const transactions = (report.items as any[]).map((item: any) => ({
      accountId: item.glAccountId || 5, // Default to generic expense if missing
      transactionType: 'debit',
      amount: item.amount,
      description: `Exp: ${item.description}`
    }));

    transactions.push({
      accountId: 2, // AP Liability / Reimbursement Payable
      transactionType: 'credit',
      amount: report.totalAmount,
      description: `Reimbursement for ${report.reportNumber}`
    });

    await this.createJournalEntry({
      journalNumber,
      entryDate: new Date().toISOString().split('T')[0],
      fiscalPeriodId: period.id,
      description: `Expense Report ${report.reportNumber}`,
      createdBy: report.employeeId, // or logic system user
      referenceType: 'ap_expense_report',
      referenceId: report.id
    },
      transactions
    );
  }



  // AP 1099 Reporting Implementation
  async generate1099Records(taxYear: number): Promise<any[]> {
    const vendors = await db.select().from(apVendors).where(eq(apVendors.is1099Vendor, true));
    const records = [];

    for (const vendor of vendors) {
      // Get payments for this vendor
      const payments = await db.select().from(apPayments).where(eq(apPayments.vendorId, vendor.id));

      // Filter by year in memory for simplicity (dates are strings or Date objects)
      const yearPayments = payments.filter(p => {
        const d = new Date(p.paymentDate);
        return d.getFullYear() === taxYear;
      });

      const total = yearPayments.reduce((sum, p) => sum + p.amount, 0);

      // Threshold $600 (60000 cents)
      if (total >= 60000) {
        const existing = await db.query.ap1099Records.findFirst({
          where: and(
            eq(ap1099Records.vendorId, vendor.id),
            eq(ap1099Records.taxYear, taxYear)
          )
        });

        if (existing) {
          const [updated] = await db.update(ap1099Records)
            .set({ totalAmount: total, generatedAt: new Date() })
            .where(eq(ap1099Records.id, existing.id))
            .returning();
          records.push(updated);
        } else {
          const [newRecord] = await db.insert(ap1099Records).values({
            vendorId: vendor.id,
            taxYear,
            totalAmount: total,
            formType: '1099-MISC',
            generatedAt: new Date()
          }).returning();
          records.push(newRecord);
        }
      }
    }
    return records;
  }

  async get1099Records(taxYear: number): Promise<any[]> {
    return await db.query.ap1099Records.findMany({
      where: eq(ap1099Records.taxYear, taxYear),
    });
  }

  async getApVendors(isActive?: boolean): Promise<ApVendor[]> {
    if (isActive !== undefined) {
      return await db.select().from(apVendors).where(eq(apVendors.isActive, isActive));
    }
    return await db.select().from(apVendors);
  }

  // AP PO Matching Implementation
  async createPurchaseOrder(po: any, items: any[]): Promise<PurchaseOrder> {
    const [newPO] = await db.insert(purchaseOrders).values(po).returning();

    for (const item of items) {
      await db.insert(poLineItems).values({
        ...item,
        poId: newPO.id
      });
    }

    return newPO;
  }

  async getPurchaseOrders(vendorId?: number, status?: string): Promise<PurchaseOrder[]> {
    const conditions = [];
    if (vendorId) conditions.push(eq(purchaseOrders.vendorId, vendorId));
    if (status) conditions.push(eq(purchaseOrders.status, status));

    return await db.select().from(purchaseOrders)
      .where(conditions.length ? and(...conditions) : undefined);
  }

  async receivePO(poId: number, items: any[]): Promise<void> {
    // items: { id: number, receivedQuantity: number }[]
    for (const item of items) {
      await db.update(poLineItems)
        .set({ receivedQuantity: item.receivedQuantity })
        .where(eq(poLineItems.id, item.id));
    }

    // Check if fully received (Simplified: update status to 'received')
    await db.update(purchaseOrders)
      .set({ status: 'received' })
      .where(eq(purchaseOrders.id, poId));
  }

  async matchInvoiceToPO(invoiceId: number, poId: number): Promise<boolean> {
    // Simplified matching logic
    return true;
  }

  async getUnmatchedInvoices(): Promise<ApInvoice[]> {
    return [];
  }

  async createApInvoice(invoice: InsertApInvoice, lineItems: any[]): Promise<ApInvoice> {
    const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0);

    const [newInvoice] = await db.insert(apInvoices).values({
      ...invoice,
      totalAmount
    }).returning();

    for (const item of lineItems) {
      await db.insert(apInvoiceLineItems).values({
        ...item,
        invoiceId: newInvoice.id
      });
    }

    return newInvoice;
  }

  async getApInvoices(vendorId?: number, status?: string): Promise<ApInvoice[]> {
    let conditions = [];
    if (vendorId) conditions.push(eq(apInvoices.vendorId, vendorId));
    if (status) conditions.push(eq(apInvoices.status, status as any));

    return conditions.length > 0
      ? await db.select().from(apInvoices).where(and(...conditions))
      : await db.select().from(apInvoices);
  }

  async approveApInvoice(id: number, userId: number): Promise<void> {
    await db.update(apInvoices)
      .set({ status: 'approved', approvedBy: userId, approvedAt: new Date() })
      .where(eq(apInvoices.id, id));
  }

  async postApInvoiceToGL(invoiceId: number): Promise<void> {
    const [invoice] = await db.select().from(apInvoices).where(eq(apInvoices.id, invoiceId));
    if (!invoice) throw new Error('Invoice not found');

    const period = await this.getCurrentFiscalPeriod();
    if (!period) throw new Error('No active fiscal period');

    const lineItems = await db.select().from(apInvoiceLineItems).where(eq(apInvoiceLineItems.invoiceId, invoiceId));

    const transactions: Omit<InsertGlTransaction, 'journalEntryId'>[] = [
      {
        accountId: 3, // Accounts Payable
        transactionType: 'credit',
        amount: invoice.totalAmount,
        description: `AP Invoice ${invoice.invoiceNumber}`
      }
    ];

    for (const item of lineItems) {
      if (item.glAccountId) {
        transactions.push({
          accountId: item.glAccountId,
          transactionType: 'debit',
          amount: item.amount,
          description: item.description
        });
      }
    }

    const journalEntry = await this.createJournalEntry({
      entryDate: invoice.invoiceDate,
      fiscalPeriodId: period.id,
      description: `AP Invoice ${invoice.invoiceNumber}`,
      createdBy: invoice.createdBy || 1,
      referenceType: 'AP_Invoice',
      referenceId: invoiceId
    }, transactions);

    await db.update(apInvoices)
      .set({ glJournalEntryId: journalEntry.id })
      .where(eq(apInvoices.id, invoiceId));
  }

  async createApPayment(payment: InsertApPayment): Promise<ApPayment> {
    const [newPayment] = await db.insert(apPayments).values(payment).returning();
    return newPayment;
  }

  async postApPaymentToGL(paymentId: number): Promise<void> {
    const [payment] = await db.select().from(apPayments).where(eq(apPayments.id, paymentId));
    if (!payment) throw new Error('Payment not found');

    const period = await this.getCurrentFiscalPeriod();
    if (!period) throw new Error('No active fiscal period');

    // DR Accounts Payable, CR Cash
    const journalEntry = await this.createJournalEntry({
      entryDate: payment.paymentDate,
      fiscalPeriodId: period.id,
      description: `AP Payment ${payment.paymentNumber}`,
      createdBy: payment.createdBy || 1,
      referenceType: 'AP_Payment',
      referenceId: paymentId
    }, [
      {
        accountId: 3, // AP account
        transactionType: 'debit',
        amount: payment.amount,
        description: `Payment to vendor - ${payment.paymentNumber}`
      },
      {
        accountId: 1, // Cash
        transactionType: 'credit',
        amount: payment.amount,
        description: `Cash disbursed - ${payment.paymentNumber}`
      }
    ]);

    await db.update(apPayments)
      .set({ glJournalEntryId: journalEntry.id, status: 'processed' })
      .where(eq(apPayments.id, paymentId));
  }

  // ========================================
  // PAYROLL MODULE IMPLEMENTATIONS
  // ========================================

  async createPayrollRun(run: InsertPayrollRun, details: InsertPayrollDetail[]): Promise<PayrollRun> {
    const totalGross = details.reduce((sum, d) => sum + d.grossPay, 0);
    const totalNet = details.reduce((sum, d) => sum + d.netPay, 0);
    const totalDeductions = totalGross - totalNet;

    const [payrollRun] = await db.insert(payrollRuns).values({
      ...run,
      totalGross,
      totalNet,
      totalDeductions
    }).returning();

    for (const detail of details) {
      await db.insert(payrollDetails).values({
        ...detail,
        payrollRunId: payrollRun.id
      });
    }

    return payrollRun;
  }

  async getPayrollRuns(status?: string): Promise<PayrollRun[]> {
    if (status) {
      return await db.select().from(payrollRuns).where(eq(payrollRuns.status, status as any));
    }
    return await db.select().from(payrollRuns).orderBy(desc(payrollRuns.payDate));
  }

  async postPayrollToGL(runId: number): Promise<void> {
    const [run] = await db.select().from(payrollRuns).where(eq(payrollRuns.id, runId));
    if (!run) throw new Error('Payroll run not found');

    const period = await this.getCurrentFiscalPeriod();
    if (!period) throw new Error('No active fiscal period');

    // DR Salary Expense, CR Cash and various liability accounts
    const journalEntry = await this.createJournalEntry({
      entryDate: run.payDate,
      fiscalPeriodId: period.id,
      description: `Payroll ${run.runNumber}`,
      createdBy: run.processedBy || 1,
      referenceType: 'Payroll',
      referenceId: runId
    }, [
      {
        accountId: 10, // Salary Expense
        transactionType: 'debit',
        amount: run.totalGross ?? 0,
        description: `Gross payroll - ${run.runNumber}`
      },
      {
        accountId: 1, // Cash
        transactionType: 'credit',
        amount: run.totalNet ?? 0,
        description: `Net payroll disbursed - ${run.runNumber}`
      },
      {
        accountId: 11, // Payroll Tax Payable
        transactionType: 'credit',
        amount: run.totalDeductions ?? 0,
        description: `Payroll deductions - ${run.runNumber}`
      }
    ]);

    await db.update(payrollRuns)
      .set({ glJournalEntryId: journalEntry.id, status: 'paid' })
      .where(eq(payrollRuns.id, runId));
  }

  // ========================================
  // GL RECONCILIATION METHODS
  // ========================================

  async getReconciliations(accountId?: number, status?: string): Promise<GlReconciliation[]> {
    let conditions = [];
    if (accountId) conditions.push(eq(glReconciliations.accountId, accountId));
    if (status) conditions.push(eq(glReconciliations.status, status as any));

    if (conditions.length > 0) {
      return await db.select().from(glReconciliations).where(and(...conditions)).orderBy(desc(glReconciliations.reconciliationDate));
    }
    return await db.select().from(glReconciliations).orderBy(desc(glReconciliations.reconciliationDate));
  }

  async getReconciliation(id: number): Promise<any> {
    const recon = await db.query.glReconciliations.findFirst({
      where: eq(glReconciliations.id, id)
    });

    if (!recon) throw new Error("Reconciliation not found");

    const items = await this.getReconciliationItems(id);
    return { ...recon, items };
  }

  async createReconciliation(data: InsertGlReconciliation): Promise<GlReconciliation> {
    const account = await db.query.chartOfAccounts.findFirst({ where: eq(chartOfAccounts.id, data.accountId) });
    const date = data.reconciliationDate.replace(/-/g, '');
    const count = await db.select({ count: sql<number>`count(*)` }).from(glReconciliations).where(eq(glReconciliations.accountId, data.accountId));
    const reconciliationNumber = `RECON-${account?.accountCode || data.accountId}-${date.slice(0, 6)}-${String(Number(count[0].count) + 1).padStart(3, '0')}`;

    const [recon] = await db.insert(glReconciliations).values({
      ...data,
      reconciliationNumber,
      status: 'in_progress'
    }).returning();

    const unclearedTxns = await this.getUnclearedTransactions(data.accountId, data.reconciliationDate);

    for (const txn of unclearedTxns) {
      await db.insert(glReconciliationItems).values({
        reconciliationId: recon.id,
        transactionId: txn.id,
        isCleared: false
      });
    }

    return recon;
  }

  async updateReconciliation(id: number, data: Partial<InsertGlReconciliation>): Promise<GlReconciliation> {
    const [updated] = await db.update(glReconciliations)
      .set(data)
      .where(eq(glReconciliations.id, id))
      .returning();
    return updated;
  }

  async completeReconciliation(id: number, userId: number): Promise<GlReconciliation> {
    const [updated] = await db.update(glReconciliations)
      .set({
        status: 'completed',
        reconciledAt: new Date(),
        reconciledBy: userId
      })
      .where(eq(glReconciliations.id, id))
      .returning();
    return updated;
  }

  async getReconciliationItems(reconciliationId: number): Promise<any[]> {
    const items = await db.select({
      id: glReconciliationItems.id,
      reconciliationId: glReconciliationItems.reconciliationId,
      transactionId: glReconciliationItems.transactionId,
      isCleared: glReconciliationItems.isCleared,
      clearedDate: glReconciliationItems.clearedDate,
      notes: glReconciliationItems.notes,
      transactionType: glTransactions.transactionType,
      amount: glTransactions.amount,
      description: glTransactions.description,
      entryDate: glJournalEntries.entryDate,
      journalNumber: glJournalEntries.journalNumber,
    })
      .from(glReconciliationItems)
      .innerJoin(glTransactions, eq(glReconciliationItems.transactionId, glTransactions.id))
      .innerJoin(glJournalEntries, eq(glTransactions.journalEntryId, glJournalEntries.id))
      .where(eq(glReconciliationItems.reconciliationId, reconciliationId));

    return items;
  }

  async markTransactionCleared(reconciliationId: number, transactionId: number, isCleared: boolean, clearedDate?: string): Promise<GlReconciliationItem> {
    const [updated] = await db.update(glReconciliationItems)
      .set({
        isCleared,
        clearedDate: isCleared ? (clearedDate || new Date().toISOString().split('T')[0]) : null
      })
      .where(and(
        eq(glReconciliationItems.reconciliationId, reconciliationId),
        eq(glReconciliationItems.transactionId, transactionId)
      ))
      .returning();
    return updated;
  }

  async getUnclearedTransactions(accountId: number, asOfDate: string): Promise<any[]> {
    const txns = await db.select({
      id: glTransactions.id,
      journalEntryId: glTransactions.journalEntryId,
      accountId: glTransactions.accountId,
      transactionType: glTransactions.transactionType,
      amount: glTransactions.amount,
      description: glTransactions.description,
      entryDate: glJournalEntries.entryDate,
      journalNumber: glJournalEntries.journalNumber,
      journalDescription: glJournalEntries.description,
    })
      .from(glTransactions)
      .innerJoin(glJournalEntries, eq(glTransactions.journalEntryId, glJournalEntries.id))
      .where(and(
        eq(glTransactions.accountId, accountId),
        sql`${glJournalEntries.entryDate} <= ${asOfDate}`,
        eq(glJournalEntries.status, 'posted')
      ))
      .orderBy(glJournalEntries.entryDate);

    const unclearedTxns = [];
    for (const txn of txns) {
      const clearedItem = await db.query.glReconciliationItems.findFirst({
        where: and(
          eq(glReconciliationItems.transactionId, txn.id),
          eq(glReconciliationItems.isCleared, true)
        )
      });

      if (!clearedItem) {
        unclearedTxns.push(txn);
      }
    }

    return unclearedTxns;
  }

  async getReconciliationSummary(reconciliationId: number): Promise<any> {
    const recon = await db.query.glReconciliations.findFirst({
      where: eq(glReconciliations.id, reconciliationId)
    });

    if (!recon) throw new Error("Reconciliation not found");

    const items = await db.select({
      isCleared: glReconciliationItems.isCleared,
      transactionType: glTransactions.transactionType,
      amount: glTransactions.amount,
    })
      .from(glReconciliationItems)
      .innerJoin(glTransactions, eq(glReconciliationItems.transactionId, glTransactions.id))
      .where(eq(glReconciliationItems.reconciliationId, reconciliationId));

    const clearedDebits = items.filter(i => i.isCleared && i.transactionType === 'debit').reduce((sum, i) => sum + i.amount, 0);
    const clearedCredits = items.filter(i => i.isCleared && i.transactionType === 'credit').reduce((sum, i) => sum + i.amount, 0);
    const unclearedDebits = items.filter(i => !i.isCleared && i.transactionType === 'debit').reduce((sum, i) => sum + i.amount, 0);
    const unclearedCredits = items.filter(i => !i.isCleared && i.transactionType === 'credit').reduce((sum, i) => sum + i.amount, 0);

    const clearedBalance = clearedCredits - clearedDebits;
    const unclearedBalance = unclearedCredits - unclearedDebits;
    const glBalance = recon.startingBalance + clearedBalance;
    const difference = glBalance - recon.statementBalance;

    return {
      reconciliationNumber: recon.reconciliationNumber,
      reconciliationDate: recon.reconciliationDate,
      startingBalance: recon.startingBalance,
      statementBalance: recon.statementBalance,
      clearedDebits,
      clearedCredits,
      clearedBalance,
      unclearedDebits,
      unclearedCredits,
      unclearedBalance,
      glBalance,
      difference,
      isBalanced: difference === 0
    };
  }
}

export const storage = new DatabaseStorage();