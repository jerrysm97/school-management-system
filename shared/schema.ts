import { pgTable, text, serial, integer, boolean, timestamp, date, pgEnum, jsonb } from "drizzle-orm/pg-core";
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

// Users Table (UPDATED with UDF)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").unique().notNull(),
  email: text("email"),
  password: text("password").notNull(),
  role: roleEnum("role").notNull(),
  mustChangePassword: boolean("must_change_password").default(false),
  udf: jsonb("udf").default({}), // Universal Data Fields
  createdAt: timestamp("created_at").defaultNow(),
});

// Academic Periods (NEW)
export const academicPeriods = pgTable("academic_periods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Fall 2026"
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  isActive: boolean("is_active").default(false),
});

// Teachers Table
export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  department: text("department"),
  phone: text("phone"),
});

// Parents Table
export const parents = pgTable("parents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  phone: text("phone"),
  address: text("address"),
});

// Classes Table
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  grade: text("grade").notNull(),
  section: text("section").notNull(),
  classTeacherId: integer("class_teacher_id").references(() => teachers.id),
  academicPeriodId: integer("academic_period_id").references(() => academicPeriods.id), // Link to period
});

// Students Table (UPDATED - PS_PERSON fields)
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  admissionNo: text("admission_no").unique().notNull(),
  classId: integer("class_id").references(() => classes.id),
  dob: date("dob").notNull(),
  gender: genderEnum("gender"),
  phone: text("phone"),
  address: text("address"),
  parentId: integer("parent_id").references(() => parents.id),
  status: studentStatusEnum("status").default("pending").notNull(),
  // New PS_PERSON Fields
  nationalId: text("national_id"),
  citizenship: text("citizenship"),
  ethnicity: text("ethnicity"),
  religion: text("religion"),
  bloodGroup: text("blood_group"),
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
  teacherId: integer("teacher_id").references(() => teachers.id),
});

// Attendance Table
export const attendance = pgTable("attendance", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  date: date("date").notNull(),
  status: attendanceStatusEnum("status").notNull(),
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
  id: serial("id").primaryKey(),
  examId: integer("exam_id").notNull().references(() => exams.id),
  studentId: integer("student_id").notNull().references(() => students.id),
  score: integer("score").notNull(),
});

// Course History (NEW)
export const courseHistory = pgTable("course_history", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
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
  studentId: integer("student_id").notNull().references(() => students.id),
  amount: integer("amount").notNull(),
  dueDate: date("due_date").notNull(),
  status: feeStatusEnum("status").default("pending").notNull(),
  description: text("description"),
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
  studentId: integer("student_id").notNull().references(() => students.id).unique(),
  currentBalance: integer("current_balance").default(0).notNull(), // in cents
  accountType: accountTypeEnum("account_type").default("checking"),
  residencyStatus: residencyEnum("residency_status").default("in_state"),
  hasFinancialHold: boolean("has_financial_hold").default(false),
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
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
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
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => studentAccounts.id),
  amount: integer("amount").notNull(), // in cents
  transactionType: finTransactionTypeEnum("transaction_type").notNull(),
  paymentMode: paymentModeEnum("payment_mode"),
  description: text("description"),
  referenceNo: text("reference_no"), // external payment reference
  createdAt: timestamp("created_at").defaultNow(),
});

// Financial Aid Awards - Tracks aid from external sources
export const financialAidAwards = pgTable("financial_aid_awards", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
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
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, mustChangePassword: true });
export const insertTeacherSchema = createInsertSchema(teachers).omit({ id: true });
export const insertParentSchema = createInsertSchema(parents).omit({ id: true });
export const insertClassSchema = createInsertSchema(classes).omit({ id: true });
export const insertStudentSchema = createInsertSchema(students).omit({ id: true });
export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true });
export const insertClassSubjectSchema = createInsertSchema(classSubjects).omit({ id: true });
export const insertAttendanceSchema = createInsertSchema(attendance).omit({ id: true });
export const insertExamSchema = createInsertSchema(exams).omit({ id: true });
export const insertMarkSchema = createInsertSchema(marks).omit({ id: true });
export const insertFeeSchema = createInsertSchema(fees).omit({ id: true });
export const insertTimetableSchema = createInsertSchema(timetable).omit({ id: true });
export const insertAcademicPeriodSchema = createInsertSchema(academicPeriods).omit({ id: true });
export const insertCourseHistorySchema = createInsertSchema(courseHistory).omit({ id: true });

// Financial Engine Schemas
export const insertStudentAccountSchema = createInsertSchema(studentAccounts).omit({ id: true, dateOpened: true });
export const insertFeeStructureSchema = createInsertSchema(feeStructures).omit({ id: true });
export const insertEnrollmentHistorySchema = createInsertSchema(enrollmentHistory).omit({ id: true, enrolledAt: true });
export const insertFinancialTransactionSchema = createInsertSchema(financialTransactions).omit({ id: true, createdAt: true });
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
  payerId: integer("payer_id").references(() => users.id), // Link to PS_PERSON/User
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
  payeeId: integer("payee_id").references(() => users.id),
  payeeName: text("payee_name"), // for external vendors
  description: text("description").notNull(),
  status: finExpenseStatusEnum("status").default("pending"),
  approvedBy: integer("approved_by").references(() => users.id),
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
  userId: integer("user_id").references(() => users.id),
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
  userId: integer("user_id").notNull().references(() => users.id),
  role: roleEnum("role").notNull().default("student"), // Can be teacher within a course
  enrolledAt: timestamp("enrolled_at").defaultNow(),
});

export const lmsSubmissions = pgTable("lms_submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").notNull().references(() => lmsAssignments.id),
  studentId: integer("student_id").notNull().references(() => users.id), // Using User ID for broader access
  content: text("content"), // Online text
  fileUrl: text("file_url"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  status: submissionStatusEnum("status").default("submitted"),
  grade: integer("grade"),
  feedback: text("feedback"),
  gradedBy: integer("graded_by").references(() => users.id),
});

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
  createdBy: integer("created_by").references(() => users.id),
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
});

// Staff Table (For HR, Finance, Admin - non-teaching)
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
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