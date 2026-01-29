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
  type InsertCourseCategory, type InsertCourse, type InsertCourseSection, type InsertCourseModule,
  type InsertLmsAssignment, type InsertLmsQuiz, type InsertLmsForum, type InsertCourseEnrollment, type InsertLmsSubmission,
  type Course, type CourseSection, type CourseModule, type LmsAssignment, type LmsSubmission,
  // HR Types
  jobPostings, jobApplications, staff,
  type InsertJobPosting, type JobPosting,
  type InsertJobApplication, type JobApplication,
  type InsertStaff, type Staff
} from "@shared/schema";
import { eq, and, desc, sql, sum } from "drizzle-orm";

export interface IStorage {
  // Users & Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
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
  getFinIncomes(periodId?: number, type?: string): Promise<FinIncome[]>;
  createFinExpense(expense: InsertFinExpense): Promise<FinExpense>;
  getFinExpenses(periodId?: number, category?: string): Promise<FinExpense[]>;
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
}

export const storage = new DatabaseStorage();