import { pgTable, text, serial, integer, boolean, timestamp, date, pgEnum, jsonb, AnyPgColumn, foreignKey, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["main_admin", "admin", "principal", "accountant", "teacher", "student", "parent"]);
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent", "late", "excused"]);

// --- Advanced Financial Module Enums ---
export const finSourceTypeEnum = pgEnum("fin_source_type", ["fee", "scholarship", "donation", "fund", "sponsorship", "other"]);
export const finExpenseCategoryEnum = pgEnum("fin_expense_category", ["salary", "operations", "aid", "academic", "maintenance", "other"]);
export const finAssetTypeEnum = pgEnum("fin_asset_type", ["fixed", "current", "intangible"]);
export const finBudgetCategoryEnum = pgEnum("fin_budget_category", ["income", "expense"]);
export const finComplianceTypeEnum = pgEnum("fin_compliance_type", ["title_iv", "tax", "regulatory", "audit"]);
export const finAuditActionEnum = pgEnum("fin_audit_action", ["create", "update", "delete", "approve", "reject"]);

export const feeStatusEnum = pgEnum("fee_status", ["pending", "paid", "overdue", "partial"]);
export const paymentMethodEnum = pgEnum("payment_method", ["cash", "card", "bank_transfer", "check", "online"]);
export const refundStatusEnum = pgEnum("refund_status", ["pending", "approved", "rejected", "processed"]);
export const feeTypeEnum = pgEnum("fee_type", ["tuition", "hostel", "transport", "library", "exam", "other"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["payment", "refund", "waiver", "charge", "adjustment"]);
export const studentStatusEnum = pgEnum("student_status", ["pending", "approved", "rejected"]);
export const gradeEnum = pgEnum("grade_letter", ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"]);

// Financial Engine Enums
export const accountTypeEnum = pgEnum("account_type", ["checking", "savings"]);
export const enrollmentStatusEnum = pgEnum("enrollment_status", ["enrolled", "dropped", "withdrawn"]);
export const paymentModeEnum = pgEnum("payment_mode", ["cash", "upi", "card", "bank_transfer"]);
export const finTransactionTypeEnum = pgEnum("fin_transaction_type", ["debit", "credit"]);
export const aidTypeEnum = pgEnum("aid_type", ["pell", "loan", "scholarship", "grant", "work_study"]);
export const aidStatusEnum = pgEnum("aid_status", ["pending", "approved", "disbursed", "cancelled"]);
export const residencyEnum = pgEnum("residency_status", ["in_state", "out_of_state", "international"]);

// LMS Enums
export const lmsModuleTypeEnum = pgEnum("lms_module_type", ["assignment", "quiz", "forum", "file", "video", "page"]);
export const lmsForumTypeEnum = pgEnum("lms_forum_type", ["general", "qa", "news"]);
export const submissionStatusEnum = pgEnum("submission_status", ["submitted", "graded", "late", "draft"]);

// Users Table (Supabase Auth Linked)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authId: uuid("auth_id").unique(), // Links to Supabase auth.users.id
  name: text("name").notNull(),
  username: text("username").unique().notNull(),
  email: text("email"),
  password: text("password"), // Optional when using Supabase Auth
  role: roleEnum("role").notNull(),
  mustChangePassword: boolean("must_change_password").default(false),
  googleId: text("google_id").unique(),
  avatarUrl: text("avatar_url"),
  udf: jsonb("udf").default({}), // Universal Data Fields
  metadata: jsonb("metadata").default({}), // Smart Feature: Flexible storage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Academic Periods
export const academicPeriods = pgTable("academic_periods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Fall 2026"
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isActive: boolean("is_active").default(false),
});

// Teachers Table
export const teachers = pgTable("teachers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  department: text("department"),
  phone: text("phone"),
  metadata: jsonb("metadata").default({}),
  deletedAt: timestamp("deleted_at"),
});

// Parents Table
export const parents = pgTable("parents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  phone: text("phone"),
  address: text("address"),
  metadata: jsonb("metadata").default({}),
  deletedAt: timestamp("deleted_at"),
});

// Classes Table
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  grade: text("grade").notNull(),
  section: text("section").notNull(),
  classTeacherId: uuid("class_teacher_id").references(() => teachers.id),
  academicPeriodId: integer("academic_period_id").references(() => academicPeriods.id),
  deletedAt: timestamp("deleted_at"),
});

// Students Table (Supabase Ready)
export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id),
  admissionNo: text("admission_no").unique().notNull(),
  classId: integer("class_id").references(() => classes.id),
  dob: date("dob").notNull(),
  gender: genderEnum("gender"),
  phone: text("phone"),
  address: text("address"),
  deletedAt: timestamp("deleted_at"),
  parentId: uuid("parent_id").references(() => parents.id),
  status: studentStatusEnum("status").default("pending").notNull(),
  // PS_PERSON Fields
  nationalId: text("national_id"),
  citizenship: text("citizenship"),
  ethnicity: text("ethnicity"),
  religion: text("religion"),
  bloodGroup: text("blood_group"),
  // Previous Education Fields
  previousSchoolName: text("previous_school_name"),
  previousClass: text("previous_class"),
  previousGrade: text("previous_grade"),
  previousMarksObtained: text("previous_marks_obtained"),
  transferCertificateNo: text("transfer_certificate_no"),
  metadata: jsonb("metadata").default({}), // Smart Feature
});

// Subjects Table
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code"),
});

// Class Subjects
export const classSubjects = pgTable("class_subjects", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classes.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  teacherId: uuid("teacher_id").references(() => teachers.id),
});

// Attendance Table
export const attendance = pgTable("attendance", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  studentId: uuid("student_id").notNull().references(() => students.id),
  academicPeriodId: integer("academic_period_id").references(() => academicPeriods.id), // Better history tracking
  date: date("date").notNull(),
  status: attendanceStatusEnum("status").notNull(),
  remarks: text("remarks"),
});

// Exams Table
export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  classId: integer("class_id").notNull().references(() => classes.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  date: date("date").notNull(),
  totalMarks: integer("total_marks").notNull().default(100),
});

// Marks Table
export const marks = pgTable("marks", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  examId: integer("exam_id").notNull().references(() => exams.id),
  studentId: uuid("student_id").notNull().references(() => students.id),
  score: integer("score").notNull(),
});

// Course History
export const courseHistory = pgTable("course_history", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  studentId: uuid("student_id").notNull().references(() => students.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  academicPeriodId: integer("academic_period_id").notNull().references(() => academicPeriods.id),
  score: integer("score"),
  grade: gradeEnum("grade"),
  credits: integer("credits").default(0),
  isCompleted: boolean("is_completed").default(false),
});

// Fees Table
export const fees = pgTable("fees", {
  id: serial("id").primaryKey(),
  studentId: uuid("student_id").notNull().references(() => students.id),
  amount: integer("amount").notNull(),
  dueDate: date("due_date").notNull(),
  status: feeStatusEnum("status").default("pending").notNull(),
  description: text("description"),
  parentFeeId: integer("parent_fee_id"),
  deletedAt: timestamp("deleted_at"),
}, (table) => {
  return {
    parentFeeFk: foreignKey({
      columns: [table.parentFeeId],
      foreignColumns: [table.id],
    }),
  };
});

// Timetable Table
export const timetable = pgTable("timetable", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classes.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  dayOfWeek: integer("day_of_week").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
});

// ========================================
// FINANCIAL ENGINE TABLES
// ========================================

// Student Accounts - Real-time financial standing
export const studentAccounts = pgTable("student_accounts", {
  id: serial("id").primaryKey(),
  studentId: uuid("student_id").notNull().references(() => students.id).unique(),
  currentBalance: integer("current_balance").default(0).notNull(), // in cents
  accountType: accountTypeEnum("account_type").default("checking"),
  residencyStatus: residencyEnum("residency_status").default("in_state"),
  hasFinancialHold: boolean("has_financial_hold").default(false),
  metadata: jsonb("metadata").default({}),
  dateOpened: timestamp("date_opened").defaultNow(),
});

// Fee Structures - Master rates for all charges
export const feeStructures = pgTable("fee_structures", {
  id: serial("id").primaryKey(),
  subjectId: integer("subject_id").references(() => subjects.id), // null = term-level fee
  feeType: feeTypeEnum("fee_type").notNull(),
  amount: integer("amount").notNull(), // in cents
  currency: text("currency").default("USD"),
  academicPeriodId: integer("academic_period_id").references(() => academicPeriods.id),
  isPerCredit: boolean("is_per_credit").default(false), // for tuition calculation
  description: text("description"),
});

// Enrollment History - Tracks changes that trigger recalculation
export const enrollmentHistory = pgTable("enrollment_history", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  studentId: uuid("student_id").notNull().references(() => students.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  academicPeriodId: integer("academic_period_id").notNull().references(() => academicPeriods.id),
  status: enrollmentStatusEnum("status").notNull().default("enrolled"),
  credits: integer("credits").default(3),
  calculationRequired: boolean("calculation_required").default(true),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  statusChangedAt: timestamp("status_changed_at"),
});

// Financial Transactions - Individual payment/bill events
export const financialTransactions = pgTable("financial_transactions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  accountId: integer("account_id").notNull().references(() => studentAccounts.id),
  amount: integer("amount").notNull(), // in cents
  transactionType: finTransactionTypeEnum("transaction_type").notNull(),
  paymentMode: paymentModeEnum("payment_mode"),
  description: text("description"),
  referenceNo: text("reference_no"), // external payment reference
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Financial Aid Awards - Tracks aid from external sources
export const financialAidAwards = pgTable("financial_aid_awards", {
  id: serial("id").primaryKey(),
  studentId: uuid("student_id").notNull().references(() => students.id),
  aidType: aidTypeEnum("aid_type").notNull(),
  amount: integer("amount").notNull(), // in cents
  status: aidStatusEnum("status").default("pending").notNull(),
  academicPeriodId: integer("academic_period_id").references(() => academicPeriods.id),
  disbursedAt: timestamp("disbursed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  teacher: one(teachers, { fields: [users.id], references: [teachers.userId] }),
  student: one(students, { fields: [users.id], references: [students.userId] }),
  parent: one(parents, { fields: [users.id], references: [parents.userId] }),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  user: one(users, { fields: [students.userId], references: [users.id] }),
  class: one(classes, { fields: [students.classId], references: [classes.id] }),
  parent: one(parents, { fields: [students.parentId], references: [parents.id] }),
  attendance: many(attendance),
  marks: many(marks),
  fees: many(fees),
  courseHistory: many(courseHistory),
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  classTeacher: one(teachers, { fields: [classes.classTeacherId], references: [teachers.id] }),
  academicPeriod: one(academicPeriods, { fields: [classes.academicPeriodId], references: [academicPeriods.id] }),
  students: many(students),
  subjects: many(classSubjects),
  timetable: many(timetable),
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, { fields: [teachers.userId], references: [users.id] }),
  classes: many(classes),
  subjects: many(classSubjects),
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true, mustChangePassword: true });
export const insertTeacherSchema = createInsertSchema(teachers).omit({ id: true });
export const insertParentSchema = createInsertSchema(parents).omit({ id: true });
export const insertClassSchema = createInsertSchema(classes).omit({ id: true });
export const insertStudentSchema = createInsertSchema(students).omit({ id: true });
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true });
export const insertClassSubjectSchema = createInsertSchema(classSubjects).omit({ id: true });
export const insertAttendanceSchema = createInsertSchema(attendance);  // id is generatedAlwaysAsIdentity
export const insertExamSchema = createInsertSchema(exams).omit({ id: true });
export const insertMarkSchema = createInsertSchema(marks);  // id is generatedAlwaysAsIdentity
export const insertFeeSchema = createInsertSchema(fees).omit({ id: true });
export const insertTimetableSchema = createInsertSchema(timetable).omit({ id: true });
export const insertAcademicPeriodSchema = createInsertSchema(academicPeriods).omit({ id: true });
export const insertCourseHistorySchema = createInsertSchema(courseHistory);  // id is generatedAlwaysAsIdentity

// Financial Engine Schemas
export const insertStudentAccountSchema = createInsertSchema(studentAccounts).omit({ id: true, dateOpened: true });
export const insertFeeStructureSchema = createInsertSchema(feeStructures).omit({ id: true });
export const insertEnrollmentHistorySchema = createInsertSchema(enrollmentHistory).omit({ enrolledAt: true });
export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions).omit({ createdAt: true });
export const insertFinancialAidAwardSchema = createInsertSchema(financialAidAwards).omit({ id: true, createdAt: true });

