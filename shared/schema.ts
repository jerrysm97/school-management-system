
import { pgTable, text, serial, integer, boolean, timestamp, date, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["admin", "teacher", "student", "parent"]);
export const genderEnum = pgEnum("gender", ["male", "female", "other"]);
export const attendanceStatusEnum = pgEnum("attendance_status", ["present", "absent", "late", "excused"]);
export const feeStatusEnum = pgEnum("fee_status", ["paid", "pending", "overdue"]);
export const studentStatusEnum = pgEnum("student_status", ["pending", "approved", "rejected"]);

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  username: text("username").unique().notNull(), // Email in the specs, using username field for consistency
  password: text("password").notNull(),
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
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
  name: text("name").notNull(), // e.g., "10A"
  grade: text("grade").notNull(), // e.g., "10"
  section: text("section").notNull(), // e.g., "A"
  classTeacherId: integer("class_teacher_id").references(() => teachers.id),
});

// Students Table
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
});

// Subjects Table
export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code"),
});

// Class Subjects (Junction)
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
  name: text("name").notNull(), // e.g., "Midterm 2024"
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

// Fees Table
export const fees = pgTable("fees", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => students.id),
  amount: integer("amount").notNull(), // in cents or smallest currency unit
  dueDate: date("due_date").notNull(),
  status: feeStatusEnum("status").default("pending").notNull(),
  description: text("description"),
});

// Timetable Table
export const timetable = pgTable("timetable", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classes.id),
  subjectId: integer("subject_id").notNull().references(() => subjects.id),
  dayOfWeek: integer("day_of_week").notNull(), // 1=Monday, 7=Sunday
  startTime: text("start_time").notNull(), // HH:MM
  endTime: text("end_time").notNull(), // HH:MM
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
}));

export const classesRelations = relations(classes, ({ one, many }) => ({
  classTeacher: one(teachers, { fields: [classes.classTeacherId], references: [teachers.id] }),
  students: many(students),
  subjects: many(classSubjects),
  timetable: many(timetable),
}));

export const teachersRelations = relations(teachers, ({ one, many }) => ({
  user: one(users, { fields: [teachers.userId], references: [users.id] }),
  classes: many(classes), // Classes where they are the class teacher
  subjects: many(classSubjects), // Subjects they teach
}));

// Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
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

// Export Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Student = typeof students.$inferSelect;
export type Teacher = typeof teachers.$inferSelect;
export type Class = typeof classes.$inferSelect;
