
import { db } from "./db";
import { 
  users, students, teachers, classes, attendance, marks, fees, parents, subjects, classSubjects, timetable,
  type InsertUser, type InsertStudent, type InsertTeacher, type InsertClass, type InsertAttendance,
  type User, type Student, type Teacher, type Class, type Attendance
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Users & Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
}

export class DatabaseStorage implements IStorage {
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
    
    // For classId filter, we'd need to join with students, but for simplicity let's rely on studentId filtering from frontend or join if needed
    // Detailed implementation:
    const query = db.select().from(attendance);
    
    if (classId) {
      // Subquery or join needed. 
      // Simplified:
      const studentIdsInClass = db.select({ id: students.id }).from(students).where(eq(students.classId, classId));
      conditions.push(sql`${attendance.studentId} IN ${studentIdsInClass}`);
    }

    if (conditions.length > 0) {
      // @ts-ignore - AND logic with dynamic array
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
}

export const storage = new DatabaseStorage();