// Export Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;
export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type Fee = typeof fees.$inferSelect;
export type InsertFee = z.infer<typeof insertFeeSchema>;
export type AcademicPeriod = typeof academicPeriods.$inferSelect;
export type InsertAcademicPeriod = z.infer<typeof insertAcademicPeriodSchema>;
export type CourseHistory = typeof courseHistory.$inferSelect;
export type InsertCourseHistory = z.infer<typeof insertCourseHistorySchema>;

// Financial Engine Types
export type StudentAccount = typeof studentAccounts.$inferSelect;
export type InsertStudentAccount = z.infer<typeof insertStudentAccountSchema>;
export type FeeStructure = typeof feeStructures.$inferSelect;
export type InsertFeeStructure = z.infer<typeof insertFeeStructureSchema>;
export type EnrollmentHistory = typeof enrollmentHistory.$inferSelect;
export type InsertEnrollmentHistory = z.infer<typeof insertEnrollmentHistorySchema>;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;
export type InsertFinancialTransaction = z.infer<typeof insertFinancialTransactionSchema>;

// ========================================
// ADVANCED FINANCE MODULE TABLES
// ========================================

// Income - Tracks all money coming in
export const finIncome = pgTable("fin_income", {
  id: serial("id").primaryKey(),
  sourceType: finSourceTypeEnum("source_type").notNull(),
  amount: integer("amount").notNull(), // in cents
  date: date("date").notNull(),
  payerId: uuid("payer_id").references(() => users.id), // Link to PS_PERSON/User
  description: text("description").notNull(),
  status: feeStatusEnum("status").default("pending"),
  paymentMethod: paymentMethodEnum("payment_method"),
  pdfAttachmentId: text("pdf_attachment_id"), // S3 key or path
  photoAttachmentId: text("photo_attachment_id"),
  academicPeriodId: integer("academic_period_id").references(() => academicPeriods.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Top-level Enum defs
export const finExpenseStatusEnum = pgEnum("expense_status", ["pending", "approved", "rejected", "paid"]);
export const finComplianceStatusEnum = pgEnum("compliance_status", ["compliant", "pending", "violation", "under_review"]);

// Expenses - Tracks all money going out
export const finExpenses = pgTable("fin_expenses", {
  id: serial("id").primaryKey(),
  category: finExpenseCategoryEnum("category").notNull(),
  amount: integer("amount").notNull(), // in cents
  date: date("date").notNull(),
  payeeId: uuid("payee_id").references(() => users.id),
  payeeName: text("payee_name"), // for external vendors
  description: text("description").notNull(),
  status: finExpenseStatusEnum("status").default("pending"),
  approvedBy: uuid("approved_by").references(() => users.id),
  pdfAttachmentId: text("pdf_attachment_id"),
  photoAttachmentId: text("photo_attachment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Assets - Registry of physical and intangible assets
export const finAssets = pgTable("fin_assets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: finAssetTypeEnum("type").notNull(),
  description: text("description"),
  purchaseDate: date("purchase_date").notNull(),
  initialCost: integer("initial_cost").notNull(), // in cents
  currentValue: integer("current_value").notNull(), // in cents
  salvageValue: integer("salvage_value").default(0),
  usefulLifeYears: integer("useful_life_years").default(5),
  location: text("location"),
  serialNumber: text("serial_number"),
  pdfAttachmentId: text("pdf_attachment_id"), // warranty/invoice
  photoAttachmentId: text("photo_attachment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Budgets - Planned vs Actuals
export const finBudgets = pgTable("fin_budgets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  academicPeriodId: integer("academic_period_id").references(() => academicPeriods.id),
  category: finBudgetCategoryEnum("category").notNull(),
  subCategory: text("sub_category"), // e.g. "Science Dept Equipment"
  budgetedAmount: integer("budgeted_amount").notNull(), // in cents
  actualAmount: integer("actual_amount").default(0),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Audit Logs - Immutable ledger
export const finAuditLogs = pgTable("fin_audit_logs", {
  id: serial("id").primaryKey(),
  action: finAuditActionEnum("action").notNull(),
  entityType: text("entity_type").notNull(), // e.g., "expense", "fee"
  entityId: integer("entity_id").notNull(),
  userId: uuid("user_id").references(() => users.id),
  oldValue: jsonb("old_value"),
  newValue: jsonb("new_value"),
  ipAddress: text("ip_address"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Compliance - Regulatory tracking
export const finCompliance = pgTable("fin_compliance", {
  id: serial("id").primaryKey(),
  type: finComplianceTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date"),
  status: finComplianceStatusEnum("status").default("pending"),
  relatedEntityId: integer("related_entity_id"), // e.g. Student ID for Title IV
  comments: text("comments"),
  docAttachmentId: text("doc_attachment_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schemas & Types
export const insertFinIncomeSchema = createInsertSchema(finIncome).omit({ id: true, createdAt: true });
export const insertFinExpenseSchema = createInsertSchema(finExpenses).omit({ id: true, createdAt: true });
export const insertFinAssetSchema = createInsertSchema(finAssets).omit({ id: true, createdAt: true });
export const insertFinBudgetSchema = createInsertSchema(finBudgets).omit({ id: true, createdAt: true });
export const insertFinComplianceSchema = createInsertSchema(finCompliance).omit({ id: true, createdAt: true });

export type FinIncome = typeof finIncome.$inferSelect;
export type InsertFinIncome = z.infer<typeof insertFinIncomeSchema>;
export type FinExpense = typeof finExpenses.$inferSelect;
export type InsertFinExpense = z.infer<typeof insertFinExpenseSchema>;
export type FinAsset = typeof finAssets.$inferSelect;
export type InsertFinAsset = z.infer<typeof insertFinAssetSchema>;
export type FinBudget = typeof finBudgets.$inferSelect;
export type InsertFinBudget = z.infer<typeof insertFinBudgetSchema>;
export type FinCompliance = typeof finCompliance.$inferSelect;
export type InsertFinCompliance = z.infer<typeof insertFinComplianceSchema>;

export const insertFinAuditLogSchema = createInsertSchema(finAuditLogs).omit({ id: true, timestamp: true });
export type FinAuditLog = typeof finAuditLogs.$inferSelect;
export type InsertFinAuditLog = z.infer<typeof insertFinAuditLogSchema>;
export type FinancialAidAward = typeof financialAidAwards.$inferSelect;
export type InsertFinancialAidAward = z.infer<typeof insertFinancialAidAwardSchema>;
// Convenient aliases
export type InsertFinAidAward = InsertFinancialAidAward;
export type FinAidAward = FinancialAidAward;

// ========================================
// LMS MODULE TABLES
// ========================================

// 1. Structure Hierarchy

export const courseCategories = pgTable("course_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  parentId: integer("parent_id"), // Self-referencing for sub-categories
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").references(() => courseCategories.id),
  fullName: text("full_name").notNull(),
  shortName: text("short_name").notNull(),
  code: text("code").unique(), // e.g., CS101
  summary: text("summary"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  image: text("image"), // Cover image URL
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const courseSections = pgTable("course_sections", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  name: text("name").notNull(), // e.g., "Week 1" or "Topic 1"
  summary: text("summary"),
  order: integer("order").notNull().default(0),
  isVisible: boolean("is_visible").default(true),
});

// Modules - The polymorphic content units
export const courseModules = pgTable("course_modules", {
  id: serial("id").primaryKey(),
  sectionId: integer("section_id").notNull().references(() => courseSections.id),
  type: lmsModuleTypeEnum("type").notNull(),
  title: text("title").notNull(),
  instanceId: integer("instance_id").notNull(), // ID of the specific activity (assignment, quiz, etc.)
  order: integer("order").notNull().default(0),
  isVisible: boolean("is_visible").default(true),
});

// 2. Activities

export const lmsAssignments = pgTable("lms_assignments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  name: text("name").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  allowSubmissionsFrom: timestamp("allow_submissions_from"),
  maxGrade: integer("max_grade").default(100),
});

export const lmsQuizzes = pgTable("lms_quizzes", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  name: text("name").notNull(),
  description: text("description"),
  timeLimitMinutes: integer("time_limit_minutes"),
  totalMarks: integer("total_marks").default(100),
});

export const lmsForums = pgTable("lms_forums", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  name: text("name").notNull(),
  type: lmsForumTypeEnum("type").default("general"),
  description: text("description"),
});

// 3. Submissions & Enrollment

// 4. Enrollment & Submissions (LMS)

export const courseEnrollments = pgTable("course_enrollments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").notNull().references(() => courses.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  role: roleEnum("role").notNull().default("student"), // Can be teacher within a course
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

export const lmsSubmissions = pgTable("lms_submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => lmsAssignments.id),
  studentId: uuid("student_id").notNull().references(() => users.id), // Using User ID for broader access
  content: text("content"), // Online text
  fileUrl: text("file_url"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  status: submissionStatusEnum("status").default("submitted"),
  grade: integer("grade"),
  feedback: text("feedback"),
  gradedBy: uuid("graded_by").references(() => users.id),
});

// LMS Schemas
export const insertCourseCategorySchema = createInsertSchema(courseCategories).omit({ id: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true });
export const insertCourseSectionSchema = createInsertSchema(courseSections).omit({ id: true });
export const insertCourseModuleSchema = createInsertSchema(courseModules).omit({ id: true });
export const insertLmsAssignmentSchema = createInsertSchema(lmsAssignments).omit({ id: true });
export const insertLmsQuizSchema = createInsertSchema(lmsQuizzes).omit({ id: true });
export const insertLmsForumSchema = createInsertSchema(lmsForums).omit({ id: true });

// LMS Type Exports
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type CourseCategory = typeof courseCategories.$inferSelect;
export type InsertCourseCategory = z.infer<typeof insertCourseCategorySchema>;
export type CourseSection = typeof courseSections.$inferSelect;
export type InsertCourseSection = z.infer<typeof insertCourseSectionSchema>;
export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = z.infer<typeof insertCourseModuleSchema>;
export type LmsAssignment = typeof lmsAssignments.$inferSelect;
export type InsertLmsAssignment = z.infer<typeof insertLmsAssignmentSchema>;
export type LmsQuiz = typeof lmsQuizzes.$inferSelect;
export type InsertLmsQuiz = z.infer<typeof insertLmsQuizSchema>;
export type LmsForum = typeof lmsForums.$inferSelect;
export type InsertLmsForum = z.infer<typeof insertLmsForumSchema>;
export type InsertLmsSubmission = z.infer<typeof insertLmsSubmissionSchema>;
export type InsertCourseEnrollment = z.infer<typeof insertCourseEnrollmentSchema>;

// ========================================
// LIBRARY MODULE
// ========================================

export const libraryBooks = pgTable("library_books", {
  id: uuid("id").primaryKey().defaultRandom(),
  isbn: text("isbn").unique(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  subject: text("subject"),
  coverUrl: text("cover_url"),
  publishedDate: text("published_date"),
  pageCount: integer("page_count"),
  description: text("description"),
  quantity: integer("quantity").default(1),
  availableQuantity: integer("available_quantity").default(1),
  location: text("location"), // e.g., "Shelf A3"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertLibraryBookSchema = createInsertSchema(libraryBooks).omit({ id: true, createdAt: true, updatedAt: true });
export type LibraryBook = typeof libraryBooks.$inferSelect;
export type InsertLibraryBook = z.infer<typeof insertLibraryBookSchema>;

// ========================================
// HR HIRING MODULE TABLES
// ========================================

export const jobPostStatusEnum = pgEnum("job_post_status", ["open", "closed", "draft"]);
export const jobAppStatusEnum = pgEnum("job_app_status", ["applied", "review", "interview_scheduled", "interviewed", "offer", "hired", "rejected"]);

export const jobPostings = pgTable("job_postings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  department: text("department").notNull(), // e.g., "Science", "Admin", "Finance"
  description: text("description").notNull(),
  requirements: text("requirements"),
  status: jobPostStatusEnum("status").default("open"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobApplications = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobPostings.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  resumeUrl: text("resume_url"), // Attachment
  demoScore: integer("demo_score"), // For teachers
  interviewNotes: text("interview_notes"),
  status: jobAppStatusEnum("status").default("applied"),
  appliedAt: timestamp("applied_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Staff Table (For HR, Finance, Admin - non-teaching)
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  department: text("department"),
  designation: text("designation"),
  joinDate: date("join_date").defaultNow(),
});

// ========================================
// ENRICHED ADMISSIONS (Modifying Student)
// ========================================
// Note: We are using the existing 'students' table but conceptually treating 'pending' students as admission applicants.
// The new fields below are managed via UDF in 'students' or we can add specific columns if usage is high.
// We added nationalId, citizenship etc. previously.
// Let's ensure we export schemas for the new tables.

export const insertJobPostingSchema = createInsertSchema(jobPostings).omit({ id: true, createdAt: true });
export const insertJobApplicationSchema = createInsertSchema(jobApplications).omit({ id: true, appliedAt: true });
export const insertStaffSchema = createInsertSchema(staff).omit({ id: true });
export const insertCourseEnrollmentSchema = createInsertSchema(courseEnrollments).omit({ id: true, enrolledAt: true });
export const insertLmsSubmissionSchema = createInsertSchema(lmsSubmissions).omit({ id: true, submittedAt: true });

// Export Types
export type JobPosting = typeof jobPostings.$inferSelect;
export type InsertJobPosting = z.infer<typeof insertJobPostingSchema>;
export type JobApplication = typeof jobApplications.$inferSelect;
export type InsertJobApplication = z.infer<typeof insertJobApplicationSchema>;
export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;
export type CourseEnrollment = typeof courseEnrollments.$inferSelect;
export type LmsSubmission = typeof lmsSubmissions.$inferSelect;

// ========================================
// GENERAL LEDGER (GL) MODULE TABLES
// ========================================

// GL Enums
export const glAccountTypeEnum = pgEnum("gl_account_type", [
  "asset",
  "liability",
  "equity",
  "revenue",
  "expense"
]);

export const glAccountSubTypeEnum = pgEnum("gl_account_sub_type", [
  // Assets
  "current_asset",
  "fixed_asset",
  "other_asset",
  // Liabilities
  "current_liability",
  "long_term_liability",
  // Equity
  "retained_earnings",
  "net_income",
  // Revenue
  "tuition_revenue",
  "other_revenue",
  // Expenses
  "operating_expense",
  "non_operating_expense"
]);

export const glTransactionTypeEnum = pgEnum("gl_transaction_type", [
  "debit",
  "credit"
]);

export const glJournalStatusEnum = pgEnum("gl_journal_status", [
  "draft",
  "posted",
  "voided",
  "reversed"
]);

export const glFundTypeEnum = pgEnum("gl_fund_type", [
  "unrestricted",
  "restricted",
  "endowment",
  "capital_project"
]);

// ========================================
// PROGRAMS & DEPARTMENTS MODULE
// ========================================

export const programLevelEnum = pgEnum("program_level", ["diploma", "undergraduate", "graduate", "doctorate"]);

// Departments - Organizational units
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  headOfDepartmentId: integer("head_of_department_id"),
  budgetAllocation: integer("budget_allocation").default(0),
  annualBudget: integer("annual_budget").default(0),
  spentAmount: integer("spent_amount").default(0),
  contactEmail: text("contact_email"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Academic Programs
export const programs = pgTable("programs", {
  id: serial("id").primaryKey(),
  departmentId: integer("department_id").references(() => departments.id),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  level: programLevelEnum("level").notNull(),
  durationYears: integer("duration_years").notNull(),
  totalCredits: integer("total_credits"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ========================================
// DONORS MODULE
// ========================================

export const donorTypeEnum = pgEnum("donor_type", ["individual", "corporation", "foundation", "government", "alumni"]);

// Donors
export const donors = pgTable("donors", {
  id: serial("id").primaryKey(),
  code: text("code").unique().notNull(),
  name: text("name").notNull(),
  donorType: donorTypeEnum("donor_type").default("individual"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  totalDonations: integer("total_donations").default(0),
  lastDonationDate: date("last_donation_date"),
  notes: text("notes"),
  taxId: text("tax_id"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Donations
export const donations = pgTable("donations", {
  id: serial("id").primaryKey(),
  donorId: integer("donor_id").notNull().references(() => donors.id),
  amount: integer("amount").notNull(),
  donationDate: date("donation_date").notNull(),
  purpose: text("purpose"),
  fundId: integer("fund_id"),
  paymentMethod: paymentMethodEnum("payment_method"),
  referenceNumber: text("reference_number"),
  isRecurring: boolean("is_recurring").default(false),
  taxReceiptIssued: boolean("tax_receipt_issued").default(false),
  taxReceiptNumber: text("tax_receipt_number"),
  notes: text("notes"),
  glJournalEntryId: integer("gl_journal_entry_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ========================================
// GENERAL LEDGER (GL) MODULE
// ========================================

// Chart of Accounts - Hierarchical account structure
export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: serial("id").primaryKey(),
  accountCode: text("account_code").unique().notNull(), // e.g., "1000", "2100"
  accountName: text("account_name").notNull(), // e.g., "Cash", "Accounts Receivable"
  accountType: glAccountTypeEnum("account_type").notNull(),
  accountSubType: glAccountSubTypeEnum("account_sub_type"),
  parentAccountId: integer("parent_account_id"), // For hierarchical structure
  isActive: boolean("is_active").default(true),
  normalBalance: glTransactionTypeEnum("normal_balance").notNull(), // debit or credit
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Funds - Multi-fund accounting
export const glFunds = pgTable("gl_funds", {
  id: serial("id").primaryKey(),
  fundCode: text("fund_code").unique().notNull(), // e.g., "GEN001", "END002"
  fundName: text("fund_name").notNull(), // e.g., "General Operating Fund"
  fundType: glFundTypeEnum("fund_type").notNull(),
  balance: integer("balance").default(0).notNull(), // in cents
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  description: text("description"),
  restrictions: text("restrictions"), // Donor or legal restrictions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Fiscal Periods - For financial reporting
export const fiscalPeriods = pgTable("fiscal_periods", {
  id: serial("id").primaryKey(),
  periodName: text("period_name").notNull(), // e.g., "FY2026-Q1", "January 2026"
  fiscalYear: integer("fiscal_year").notNull(), // e.g., 2026
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isClosed: boolean("is_closed").default(false), // True when period is closed for posting
  closedAt: timestamp("closed_at"),
  closedBy: uuid("closed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Journal Entry Headers - Batch posting
export const glJournalEntries = pgTable("gl_journal_entries", {
  id: serial("id").primaryKey(),
  journalNumber: text("journal_number").unique().notNull(), // Auto-generated: JE-20260129-001
  entryDate: date("entry_date").notNull(),
  fiscalPeriodId: integer("fiscal_period_id").notNull().references(() => fiscalPeriods.id),
  description: text("description").notNull(),
  status: glJournalStatusEnum("status").default("draft").notNull(),
  totalDebit: integer("total_debit").default(0).notNull(), // in cents
  totalCredit: integer("total_credit").default(0).notNull(), // in cents
  postedAt: timestamp("posted_at"),
  postedBy: uuid("posted_by").references(() => users.id),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  reversedBy: integer("reversed_by"), // Reference to reversing journal entry
  referenceType: text("reference_type"), // e.g., "AR_Payment", "AP_Invoice", "Manual"
  referenceId: integer("reference_id"), // ID from source transaction
});

// GL Transactions - Individual debit/credit lines
export const glTransactions = pgTable("gl_transactions", {
  id: serial("id").primaryKey(),
  journalEntryId: integer("journal_entry_id").notNull().references(() => glJournalEntries.id),
  accountId: integer("account_id").notNull().references(() => chartOfAccounts.id),
  fundId: integer("fund_id").references(() => glFunds.id),
  transactionType: glTransactionTypeEnum("transaction_type").notNull(),
  amount: integer("amount").notNull(), // in cents, always positive
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Account Reconciliations - Track bank/account reconciliation periods
export const glReconciliationStatusEnum = pgEnum("gl_reconciliation_status", [
  "in_progress",
  "completed",
  "reviewed"
]);

export const glReconciliations = pgTable("gl_reconciliations", {
  id: serial("id").primaryKey(),
  reconciliationNumber: text("reconciliation_number").unique().notNull(), // e.g., "RECON-1000-202601"
  accountId: integer("account_id").notNull().references(() => chartOfAccounts.id),
  reconciliationDate: date("reconciliation_date").notNull(), // Statement date
  startingBalance: integer("starting_balance").notNull(), // in cents
  endingBalance: integer("ending_balance").notNull(), // in cents, from bank statement
  statementBalance: integer("statement_balance").notNull(), // in cents, should match ending balance
  adjustments: integer("adjustments").default(0).notNull(), // Total adjustments in cents
  status: glReconciliationStatusEnum("status").default("in_progress").notNull(),
  reconciledBy: uuid("reconciled_by").notNull().references(() => users.id),
  reconciledAt: timestamp("reconciled_at"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Reconciliation Items - Track which transactions are cleared
export const glReconciliationItems = pgTable("gl_reconciliation_items", {
  id: serial("id").primaryKey(),
  reconciliationId: integer("reconciliation_id").notNull().references(() => glReconciliations.id),
  transactionId: integer("transaction_id").notNull().references(() => glTransactions.id),
  isCleared: boolean("is_cleared").default(false).notNull(),
  clearedDate: date("cleared_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ========================================
// ACCOUNTS RECEIVABLE (AR) MODULE TABLES
// ========================================

export const arBillStatusEnum = pgEnum("ar_bill_status", [
  "draft",
  "open",
  "partial",
  "paid",
  "overdue",
  "written_off",
  "cancelled"
]);

export const arPaymentStatusEnum = pgEnum("ar_payment_status", [
  "pending",
  "cleared",
  "bounced",
  "refunded"
]);

// Student Bills - Formal invoicing
export const arStudentBills = pgTable("ar_student_bills", {
  id: serial("id").primaryKey(),
  billNumber: text("bill_number").unique().notNull(), // AUTO: BILL-2026-001234
  studentId: uuid("student_id").notNull().references(() => students.id),
  fiscalPeriodId: integer("fiscal_period_id").references(() => fiscalPeriods.id),
  academicPeriodId: integer("academic_period_id").references(() => academicPeriods.id),
  billDate: date("bill_date").notNull(),
  dueDate: date("due_date").notNull(),
  totalAmount: integer("total_amount").notNull().default(0), // in cents
  paidAmount: integer("paid_amount").notNull().default(0),
  balanceDue: integer("balance_due").notNull().default(0),
  status: arBillStatusEnum("status").default("draft").notNull(),
  notes: text("notes"),
  glJournalEntryId: integer("gl_journal_entry_id").references(() => glJournalEntries.id), // Link to GL posting
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  postedAt: timestamp("posted_at"),
});

// Bill Line Items - Individual charges
export const arBillLineItems = pgTable("ar_bill_line_items", {
  id: serial("id").primaryKey(),
  billId: integer("bill_id").notNull().references(() => arStudentBills.id),
  description: text("description").notNull(), // e.g., "Tuition - Fall 2026"
  feeType: feeTypeEnum("fee_type").notNull(),
  quantity: integer("quantity").default(1),
  unitPrice: integer("unit_price").notNull(), // in cents
  amount: integer("amount").notNull(), // quantity * unitPrice
  glAccountId: integer("gl_account_id").references(() => chartOfAccounts.id), // Revenue account
});

// AR Payments
export const arPayments = pgTable("ar_payments", {
  id: serial("id").primaryKey(),
  paymentNumber: text("payment_number").unique().notNull(), // AUTO: PAY-2026-001234
  studentId: uuid("student_id").notNull().references(() => students.id),
  paymentDate: date("payment_date").notNull(),
  amount: integer("amount").notNull(), // in cents
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  status: arPaymentStatusEnum("status").default("cleared").notNull(),
  referenceNumber: text("reference_number"), // Check number, transaction ID
  notes: text("notes"),
  glJournalEntryId: integer("gl_journal_entry_id").references(() => glJournalEntries.id),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment Allocations - Which bills did this payment apply to?
export const arPaymentAllocations = pgTable("ar_payment_allocations", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").notNull().references(() => arPayments.id),
  billId: integer("bill_id").notNull().references(() => arStudentBills.id),
  amount: integer("amount").notNull(), // in cents
  createdAt: timestamp("created_at").defaultNow(),
});

// AR Refunds
// Student Refunds - Enhanced with workflow
export const arRefunds = pgTable("ar_refunds", {
  id: serial("id").primaryKey(),
  refundNumber: text("refund_number").unique().notNull(),
  studentId: uuid("student_id").notNull().references(() => students.id),
  requestDate: date("request_date").notNull(),
  refundDate: date("refund_date"),
  amount: integer("amount").notNull(), // in cents
  reason: text("reason").notNull(),
  refundMethod: paymentMethodEnum("refund_method").notNull(),
  status: refundStatusEnum("status").default("pending").notNull(),
  checkNumber: text("check_number"),
  notes: text("notes"),
  glJournalEntryId: integer("gl_journal_entry_id").references(() => glJournalEntries.id),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Dunning History - Payment reminders
export const arDunningHistory = pgTable("ar_dunning_history", {
  id: serial("id").primaryKey(),
  studentId: uuid("student_id").notNull().references(() => students.id),
  billId: integer("bill_id").references(() => arStudentBills.id),
  sentDate: date("sent_date").notNull(),
  daysOverdue: integer("days_overdue").notNull(),
  amountDue: integer("amount_due").notNull(),
  dunningLevel: integer("dunning_level").default(1), // 1st reminder, 2nd, etc.
  messageTemplate: text("message_template"),
  sentBy: uuid("sent_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ========================================
// ACCOUNTS PAYABLE (AP) MODULE TABLES
// ========================================

export const apInvoiceStatusEnum = pgEnum("ap_invoice_status", [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "scheduled",
  "paid",
  "cancelled"
]);

// AR Charge Items
export const arChargeItems = pgTable("ar_charge_items", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(), // standard amount
  glAccountId: integer("gl_account_id"), // Default GL account
  isActive: boolean("is_active").default(true),
});

export const insertArChargeItemSchema = createInsertSchema(arChargeItems).omit({ id: true });
export type ArChargeItem = typeof arChargeItems.$inferSelect;
export type InsertArChargeItem = typeof arChargeItems.$inferInsert;


// AR Auto-Billing Rules
export const arAutoBillRules = pgTable("ar_auto_bill_rules", {
  id: serial("id").primaryKey(),
  academicPeriodId: integer("academic_period_id").references(() => academicPeriods.id),
  // programId link removed for now as table existence uncertain
  courseId: integer("course_id").references(() => courses.id),
  chargeItemId: integer("charge_item_id").notNull().references(() => arChargeItems.id),
  amount: integer("amount").notNull(),
  isResidencyBased: boolean("is_residency_based").default(false),
  residencyType: text("residency_type"), // 'in_state', 'out_of_state', 'international'
  description: text("description"),
  isActive: boolean("is_active").default(true),
});

export const insertArAutoBillRuleSchema = createInsertSchema(arAutoBillRules).omit({ id: true });
export type ArAutoBillRule = typeof arAutoBillRules.$inferSelect;
export type InsertArAutoBillRule = typeof arAutoBillRules.$inferInsert;

export const apPaymentStatusEnum = pgEnum("ap_payment_status", [
  "scheduled",
  "processed",
  "cleared",
  "cancelled",
  "failed"
]);

export const apPaymentMethodEnum = pgEnum("ap_payment_method", [
  "check",
  "wire_transfer",
  "ach",
  "eft",
  "credit_card"
]);

export const apApprovalStatusEnum = pgEnum("ap_approval_status", [
  "pending",
  "approved",
  "rejected"
]);

// Vendors - Supplier database
export const apVendors = pgTable("ap_vendors", {
  id: serial("id").primaryKey(),
  vendorCode: text("vendor_code").unique().notNull(), // VEN-001
  vendorName: text("vendor_name").notNull(),
  contactName: text("contact_name"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  taxId: text("tax_id"), // For 1099 reporting
  paymentTerms: text("payment_terms"), // e.g., "Net 30"
  bankAccountInfo: text("bank_account_info"), // Encrypted
  isActive: boolean("is_active").default(true),
  is1099Vendor: boolean("is_1099_vendor").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// AP Invoices
export const apInvoices = pgTable("ap_invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").unique().notNull(), // AUTO or vendor number
  vendorId: integer("vendor_id").notNull().references(() => apVendors.id),
  purchaseOrderId: integer("purchase_order_id"), // Link to PO if exists
  invoiceDate: date("invoice_date").notNull(),
  dueDate: date("due_date").notNull(),
  totalAmount: integer("total_amount").notNull(), // in cents
  paidAmount: integer("paid_amount").default(0),
  status: apInvoiceStatusEnum("status").default("draft").notNull(),
  description: text("description"),
  attachmentUrl: text("attachment_url"), // Scanned invoice
  glJournalEntryId: integer("gl_journal_entry_id").references(() => glJournalEntries.id),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// AP Invoice Line Items
export const apInvoiceLineItems = pgTable("ap_invoice_line_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => apInvoices.id),
  description: text("description").notNull(),
  category: finExpenseCategoryEnum("category").notNull(),
  quantity: integer("quantity").default(1),
  unitPrice: integer("unit_price").notNull(),
  amount: integer("amount").notNull(),
  glAccountId: integer("gl_account_id").references(() => chartOfAccounts.id), // Expense account
});

// AP Approval Workflow
export const apApprovals = pgTable("ap_approvals", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => apInvoices.id),
  approvalLevel: integer("approval_level").notNull(), // 1, 2, 3 for multi-level
  approverId: uuid("approver_id").notNull().references(() => users.id),
  status: apApprovalStatusEnum("status").default("pending"),
  comments: text("comments"),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// AP Payments
export const apPayments = pgTable("ap_payments", {
  id: serial("id").primaryKey(),
  paymentNumber: text("payment_number").unique().notNull(), // CHECK-001, WIRE-001
  vendorId: integer("vendor_id").notNull().references(() => apVendors.id),
  invoiceId: integer("invoice_id").references(() => apInvoices.id),
  paymentDate: date("payment_date").notNull(),
  amount: integer("amount").notNull(),
  paymentMethod: apPaymentMethodEnum("payment_method").notNull(),
  status: apPaymentStatusEnum("status").default("scheduled").notNull(),
  referenceNumber: text("reference_number"), // Check number, wire confirmation
  glJournalEntryId: integer("gl_journal_entry_id").references(() => glJournalEntries.id),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Expense Reports - For employee reimbursements
export const apExpenseReports = pgTable("ap_expense_reports", {
  id: serial("id").primaryKey(),
  reportNumber: text("report_number").unique().notNull(),
  employeeId: uuid("employee_id").notNull().references(() => users.id),
  reportDate: date("report_date").notNull(),
  totalAmount: integer("total_amount").notNull(),
  status: apInvoiceStatusEnum("status").default("draft").notNull(),
  purpose: text("purpose"),
  approvedBy: uuid("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Expense Report Line Items
export const apExpenseReportItems = pgTable("ap_expense_report_items", {
  id: serial("id").primaryKey(),
  expenseReportId: integer("expense_report_id").notNull().references(() => apExpenseReports.id),
  expenseDate: date("expense_date").notNull(),
  category: finExpenseCategoryEnum("category").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  receiptUrl: text("receipt_url"),
  glAccountId: integer("gl_account_id").references(() => chartOfAccounts.id),
});

// 1099 Tax Records
export const ap1099Records = pgTable("ap_1099_records", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").notNull().references(() => apVendors.id),
  taxYear: integer("tax_year").notNull(),
  totalAmount: integer("total_amount").notNull(), // Total payments for year
  formType: text("form_type").default("1099-MISC"), // or 1099-NEC
  generatedAt: timestamp("generated_at"),
  generatedBy: uuid("generated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Purchase Orders
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  poNumber: text("po_number").unique().notNull(),
  vendorId: integer("vendor_id").notNull().references(() => apVendors.id),
  departmentId: integer("department_id").references(() => departments.id),
  orderDate: date("order_date").notNull(),
  poDate: date("po_date"),
  expectedDate: date("expected_date"),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").default("open"), // open, partially_received, received, closed
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// PO Line Items
export const poLineItems = pgTable("po_line_items", {
  id: serial("id").primaryKey(),
  poId: integer("po_id").notNull().references(() => purchaseOrders.id),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(), // in cents
  receivedQuantity: integer("received_quantity").default(0),
  invoicedQuantity: integer("invoiced_quantity").default(0),
  glAccountId: integer("gl_account_id").references(() => chartOfAccounts.id),
});

// Zod Schemas for PO
export const insertPurchaseOrderSchema = createInsertSchema(purchaseOrders);
export const insertPoLineItemSchema = createInsertSchema(poLineItems);

export type PurchaseOrder = typeof purchaseOrders.$inferSelect;
export type InsertPurchaseOrder = typeof purchaseOrders.$inferInsert;
export type PoLineItem = typeof poLineItems.$inferSelect;
export type InsertPoLineItem = typeof poLineItems.$inferInsert;

// Compatibility exports for storage.ts
export { poLineItems as purchaseOrderItems };
export type PurchaseOrderItem = PoLineItem;
export type InsertPurchaseOrderItem = InsertPoLineItem;

// ========================================
// PAYROLL MODULE TABLES
// ========================================

export const payrollStatusEnum = pgEnum("payroll_status", [
  "draft",
  "calculated",
  "approved",
  "processed",
  "paid"
]);

export const employmentTypeEnum = pgEnum("employment_type", [
  "full_time",
  "part_time",
  "hourly",
  "contract"
]);

// Payroll Runs - Batch processing
export const payrollRuns = pgTable("payroll_runs", {
  id: serial("id").primaryKey(),
  runNumber: text("run_number").unique().notNull(), // PR-2026-01-15
  payPeriodStart: date("pay_period_start").notNull(),
  payPeriodEnd: date("pay_period_end").notNull(),
  payDate: date("pay_date").notNull(),
  totalGross: integer("total_gross").default(0), // in cents
  totalDeductions: integer("total_deductions").default(0),
  totalNet: integer("total_net").default(0),
  status: payrollStatusEnum("status").default("draft").notNull(),
  glJournalEntryId: integer("gl_journal_entry_id").references(() => glJournalEntries.id),
  processedBy: uuid("processed_by").references(() => users.id),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payroll Details - Per employee
export const payrollDetails = pgTable("payroll_details", {
  id: serial("id").primaryKey(),
  payrollRunId: integer("payroll_run_id").notNull().references(() => payrollRuns.id),
  employeeId: uuid("employee_id").notNull().references(() => users.id),
  employmentType: employmentTypeEnum("employment_type").notNull(),
  grossPay: integer("gross_pay").notNull(), // in cents
  federalTax: integer("federal_tax").default(0),
  stateTax: integer("state_tax").default(0),
  socialSecurity: integer("social_security").default(0),
  medicare: integer("medicare").default(0),
  retirement: integer("retirement").default(0),
  healthInsurance: integer("health_insurance").default(0),
  otherDeductions: integer("other_deductions").default(0),
  netPay: integer("net_pay").notNull(),
  hoursWorked: integer("hours_worked"), // For hourly employees
  overtimeHours: integer("overtime_hours"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Timesheets - For hourly tracking
export const timesheets = pgTable("timesheets", {
  id: serial("id").primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => users.id),
  workDate: date("work_date").notNull(),
  hoursWorked: integer("hours_worked").notNull(), // e.g., 8.5 stored as 850 (2 decimal precision)
  overtimeHours: integer("overtime_hours").default(0),
  description: text("description"),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// W-2 Records
export const w2Records = pgTable("w2_records", {
  id: serial("id").primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => users.id),
  taxYear: integer("tax_year").notNull(),
  totalWages: integer("total_wages").notNull(),
  federalTaxWithheld: integer("federal_tax_withheld").notNull(),
  socialSecurityWages: integer("social_security_wages").notNull(),
  socialSecurityTax: integer("social_security_tax").notNull(),
  medicareWages: integer("medicare_wages").notNull(),
  medicareTax: integer("medicare_tax").notNull(),
  pdfUrl: text("pdf_url"),
  generatedAt: timestamp("generated_at"),
  generatedBy: uuid("generated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ========================================
// ASSET DEPRECIATION TABLES
// ========================================

export const depreciationMethodEnum = pgEnum("depreciation_method", [
  "straight_line",
  "declining_balance",
  "double_declining",
  "sum_of_years"
]);

// Depreciation Schedules
export const depreciationSchedules = pgTable("depreciation_schedules", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => finAssets.id),
  method: depreciationMethodEnum("method").notNull(),
  depreciationPeriods: integer("depreciation_periods").notNull(), // Total periods
  periodsElapsed: integer("periods_elapsed").default(0),
  currentBookValue: integer("current_book_value").notNull(),
  accumulatedDepreciation: integer("accumulated_depreciation").default(0),
  lastDepreciationDate: date("last_depreciation_date"),
  nextDepreciationDate: date("next_depreciation_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Depreciation Entries - Monthly postings
export const depreciationEntries = pgTable("depreciation_entries", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").notNull().references(() => depreciationSchedules.id),
  entryDate: date("entry_date").notNull(),
  amount: integer("amount").notNull(), // Depreciation amount
  glJournalEntryId: integer("gl_journal_entry_id").references(() => glJournalEntries.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Asset Disposals
export const assetDisposals = pgTable("asset_disposals", {
  id: serial("id").primaryKey(),
  assetId: integer("asset_id").notNull().references(() => finAssets.id),
  disposalDate: date("disposal_date").notNull(),
  disposalMethod: text("disposal_method"), // "Sale", "Donation", "Write-off"
  proceedsAmount: integer("proceeds_amount").default(0),
  bookValue: integer("book_value").notNull(),
  gainLoss: integer("gain_loss").notNull(), // proceeds - book value
  glJournalEntryId: integer("gl_journal_entry_id").references(() => glJournalEntries.id),
  notes: text("notes"),
  disposedBy: uuid("disposed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// ========================================
// ENDOWMENT & INVESTMENT TABLES
// ========================================

export const investmentTypeEnum = pgEnum("investment_type", [
  "stock",
  "bond",
  "mutual_fund",
  "real_estate",
  "other"
]);

export const transactionTypeInvestmentEnum = pgEnum("investment_transaction_type", [
  "buy",
  "sell",
  "dividend",
  "interest",
  "split",
  "transfer"
]);

// Endowment Funds
export const endowmentFunds = pgTable("endowment_funds", {
  id: serial("id").primaryKey(),
  fundCode: text("fund_code").unique().notNull(),
  fundName: text("fund_name").notNull(),
  donorName: text("donor_name"),
  principal: integer("principal").notNull(), // Original donation amount
  currentValue: integer("current_value").notNull(),
  spendingRate: integer("spending_rate").default(500), // 5.00% stored as 500 (basis points)
  spendableAmount: integer("spendable_amount").default(0), // Annual distribution allowed
  restrictions: text("restrictions"),
  glFundId: integer("gl_fund_id").references(() => glFunds.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Investments
export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  endowmentFundId: integer("endowment_fund_id").references(() => endowmentFunds.id),
  symbol: text("symbol"), // Stock ticker, etc.
  description: text("description").notNull(),
  investmentType: investmentTypeEnum("investment_type").notNull(),
  quantity: integer("quantity").notNull(), // Number of shares/units
  costBasis: integer("cost_basis").notNull(), // Purchase price per unit in cents
  currentPrice: integer("current_price").notNull(),
  currentValue: integer("current_value").notNull(), // quantity * currentPrice
  purchaseDate: date("purchase_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Investment Transactions
export const investmentTransactions = pgTable("investment_transactions", {
  id: serial("id").primaryKey(),
  investmentId: integer("investment_id").references(() => investments.id),
  endowmentFundId: integer("endowment_fund_id").notNull().references(() => endowmentFunds.id),
  transactionType: transactionTypeInvestmentEnum("transaction_type").notNull(),
  transactionDate: date("transaction_date").notNull(),
  quantity: integer("quantity"), // For buy/sell
  pricePerUnit: integer("price_per_unit"), // in cents
  totalAmount: integer("total_amount").notNull(),
  fees: integer("fees").default(0),
  glJournalEntryId: integer("gl_journal_entry_id").references(() => glJournalEntries.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ========================================
// SCHEMAS & EXPORTS FOR NEW TABLES
// ========================================

// GL Schemas
export const insertChartOfAccountsSchema = createInsertSchema(chartOfAccounts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGlFundSchema = createInsertSchema(glFunds).omit({ id: true, createdAt: true });
export const insertFiscalPeriodSchema = createInsertSchema(fiscalPeriods).omit({ id: true, createdAt: true });
export const insertGlJournalEntrySchema = createInsertSchema(glJournalEntries).omit({ id: true, createdAt: true });
export const insertGlTransactionSchema = createInsertSchema(glTransactions).omit({ id: true, createdAt: true });
export const insertGlReconciliationSchema = createInsertSchema(glReconciliations).omit({ id: true, createdAt: true });
export const insertGlReconciliationItemSchema = createInsertSchema(glReconciliationItems).omit({ id: true, createdAt: true });


// AR Schemas
export const insertArStudentBillSchema = createInsertSchema(arStudentBills).omit({ id: true, createdAt: true });
export const insertArBillLineItemSchema = createInsertSchema(arBillLineItems).omit({ id: true });
export const insertArPaymentSchema = createInsertSchema(arPayments).omit({ id: true, createdAt: true });
export const insertArPaymentAllocationSchema = createInsertSchema(arPaymentAllocations).omit({ id: true, createdAt: true });
export const insertArRefundSchema = createInsertSchema(arRefunds).omit({ id: true, createdAt: true });
export const insertArDunningHistorySchema = createInsertSchema(arDunningHistory).omit({ id: true, createdAt: true });

// AP Schemas
export const insertApVendorSchema = createInsertSchema(apVendors).omit({ id: true, createdAt: true });
export const insertApInvoiceSchema = createInsertSchema(apInvoices).omit({ id: true, createdAt: true });
export const insertApInvoiceLineItemSchema = createInsertSchema(apInvoiceLineItems).omit({ id: true });
export const insertApApprovalSchema = createInsertSchema(apApprovals).omit({ id: true, createdAt: true });
export const insertApPaymentSchema = createInsertSchema(apPayments).omit({ id: true, createdAt: true });
export const insertApExpenseReportSchema = createInsertSchema(apExpenseReports).omit({ id: true, createdAt: true });
export const insertApExpenseReportItemSchema = createInsertSchema(apExpenseReportItems).omit({ id: true });
export const insertAp1099RecordSchema = createInsertSchema(ap1099Records).omit({ id: true, createdAt: true });

// Payroll Schemas
export const insertPayrollRunSchema = createInsertSchema(payrollRuns).omit({ id: true, createdAt: true });
export const insertPayrollDetailSchema = createInsertSchema(payrollDetails).omit({ id: true, createdAt: true });
export const insertTimesheetSchema = createInsertSchema(timesheets).omit({ id: true, createdAt: true });
export const insertW2RecordSchema = createInsertSchema(w2Records).omit({ id: true, createdAt: true });

// Asset Depreciation Schemas
export const insertDepreciationScheduleSchema = createInsertSchema(depreciationSchedules).omit({ id: true, createdAt: true });
export const insertDepreciationEntrySchema = createInsertSchema(depreciationEntries).omit({ id: true, createdAt: true });
export const insertAssetDisposalSchema = createInsertSchema(assetDisposals).omit({ id: true, createdAt: true });

// Endowment Schemas
export const insertEndowmentFundSchema = createInsertSchema(endowmentFunds).omit({ id: true, createdAt: true });
export const insertInvestmentSchema = createInsertSchema(investments).omit({ id: true, createdAt: true });
export const insertInvestmentTransactionSchema = createInsertSchema(investmentTransactions).omit({ id: true, createdAt: true });

// Type Exports - GL
export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;
export type InsertChartOfAccount = z.infer<typeof insertChartOfAccountsSchema>;
export type GlFund = typeof glFunds.$inferSelect;
export type InsertGlFund = z.infer<typeof insertGlFundSchema>;
export type FiscalPeriod = typeof fiscalPeriods.$inferSelect;
export type InsertFiscalPeriod = z.infer<typeof insertFiscalPeriodSchema>;
export type GlJournalEntry = typeof glJournalEntries.$inferSelect;
export type InsertGlJournalEntry = z.infer<typeof insertGlJournalEntrySchema>;
export type GlTransaction = typeof glTransactions.$inferSelect;
export type InsertGlTransaction = z.infer<typeof insertGlTransactionSchema>;
export type GlReconciliation = typeof glReconciliations.$inferSelect;
export type InsertGlReconciliation = z.infer<typeof insertGlReconciliationSchema>;
export type GlReconciliationItem = typeof glReconciliationItems.$inferSelect;
export type InsertGlReconciliationItem = z.infer<typeof insertGlReconciliationItemSchema>;

// Type Exports - AR
export type ArStudentBill = typeof arStudentBills.$inferSelect;
export type InsertArStudentBill = z.infer<typeof insertArStudentBillSchema>;
export type ArBillLineItem = typeof arBillLineItems.$inferSelect;
export type InsertArBillLineItem = z.infer<typeof insertArBillLineItemSchema>;
export type ArPayment = typeof arPayments.$inferSelect;
export type InsertArPayment = z.infer<typeof insertArPaymentSchema>;
export type ArPaymentAllocation = typeof arPaymentAllocations.$inferSelect;
export type InsertArPaymentAllocation = z.infer<typeof insertArPaymentAllocationSchema>;
export type ArRefund = typeof arRefunds.$inferSelect;
export type InsertArRefund = z.infer<typeof insertArRefundSchema>;
export type ArDunningHistory = typeof arDunningHistory.$inferSelect;
export type InsertArDunningHistory = z.infer<typeof insertArDunningHistorySchema>;

// Type Exports - AP
export type ApVendor = typeof apVendors.$inferSelect;
export type InsertApVendor = z.infer<typeof insertApVendorSchema>;
export type ApInvoice = typeof apInvoices.$inferSelect;
export type InsertApInvoice = z.infer<typeof insertApInvoiceSchema>;
export type ApInvoiceLineItem = typeof apInvoiceLineItems.$inferSelect;
export type InsertApInvoiceLineItem = z.infer<typeof insertApInvoiceLineItemSchema>;
export type ApApproval = typeof apApprovals.$inferSelect;
export type InsertApApproval = z.infer<typeof insertApApprovalSchema>;
export type ApPayment = typeof apPayments.$inferSelect;
export type InsertApPayment = z.infer<typeof insertApPaymentSchema>;
export type ApExpenseReport = typeof apExpenseReports.$inferSelect;
export type InsertApExpenseReport = z.infer<typeof insertApExpenseReportSchema>;
export type ApExpenseReportItem = typeof apExpenseReportItems.$inferSelect;
export type InsertApExpenseReportItem = z.infer<typeof insertApExpenseReportItemSchema>;
export type Ap1099Record = typeof ap1099Records.$inferSelect;
export type InsertAp1099Record = z.infer<typeof insertAp1099RecordSchema>;

// Type Exports - Payroll
export type PayrollRun = typeof payrollRuns.$inferSelect;
export type InsertPayrollRun = z.infer<typeof insertPayrollRunSchema>;
export type PayrollDetail = typeof payrollDetails.$inferSelect;
export type InsertPayrollDetail = z.infer<typeof insertPayrollDetailSchema>;
export type Timesheet = typeof timesheets.$inferSelect;
export type InsertTimesheet = z.infer<typeof insertTimesheetSchema>;
export type W2Record = typeof w2Records.$inferSelect;
export type InsertW2Record = z.infer<typeof insertW2RecordSchema>;

// Type Exports - Asset Depreciation
export type DepreciationSchedule = typeof depreciationSchedules.$inferSelect;
export type InsertDepreciationSchedule = z.infer<typeof insertDepreciationScheduleSchema>;
export type DepreciationEntry = typeof depreciationEntries.$inferSelect;
export type InsertDepreciationEntry = z.infer<typeof insertDepreciationEntrySchema>;
export type AssetDisposal = typeof assetDisposals.$inferSelect;
export type InsertAssetDisposal = z.infer<typeof insertAssetDisposalSchema>;

// ========================================
// PHASE 2: ACADEMIC & FEE FOUNDATION
// ========================================

// Academic Years
export const academicYears = pgTable("academic_years", {
  id: serial("id").primaryKey(),
  yearCode: text("year_code").unique().notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isActive: boolean("is_active").default(false),
  isClosed: boolean("is_closed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Semesters
export const semesters = pgTable("semesters", {
  id: serial("id").primaryKey(),
  academicYearId: integer("academic_year_id").references(() => academicYears.id),
  name: text("name").notNull(),
  semesterNumber: integer("semester_number").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  registrationStart: date("registration_start"),
  registrationDeadline: date("registration_deadline"),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student Enrollments
export const studentEnrollments = pgTable("student_enrollments", {
  id: serial("id").primaryKey(),
  studentId: uuid("student_id").references(() => students.id),
  semesterId: integer("semester_id").references(() => semesters.id),
  status: text("status").default("registered"),
  totalCredits: integer("total_credits"),
  enrollmentDate: date("enrollment_date").defaultNow(),
});

// Fee Categories
export const feeCategories = pgTable("fee_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  description: text("description"),
  isMandatory: boolean("is_mandatory").default(true),
  isRecurring: boolean("is_recurring").default(true),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Fee Structures V2
export const feeStructuresv2 = pgTable("fee_structures_v2", {
  id: serial("id").primaryKey(),
  academicYearId: integer("academic_year_id").references(() => academicYears.id),
  programId: integer("program_id").references(() => programs.id),
  semesterNumber: integer("semester_number"),
  feeCategoryId: integer("fee_category_id").references(() => feeCategories.id),
  amount: integer("amount").notNull(),
  calculationType: text("calculation_type").default("fixed"),
  dueDateType: text("due_date_type").default("fixed_date"),
  fixedDueDate: date("fixed_due_date"),
  dueDateOffset: integer("due_date_offset").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Credit Based Fees
export const creditBasedFees = pgTable("credit_based_fees", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").references(() => programs.id),
  academicYearId: integer("academic_year_id").references(() => academicYears.id),
  feePerCredit: integer("fee_per_credit").notNull(),
  minimumCredits: integer("minimum_credits").default(0),
  maximumCredits: integer("maximum_credits"),
  isActive: boolean("is_active").default(true),
});

// Program Fee Adjustments
export const programFeeAdjustments = pgTable("program_fee_adjustments", {
  id: serial("id").primaryKey(),
  programId: integer("program_id").references(() => programs.id),
  feeCategoryId: integer("fee_category_id").references(() => feeCategories.id),
  adjustmentType: text("adjustment_type").default("fixed_amount"),
  adjustmentValue: integer("adjustment_value"),
  reason: text("reason"),
  effectiveFrom: date("effective_from"),
  effectiveTo: date("effective_to"),
});

// Student Fees
export const studentFees = pgTable("student_fees", {
  id: serial("id").primaryKey(),
  studentId: uuid("student_id").references(() => students.id),
  semesterId: integer("semester_id").references(() => semesters.id),
  feeStructureId: integer("fee_structure_id").references(() => feeStructuresv2.id),
  feeCategoryId: integer("fee_category_id").references(() => feeCategories.id),
  baseAmount: integer("base_amount").notNull(),
  discountAmount: integer("discount_amount").default(0),
  scholarshipAmount: integer("scholarship_amount").default(0),
  penaltyAmount: integer("penalty_amount").default(0),
  finalAmount: integer("final_amount").notNull(),
  paidAmount: integer("paid_amount").default(0),
  outstandingAmount: integer("outstanding_amount").notNull(),
  dueDate: date("due_date").notNull(),
  status: feeStatusEnum("status").default("pending"),
  notes: text("notes"),
  assignedDate: timestamp("assigned_date").defaultNow(),
});

// ==================================== 
// PHASE 3: PAYMENTS & EXPENSES
// ====================================

// Payment & Refund Enums for Phase 3 (V2 versions with more options)
export const paymentMethodV2Enum = pgEnum("payment_method_v2", ["cash", "card", "bank_transfer", "online", "cheque", "mobile_money"]);
export const paymentStatusV2Enum = pgEnum("payment_status_v2", ["pending", "completed", "failed", "refunded", "cancelled"]);
export const refundStatusV2Enum = pgEnum("refund_status_v2", ["pending", "approved", "rejected", "processed"]);

// Payments
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  paymentNumber: text("payment_number").unique().notNull(),
  studentId: uuid("student_id").references(() => students.id),
  studentFeeId: integer("student_fee_id").references(() => studentFees.id),
  amount: integer("amount").notNull(),
  paymentDate: date("payment_date").defaultNow().notNull(),
  paymentMethod: paymentMethodV2Enum("payment_method").notNull(),
  transactionReference: text("transaction_reference"),
  referenceNumber: text("reference_number"), // Alternative reference field
  receiptNumber: text("receipt_number").unique(),
  receiptGenerated: boolean("receipt_generated").default(false),
  collectedById: uuid("collected_by").references(() => users.id),
  status: paymentStatusV2Enum("status").default("completed"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
});

// Payment Allocations 
export const paymentAllocations = pgTable("payment_allocations", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").references(() => payments.id),
  studentFeeId: integer("student_fee_id").references(() => studentFees.id),
  allocatedAmount: integer("allocated_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Refunds
export const refunds = pgTable("refunds", {
  id: serial("id").primaryKey(),
  refundNumber: text("refund_number").unique().notNull(),
  paymentId: integer("payment_id").references(() => payments.id),
  studentId: uuid("student_id").references(() => students.id),
  refundAmount: integer("refund_amount").notNull(),
  refundReason: text("refund_reason").notNull(),
  refundMethod: paymentMethodV2Enum("refund_method"),
  refundDate: date("refund_date"),
  status: refundStatusV2Enum("status").default("pending"),
  requestedById: uuid("requested_by").references(() => users.id),
  approvedById: uuid("approved_by").references(() => users.id),
  processedById: uuid("processed_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Late Fees
export const lateFees = pgTable("late_fees", {
  id: serial("id").primaryKey(),
  studentFeeId: integer("student_fee_id").references(() => studentFees.id),
  amount: integer("amount").notNull(),
  appliedDate: date("applied_date").defaultNow().notNull(),
  daysOverdue: integer("days_overdue"),
  waived: boolean("waived").default(false),
  waivedById: uuid("waived_by").references(() => users.id),
  waiverReason: text("waiver_reason"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Scholarship Types
export const scholarshipTypes = pgTable("scholarship_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  description: text("description"),
  amountType: text("amount_type").notNull(),
  amount: integer("amount"),
  percentage: integer("percentage"),
  totalSlots: integer("total_slots"),
  slotsFilled: integer("slots_filled").default(0),
  academicYearId: integer("academic_year_id").references(() => academicYears.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Scholarship Applications
export const scholarshipApplications = pgTable("scholarship_applications", {
  id: serial("id").primaryKey(),
  studentId: uuid("student_id").references(() => students.id),
  scholarshipTypeId: integer("scholarship_type_id").references(() => scholarshipTypes.id),
  academicYearId: integer("academic_year_id").references(() => academicYears.id),
  applicationDate: date("application_date").defaultNow(),
  status: text("status").default("pending"),
  reviewedById: uuid("reviewed_by").references(() => users.id),
  reviewNotes: text("review_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Student Scholarships
export const studentScholarships = pgTable("student_scholarships", {
  id: serial("id").primaryKey(),
  studentId: uuid("student_id").references(() => students.id),
  scholarshipTypeId: integer("scholarship_type_id").references(() => scholarshipTypes.id),
  academicYearId: integer("academic_year_id").references(() => academicYears.id),
  awardedAmount: integer("awarded_amount").notNull(),
  disbursementType: text("disbursement_type"),
  status: text("status").default("approved"),
  approvedById: uuid("approved_by").references(() => users.id),
  approvalDate: date("approval_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Scholarship D isbursements
export const scholarshipDisbursements = pgTable("scholarship_disbursements", {
  id: serial("id").primaryKey(),
  studentScholarshipId: integer("student_scholarship_id").references(() => studentScholarships.id),
  studentFeeId: integer("student_fee_id").references(() => studentFees.id),
  amount: integer("amount").notNull(),
  disbursementDate: date("disbursement_date").defaultNow(),
  disbursedById: uuid("disbursed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Expense Categories
export const expenseCategories = pgTable("expense_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").unique().notNull(),
  parentCategoryId: integer("parent_category_id"),
  requiresApproval: boolean("requires_approval").default(true),
  approvalLimit: integer("approval_limit"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Vendors
export const vendors = pgTable("vendors", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  vendorCode: text("vendor_code").unique().notNull(),
  contactPerson: text("contact_person"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  taxId: text("tax_id"),
  bankName: text("bank_name"),
  bankAccount: text("bank_account"),
  isApproved: boolean("is_approved").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Expenses
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  expenseNumber: text("expense_number").unique().notNull(),
  expenseCategoryId: integer("expense_category_id").references(() => expenseCategories.id),
  departmentId: integer("department_id").references(() => departments.id),
  vendorId: integer("vendor_id").references(() => vendors.id),
  amount: integer("amount").notNull(),
  taxAmount: integer("tax_amount").default(0),
  totalAmount: integer("total_amount").notNull(),
  expenseDate: date("expense_date").notNull(),
  status: text("status").default("pending"),
  description: text("description").notNull(),
  requestedById: uuid("requested_by").references(() => users.id),
  approvedById: uuid("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Note: purchaseOrders and purchaseOrderItems don't exist yet - will add export alias from AP module's poLineItems

// Payment Plans
export const paymentPlans = pgTable("payment_plans", {
  id: serial("id").primaryKey(),
  studentId: uuid("student_id").notNull().references(() => students.id),
  totalAmount: integer("total_amount").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  frequency: text("frequency").notNull(),
  status: text("status").default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payment Plan Installments
export const paymentPlanInstallments = pgTable("payment_plan_installments", {
  id: serial("id").primaryKey(),
  paymentPlanId: integer("payment_plan_id").notNull().references(() => paymentPlans.id),
  dueDate: date("due_date").notNull(),
  amount: integer("amount").notNull(),
  status: text("status").default("pending"),
  paidAmount: integer("paid_amount").default(0),
  paidAt: timestamp("paid_at"),
});

// Schemas for Phase 2 tables
export const insertAcademicYearSchema = createInsertSchema(academicYears).omit({ id: true, createdAt: true });
export type AcademicYear = typeof academicYears.$inferSelect;
export type InsertAcademicYear = z.infer<typeof insertAcademicYearSchema>;

export const insertSemesterSchema = createInsertSchema(semesters).omit({ id: true, createdAt: true });
export type Semester = typeof semesters.$inferSelect;
export type InsertSemester = z.infer<typeof insertSemesterSchema>;

export const insertStudentEnrollmentSchema = createInsertSchema(studentEnrollments).omit({ id: true, enrollmentDate: true });
export type StudentEnrollment = typeof studentEnrollments.$inferSelect;
export type InsertStudentEnrollment = z.infer<typeof insertStudentEnrollmentSchema>;

export const insertFeeCategorySchema = createInsertSchema(feeCategories).omit({ id: true, createdAt: true });
export type FeeCategory = typeof feeCategories.$inferSelect;
export type InsertFeeCategory = z.infer<typeof insertFeeCategorySchema>;

export const insertFeeStructureV2Schema = createInsertSchema(feeStructuresv2).omit({ id: true, createdAt: true });
export type FeeStructureV2 = typeof feeStructuresv2.$inferSelect;
export type InsertFeeStructureV2 = z.infer<typeof insertFeeStructureV2Schema>;

export const insertCreditBasedFeeSchema = createInsertSchema(creditBasedFees).omit({ id: true });
export type CreditBasedFee = typeof creditBasedFees.$inferSelect;
export type InsertCreditBasedFee = z.infer<typeof insertCreditBasedFeeSchema>;

export const insertProgramFeeAdjustmentSchema = createInsertSchema(programFeeAdjustments).omit({ id: true });
export type ProgramFeeAdjustment = typeof programFeeAdjustments.$inferSelect;
export type InsertProgramFeeAdjustment = z.infer<typeof insertProgramFeeAdjustmentSchema>;

export const insertStudentFeeSchema = createInsertSchema(studentFees).omit({ id: true, assignedDate: true });
export type StudentFee = typeof studentFees.$inferSelect;
export type InsertStudentFee = z.infer<typeof insertStudentFeeSchema>;

// Schemas for Phase 3 tables
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export const insertPaymentAllocationSchema = createInsertSchema(paymentAllocations).omit({ id: true, createdAt: true });
export type PaymentAllocation = typeof paymentAllocations.$inferSelect;
export type InsertPaymentAllocation = z.infer<typeof insertPaymentAllocationSchema>;

export const insertRefundSchema = createInsertSchema(refunds).omit({ id: true, createdAt: true });
export type Refund = typeof refunds.$inferSelect;
export type InsertRefund = z.infer<typeof insertRefundSchema>;

export const insertLateFeeSchema = createInsertSchema(lateFees).omit({ id: true, createdAt: true });
export type LateFee = typeof lateFees.$inferSelect;
export type InsertLateFee = z.infer<typeof insertLateFeeSchema>;

export const insertScholarshipTypeSchema = createInsertSchema(scholarshipTypes).omit({ id: true, createdAt: true });
export type ScholarshipType = typeof scholarshipTypes.$inferSelect;
export type InsertScholarshipType = z.infer<typeof insertScholarshipTypeSchema>;

export const insertScholarshipApplicationSchema = createInsertSchema(scholarshipApplications).omit({ id: true, createdAt: true });
export type ScholarshipApplication = typeof scholarshipApplications.$inferSelect;
export type InsertScholarshipApplication = z.infer<typeof insertScholarshipApplicationSchema>;

export const insertStudentScholarshipSchema = createInsertSchema(studentScholarships).omit({ id: true, createdAt: true });
export type StudentScholarship = typeof studentScholarships.$inferSelect;
export type InsertStudentScholarship = z.infer<typeof insertStudentScholarshipSchema>;

export const insertScholarshipDisbursementSchema = createInsertSchema(scholarshipDisbursements).omit({ id: true, createdAt: true });
export type ScholarshipDisbursement = typeof scholarshipDisbursements.$inferSelect;
export type InsertScholarshipDisbursement = z.infer<typeof insertScholarshipDisbursementSchema>;

export const insertExpenseCategorySchema = createInsertSchema(expenseCategories).omit({ id: true, createdAt: true });
export type ExpenseCategory = typeof expenseCategories.$inferSelect;
export type InsertExpenseCategory = z.infer<typeof insertExpenseCategorySchema>;

export const insertVendorSchema = createInsertSchema(vendors).omit({ id: true, createdAt: true });
export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export const insertExpenseSchema = createInsertSchema(expenses).omit({ id: true, createdAt: true });
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

// Note: insertPurchaseOrderSchema and insertPurchaseOrderItemSchema already exist in AP module section

export const insertPaymentPlanSchema = createInsertSchema(paymentPlans).omit({ id: true, createdAt: true });
export type PaymentPlan = typeof paymentPlans.$inferSelect;
export type InsertPaymentPlan = z.infer<typeof insertPaymentPlanSchema>;

export const insertPaymentPlanInstallmentSchema = createInsertSchema(paymentPlanInstallments).omit({ id: true });
export type PaymentPlanInstallment = typeof paymentPlanInstallments.$inferSelect;
export type InsertPaymentPlanInstallment = z.infer<typeof insertPaymentPlanInstallmentSchema>;

// Programs & Departments Schemas
export const insertProgramSchema = createInsertSchema(programs).omit({ id: true, createdAt: true });
export type Program = typeof programs.$inferSelect;
export type InsertProgram = z.infer<typeof insertProgramSchema>;

export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true, createdAt: true });
export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

// Donors Schemas  
export const insertDonorSchema = createInsertSchema(donors).omit({ id: true, createdAt: true });
export type Donor = typeof donors.$inferSelect;
export type InsertDonor = z.infer<typeof insertDonorSchema>;

export const insertDonationSchema = createInsertSchema(donations).omit({ id: true, createdAt: true });
export type Donation = typeof donations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;

// Type Exports - Endowments
export type EndowmentFund = typeof endowmentFunds.$inferSelect;
export type InsertEndowmentFund = z.infer<typeof insertEndowmentFundSchema>;
export type Investment = typeof investments.$inferSelect;
export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type InvestmentTransaction = typeof investmentTransactions.$inferSelect;
export type InsertInvestmentTransaction = z.infer<typeof insertInvestmentTransactionSchema>;

// ============================================================================
// AUDIT LOGGING SYSTEM
// ============================================================================

export const auditActionEnum = pgEnum("audit_action", ["create", "update", "delete", "login", "logout", "view", "export", "approve", "reject"]);

// System-wide Audit Logs (Immutable Record)
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id), // Who performed the action
  action: auditActionEnum("action").notNull(),
  tableName: text("table_name").notNull(), // Which table was affected
  recordId: integer("record_id"), // ID of the affected record
  oldValue: jsonb("old_value"), // Snapshot before change (for updates/deletes)
  newValue: jsonb("new_value"), // Snapshot after change (for creates/updates)
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata").default({}), // Additional context
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Fiscal Period Lock (Prevents tampering with closed periods)
export const fiscalPeriodLocks = pgTable("fiscal_period_locks", {
  id: serial("id").primaryKey(),
  periodName: text("period_name").notNull(), // e.g., "2024-Q1", "January 2025"
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isLocked: boolean("is_locked").default(false).notNull(),
  lockedBy: uuid("locked_by").references(() => users.id),
  lockedAt: timestamp("locked_at"),
  notes: text("notes"),
});

// ============================================================================
// NOTIFICATION SYSTEM
// ============================================================================

export const notificationTypeEnum = pgEnum("notification_type", [
  "fee_reminder", "fee_overdue", "payment_received", "exam_result",
  "attendance_alert", "announcement", "assignment_due", "system"
]);
export const notificationChannelEnum = pgEnum("notification_channel", ["in_app", "email", "sms", "push"]);
export const notificationStatusEnum = pgEnum("notification_status", ["pending", "sent", "failed", "read"]);

// Notification Templates (Admin-configurable)
export const notificationTemplates = pgTable("notification_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: notificationTypeEnum("type").notNull(),
  subject: text("subject").notNull(), // Email subject / Push title
  bodyTemplate: text("body_template").notNull(), // Supports {{variable}} placeholders
  channels: jsonb("channels").default(["in_app"]).notNull(), // Which channels to use
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Notification Preferences
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  type: notificationTypeEnum("type").notNull(),
  emailEnabled: boolean("email_enabled").default(true).notNull(),
  smsEnabled: boolean("sms_enabled").default(false).notNull(),
  pushEnabled: boolean("push_enabled").default(true).notNull(),
  inAppEnabled: boolean("in_app_enabled").default(true).notNull(),
});

// Notification Queue (Outgoing notifications)
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id), // Recipient
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"), // Optional deep link to relevant page
  channel: notificationChannelEnum("channel").notNull(),
  status: notificationStatusEnum("status").default("pending").notNull(),
  sentAt: timestamp("sent_at"),
  readAt: timestamp("read_at"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Scheduled Notification Jobs (For recurring reminders)
export const scheduledNotifications = pgTable("scheduled_notifications", {
  id: serial("id").primaryKey(),
  templateId: integer("template_id").references(() => notificationTemplates.id),
  targetQuery: text("target_query").notNull(), // SQL-like filter to find recipients
  scheduledFor: timestamp("scheduled_for").notNull(),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurringCron: text("recurring_cron"), // Cron expression for recurring jobs
  lastRunAt: timestamp("last_run_at"),
  nextRunAt: timestamp("next_run_at"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ========================================
// LIBRARY MANAGEMENT MODULE
// ========================================
// Library Management Module
export const libraryItemStatusEnum = pgEnum("library_item_status", ["available", "checked_out", "reserved", "maintenance", "lost"]);
export const libraryLoanStatusEnum = pgEnum("library_loan_status", ["active", "returned", "overdue", "lost"]);
export const bookFormatEnum = pgEnum("book_format", ["physical", "digital", "both"]);

// Catalog - Stores Book/Journal metadata (MARC 21 fields + Digital Content)
export const libraryItems = pgTable("library_items", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  isbn: text("isbn").unique(),
  marcData: jsonb("marc_data"), // Stores full MARC 21 record
  callNumber: text("call_number"), // For locating on shelves
  author: text("author").notNull(),
  publisher: text("publisher"),
  publicationYear: integer("publication_year"),
  itemType: text("item_type").default("book"), // Book, Journal, Media
  totalCopies: integer("total_copies").default(1),
  availableCopies: integer("available_copies").default(1),
  locationStack: text("location_stack"),
  // Expanded metadata for UI
  coverUrl: text("cover_url"),
  pageCount: integer("page_count"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),

  // Digital Content Fields (for Open Library integration)
  bookFormat: bookFormatEnum("book_format").default("physical"),
  digitalFormat: text("digital_format"), // "pdf", "epub", "html"
  contentUrl: text("content_url"), // URL to self-hosted digital content
  openLibraryKey: text("open_library_key"), // e.g., "/works/OL15626917W"
  openLibraryEditionKey: text("open_library_edition_key"),
  internetArchiveId: text("internet_archive_id"), // For embedded reader
  previewUrl: text("preview_url"), // Free preview link
  isPublicDomain: boolean("is_public_domain").default(false),
  subjects: jsonb("subjects").default([]), // Array of subject tags
  languages: jsonb("languages").default(["en"]), // Language codes
});

// Circulation - Tracking borrowing history
export const libraryLoans = pgTable("library_loans", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => libraryItems.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  checkoutDate: date("checkout_date").defaultNow().notNull(),
  dueDate: date("due_date").notNull(),
  returnDate: date("return_date"),
  status: libraryLoanStatusEnum("status").default("active"),
  fineAmount: integer("fine_amount").default(0), // Calculated based on delay
});

// Reservations
export const libraryReservations = pgTable("library_reservations", {
  id: serial("id").primaryKey(),
  itemId: integer("item_id").notNull().references(() => libraryItems.id),
  userId: uuid("user_id").notNull().references(() => users.id),
  reservationDate: date("reservation_date").defaultNow(),
  status: text("status").default("pending"), // pending, fulfilled, cancelled
});

// Library Management Schemas
export const insertLibraryItemSchema = createInsertSchema(libraryItems).omit({ id: true, createdAt: true });
export const insertLibraryLoanSchema = createInsertSchema(libraryLoans).omit({ id: true });
export const insertLibraryReservationSchema = createInsertSchema(libraryReservations).omit({ id: true });

// Library Management Types
export type LibraryItem = typeof libraryItems.$inferSelect;
export type InsertLibraryItem = z.infer<typeof insertLibraryItemSchema>;
export type LibraryLoan = typeof libraryLoans.$inferSelect;
export type InsertLibraryLoan = z.infer<typeof insertLibraryLoanSchema>;
export type LibraryReservation = typeof libraryReservations.$inferSelect;
export type InsertLibraryReservation = z.infer<typeof insertLibraryReservationSchema>;

// =============================================================================
// 1. CORE IDENTITY & 360° PROFILE (The "Single Source of Truth")
// =============================================================================

// Replaces simple "Parent" tables with a flexible Relationship matrix
// Professional Usage: Handles step-parents, legal guardians, and emergency contacts distinctly.
export const relationshipTypeEnum = pgEnum("relationship_type", ["father", "mother", "guardian", "sibling", "spouse", "sponsor", "other"]);

export const studentRelationships = pgTable("student_relationships", {
  id: serial("id").primaryKey(),
  studentId: uuid("student_id").notNull().references(() => students.id),
  relatedUserId: uuid("related_user_id").notNull().references(() => users.id), // Link to a User account
  relationshipType: relationshipTypeEnum("relationship_type").notNull(),
  isEmergencyContact: boolean("is_emergency_contact").default(false),
  isBillingContact: boolean("is_billing_contact").default(false), // SYNC: Who receives the invoice?
  canPickup: boolean("can_pickup").default(false), // Security: Authorized for pickup?
  isLegalGuardian: boolean("is_legal_guardian").default(false),
});

// HIPAA/FERPA Compliant Health Record
// Professional Usage: Links medical conditions to liability waivers and gym/hostel eligibility.
export const studentHealth = pgTable("student_health", {
  id: serial("id").primaryKey(),
  studentId: uuid("student_id").notNull().references(() => students.id),
  bloodGroup: text("blood_group"), // A+, O-, etc.
  allergies: jsonb("allergies"), // ["Peanuts", "Penicillin"]
  medicalConditions: text("medical_conditions"),
  vaccinationStatus: jsonb("vaccination_status"), // {"covid": true, "polio": true}
  insuranceProvider: text("insurance_provider"),
  insurancePolicyNo: text("insurance_policy_no"),
  emergencyDoctorName: text("emergency_doctor_name"),
  emergencyDoctorPhone: text("emergency_doctor_phone"),
  lastPhysicalDate: date("last_physical_date"),
});

// Centralized Document Vault
// Professional Usage: Stores verified digital copies of IDs, eliminating paper files.
export const studentDocuments = pgTable("student_documents", {
  id: serial("id").primaryKey(),
  studentId: uuid("student_id").notNull().references(() => students.id),
  documentType: text("document_type").notNull(), // "Passport", "Birth Certificate", "Transcript"
  documentNumber: text("document_number"),
  fileUrl: text("file_url").notNull(), // S3/Storage Link
  isVerified: boolean("is_verified").default(false),
  verifiedBy: uuid("verified_by").references(() => users.id),
  expiryDate: date("expiry_date"), // SYNC: System alerts when visa/passport expires
});

// =============================================================================
// 2. CAMPUS OPERATIONS (Synced to Finance)
// =============================================================================

// Hostel Management
// Professional Sync: Room allocation is tied directly to a Fee Record.
export const hostelRoomTypeEnum = pgEnum("hostel_room_type", ["single", "double", "dormitory", "studio"]);
export const hostelStatusEnum = pgEnum("hostel_status", ["active", "maintenance", "closed"]);

export const hostels = pgTable("hostels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type"), // "Boys", "Girls", "Co-Ed"
  capacity: integer("capacity").notNull(),
  wardenId: uuid("warden_id").references(() => users.id),
  address: text("address"),
  status: hostelStatusEnum("status").default("active"),
});

export const hostelRooms = pgTable("hostel_rooms", {
  id: serial("id").primaryKey(),
  hostelId: integer("hostel_id").notNull().references(() => hostels.id),
  roomNumber: text("room_number").notNull(),
  floor: integer("floor"),
  capacity: integer("capacity").default(2),
  occupiedBeds: integer("occupied_beds").default(0),
  costPerTerm: integer("cost_per_term").notNull().default(0), // SYNC: The master price list
  roomType: hostelRoomTypeEnum("room_type").default("double"),
  isAc: boolean("is_ac").default(false),
});

export const hostelAllocations = pgTable("hostel_allocations", {
  id: serial("id").primaryKey(),
  studentId: uuid("student_id").notNull().references(() => students.id),
  roomId: integer("room_id").notNull().references(() => hostelRooms.id),
  academicPeriodId: integer("academic_period_id").references(() => academicPeriods.id),
  checkInDate: date("check_in_date").notNull(),
  checkOutDate: date("check_out_date"),
  status: text("status").default("active"),
  undertakingSigned: boolean("undertaking_signed").default(false),
  // THE SYNC POINT:
  financeFeeId: integer("finance_fee_id").references(() => fees.id), // Cannot exist without a fee record
});

// Transport Management
// Professional Sync: Bus routes are billable items.
export const transportRoutes = pgTable("transport_routes", {
  id: serial("id").primaryKey(),
  routeName: text("route_name").notNull(), // "Route A - Downtown"
  vehicleNumber: text("vehicle_number"),
  driverName: text("driver_name"),
  driverPhone: text("driver_phone"),
  costPerTerm: integer("cost_per_term").notNull().default(0), // SYNC: Master price
  capacity: integer("capacity"),
  startPoint: text("start_point"),
  endPoint: text("end_point"),
  distanceKm: integer("distance_km"),
});

export const transportAllocations = pgTable("transport_allocations", {
  id: serial("id").primaryKey(),
  studentId: uuid("student_id").notNull().references(() => students.id),
  routeId: integer("route_id").notNull().references(() => transportRoutes.id),
  pickupPoint: text("pickup_point"),
  academicPeriodId: integer("academic_period_id").references(() => academicPeriods.id),
  startDate: date("start_date"),
  endDate: date("end_date"),
  isActive: boolean("is_active").default(true),
  // THE SYNC POINT:
  financeFeeId: integer("finance_fee_id").references(() => fees.id), // Auto-bills the student
});


// =============================================================================
// 3. ACADEMIC RESOURCES (Library & Research)
// =============================================================================


// Research Grants (Faculty Success)
// Professional Sync: Links academic prestige to financial auditing.
export const researchGrants = pgTable("research_grants", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  principalInvestigatorId: uuid("pi_id").references(() => users.id),
  fundingAgency: text("funding_agency"), // "National Science Foundation"
  totalBudget: integer("total_budget").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: text("status").default("active"),
  // THE SYNC POINT:
  glCode: text("gl_code"), // e.g. "GRANT-2026-05" - Tracks spending against this code
});

// =============================================================================
// 4. HR & TALENT MANAGEMENT (Beyond just "Staff List")
// =============================================================================

// Leave Management with Accruals
export const leaveTypeEnum = pgEnum("leave_type", ["sick", "casual", "vacation", "unpaid", "study"]);

export const staffLeaveBalances = pgTable("staff_leave_balances", {
  id: serial("id").primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => users.id),
  year: integer("year").notNull(), // 2026
  leaveType: leaveTypeEnum("leave_type").notNull(),
  totalDays: integer("total_days").notNull(), // e.g. 14
  usedDays: integer("used_days").default(0),
  remainingDays: integer("remaining_days").default(0),
});

export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => users.id),
  leaveType: leaveTypeEnum("leave_type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  status: text("status").default("pending"), // approved, rejected
  approvedBy: uuid("approved_by").references(() => users.id),
});

// Performance Appraisals
export const staffAppraisals = pgTable("staff_appraisals", {
  id: serial("id").primaryKey(),
  employeeId: uuid("employee_id").notNull().references(() => users.id),
  reviewDate: date("review_date").notNull(),
  evaluatorId: uuid("evaluator_id").references(() => users.id),
  score: integer("score"), // 1-100
  comments: text("comments"),
  goalsForNextYear: text("goals_for_next_year"),
});

// =============================================================================
// 5. ADMISSIONS & CRM (The Enrollment Funnel)
// =============================================================================

// Enhanced Admissions Leads (Replacing the previous generic one if needed or just updating)
// We already have admissionsLeads, but we'll ensure it has the new fields
// This re-definition for admissionsLeads ensures it matches the new request.
// However, since we might have existing rows, we'll try to keep the table name consistent.
// We'll define crmInteractions here again to be safe with the new schema.

// =============================================================================
// 6. DYNAMIC ADMIN CONTROL (Configuration over Code)
// =============================================================================

// System Settings
// Professional Usage: Allows changing school name, logos, and rules without redeploying code.
export const systemSettings = pgTable("system_settings", {
  key: text("key").primaryKey(), // e.g. "site_name", "allow_late_fees", "currency"
  value: text("value").notNull(),
  category: text("category").default("general"),
  description: text("description"),
  isEncrypted: boolean("is_encrypted").default(false), // For API Keys
});

// Dynamic RBAC (Role Based Access Control)
// Professional Usage: Define granular permissions (e.g., "can_view_grades" but "cannot_edit_grades").
export const roles = pgTable("roles", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(), // "Dean", "Librarian", "Hostel Warden"
  description: text("description"),
  isSystem: boolean("is_system").default(false), // Prevent deletion of Admin
});

export const permissions = pgTable("permissions", {
  id: serial("id").primaryKey(),
  code: text("code").unique().notNull(), // "finance.invoices.create"
  description: text("description"),
  module: text("module").notNull(), // "finance"
});

export const rolePermissions = pgTable("role_permissions", {
  roleId: integer("role_id").references(() => roles.id),
  permissionId: integer("permission_id").references(() => permissions.id),
});


// ========================================
// ADMISSIONS & CRM MODULE
// ========================================

export const leadStatusEnum = pgEnum("lead_status", ["new", "contacted", "qualified", "application_started", "converted", "lost"]);

export const admissionsLeads = pgTable("admissions_leads", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  interestProgramId: integer("interest_program_id").references(() => programs.id),
  leadScore: integer("lead_score").default(0), // AI/Rule-based score
  source: text("source"), // e.g., "Web", "Fair", "Referral"
  status: leadStatusEnum("status").default("new"),
  createdAt: timestamp("created_at").defaultNow(),
});

// The "3Cs" (Communications, Checklists, Comments)
export const crmInteractions = pgTable("crm_interactions", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // 'lead', 'student', 'donor'
  entityId: integer("entity_id").notNull(),
  interactionType: text("interaction_type").notNull(), // 'email', 'call', 'meeting'
  subject: text("subject"),
  notes: text("notes"),
  recordedBy: uuid("recorded_by").references(() => users.id),
  interactionDate: timestamp("interaction_date").defaultNow(),
});

// Admissions & CRM Schemas
export const insertAdmissionsLeadSchema = createInsertSchema(admissionsLeads).omit({ id: true, createdAt: true });
export const insertCrmInteractionSchema = createInsertSchema(crmInteractions).omit({ id: true, interactionDate: true });

// Admissions & CRM Types
export type AdmissionsLead = typeof admissionsLeads.$inferSelect;
export type InsertAdmissionsLead = z.infer<typeof insertAdmissionsLeadSchema>;
export type CrmInteraction = typeof crmInteractions.$inferSelect;
export type InsertCrmInteraction = z.infer<typeof insertCrmInteractionSchema>;

// Hostel Management Schemas
export const insertHostelSchema = createInsertSchema(hostels).omit({ id: true });
export const insertHostelRoomSchema = createInsertSchema(hostelRooms).omit({ id: true });
export const insertHostelAllocationSchema = createInsertSchema(hostelAllocations).omit({ id: true });

// Transport Management Schemas
export const insertTransportRouteSchema = createInsertSchema(transportRoutes).omit({ id: true });
// export const insertTransportVehicleSchema = createInsertSchema(transportVehicles).omit({ id: true }); // Removed separate vehicle table to merge into routes as per new schema or kept separate? 
// The new schema request merged vehicles into routes slightly (vehicleNumber in routes), but let's keep it simple.
// Actually, the new request has `transportRoutes` with `vehicleNumber`.
// Let's comment out the old vehicle schema if it conflicts or let it be. 
// For now, I'll stick to the new tables provided. 

export const insertTransportAllocationSchema = createInsertSchema(transportAllocations).omit({ id: true });

// New Schemas
export const insertStudentRelationshipSchema = createInsertSchema(studentRelationships).omit({ id: true });
export const insertStudentHealthSchema = createInsertSchema(studentHealth).omit({ id: true });
export const insertStudentDocumentSchema = createInsertSchema(studentDocuments).omit({ id: true });
export const insertResearchGrantSchema = createInsertSchema(researchGrants).omit({ id: true });
export const insertStaffLeaveBalanceSchema = createInsertSchema(staffLeaveBalances).omit({ id: true });
export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({ id: true });
export const insertStaffAppraisalSchema = createInsertSchema(staffAppraisals).omit({ id: true });

// Core Identity Types
export type StudentRelationship = typeof studentRelationships.$inferSelect;
export type InsertStudentRelationship = z.infer<typeof insertStudentRelationshipSchema>;
export type StudentHealth = typeof studentHealth.$inferSelect;
export type InsertStudentHealth = z.infer<typeof insertStudentHealthSchema>;
export type StudentDocument = typeof studentDocuments.$inferSelect;
export type InsertStudentDocument = z.infer<typeof insertStudentDocumentSchema>;

// Research Grant Types
export type ResearchGrant = typeof researchGrants.$inferSelect;
export type InsertResearchGrant = z.infer<typeof insertResearchGrantSchema>;

// HR & Leave Management Types
export type StaffLeaveBalance = typeof staffLeaveBalances.$inferSelect;
export type InsertStaffLeaveBalance = z.infer<typeof insertStaffLeaveBalanceSchema>;
export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;
export type StaffAppraisal = typeof staffAppraisals.$inferSelect;
export type InsertStaffAppraisal = z.infer<typeof insertStaffAppraisalSchema>;

// System Settings & RBAC Types
export const insertSystemSettingSchema = createInsertSchema(systemSettings);
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;

export const insertRoleSchema = createInsertSchema(roles).omit({ id: true });
export type Role = typeof roles.$inferSelect;
export type InsertRole = z.infer<typeof insertRoleSchema>;

export const insertPermissionSchema = createInsertSchema(permissions).omit({ id: true });
export type Permission = typeof permissions.$inferSelect;
export type InsertPermission = z.infer<typeof insertPermissionSchema>;

export const insertRolePermissionSchema = createInsertSchema(rolePermissions);
export type RolePermission = typeof rolePermissions.$inferSelect;
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;

// Hostel Management Types
export type Hostel = typeof hostels.$inferSelect;
export type InsertHostel = z.infer<typeof insertHostelSchema>;
export type HostelRoom = typeof hostelRooms.$inferSelect;
export type InsertHostelRoom = z.infer<typeof insertHostelRoomSchema>;
export type HostelAllocation = typeof hostelAllocations.$inferSelect;
export type InsertHostelAllocation = z.infer<typeof insertHostelAllocationSchema>;

// Transport Management Types
export type TransportRoute = typeof transportRoutes.$inferSelect;
export type InsertTransportRoute = z.infer<typeof insertTransportRouteSchema>;
export type TransportAllocation = typeof transportAllocations.$inferSelect;
export type InsertTransportAllocation = z.infer<typeof insertTransportAllocationSchema>;

// Admissions & CRM Types (already defined above but let's ensure exports)
// We will reuse the existing `admissionsLeads` and `crmInteractions` tables but might need to alter them if they changed drastically.
// The new request shows `admissionsLeads` with `interestedProgram` as text (vs id) and `assignedTo`.
// I will NOT replace `admissionsLeads` entirely here to avoid breaking the file structure too much, 
// but I will add the NEW tables for sure.

// ============================================================================
// SCHEMAS & TYPE EXPORTS FOR NEW TABLES
// ============================================================================

// Audit Logs
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Fiscal Period Locks
export const insertFiscalPeriodLockSchema = createInsertSchema(fiscalPeriodLocks).omit({ id: true });
export type FiscalPeriodLock = typeof fiscalPeriodLocks.$inferSelect;
export type InsertFiscalPeriodLock = z.infer<typeof insertFiscalPeriodLockSchema>;

// Notification Templates
export const insertNotificationTemplateSchema = createInsertSchema(notificationTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type InsertNotificationTemplate = z.infer<typeof insertNotificationTemplateSchema>;

// Notification Preferences
export const insertNotificationPreferenceSchema = createInsertSchema(notificationPreferences).omit({ id: true });
export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = z.infer<typeof insertNotificationPreferenceSchema>;

// Notifications
export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Scheduled Notifications
export const insertScheduledNotificationSchema = createInsertSchema(scheduledNotifications).omit({ id: true, createdAt: true });
export type ScheduledNotification = typeof scheduledNotifications.$inferSelect;
export type InsertScheduledNotification = z.infer<typeof insertScheduledNotificationSchema>;