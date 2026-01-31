import { db } from "../db";
import {
    students, teachers, classes, attendance, marks, exams, subjects, academicPeriods, users,
    type Student, type Teacher, type Class, type Attendance, type Subject, type AcademicPeriod,
    type InsertStudent, type InsertTeacher, type InsertClass, type InsertAttendance, type User
} from "@shared/schema";
import { eq, and, inArray, sql, desc } from "drizzle-orm";
import { encrypt, decrypt } from "../utils/encryption";
import { sanitizeUser } from "./user.service";

export class AcademicService {

    // Academic Periods
    async getAcademicPeriods(): Promise<AcademicPeriod[]> {
        return await db.select().from(academicPeriods).orderBy(academicPeriods.startDate);
    }

    async createAcademicPeriod(period: any): Promise<AcademicPeriod> {
        const [newPeriod] = await db.insert(academicPeriods).values(period).returning();
        return newPeriod;
    }

    async toggleAcademicPeriod(id: number, isActive: boolean): Promise<void> {
        await db.transaction(async (tx) => {
            // If setting to active, deactivate all others
            if (isActive) {
                await tx.update(academicPeriods).set({ isActive: false });
            }
            await tx.update(academicPeriods).set({ isActive }).where(eq(academicPeriods.id, id));
        });
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

        const rows = await query;

        // Decrypt sensitive fields for all students
        return rows.map(row => {
            const student = {
                ...row.student,
                // Mask sensitive PII by default when listing
                nationalId: row.student.nationalId ? "****" : null,
                citizenship: row.student.citizenship ? "****" : null,
                religion: row.student.religion ? "****" : null,
                bloodGroup: row.student.bloodGroup ? "****" : null,
            };

            return {
                ...student,
                user: sanitizeUser(row.user),
                class: row.class
            };
        });
    }

    async getStudent(id: number, includeSensitive?: boolean): Promise<(Student & { user: User }) | undefined> {
        const [row] = await db
            .select({
                student: students,
                user: users
            })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .where(eq(students.id, id));

        if (!row) return undefined;

        const student = {
            ...row.student,
            nationalId: row.student.nationalId ? (decrypt(row.student.nationalId) ? (includeSensitive ? decrypt(row.student.nationalId) : "****") : null) : null,
            citizenship: row.student.citizenship ? (decrypt(row.student.citizenship) ? (includeSensitive ? decrypt(row.student.citizenship) : "****") : null) : null,
            religion: row.student.religion ? (decrypt(row.student.religion) ? (includeSensitive ? decrypt(row.student.religion) : "****") : null) : null,
            bloodGroup: row.student.bloodGroup ? (decrypt(row.student.bloodGroup) ? (includeSensitive ? decrypt(row.student.bloodGroup) : "****") : null) : null,
        };
        return { ...student, user: sanitizeUser(row.user) };
    }

    async getStudentByUserId(userId: number): Promise<(Student & { user: User }) | undefined> {
        const [row] = await db
            .select({
                student: students,
                user: users
            })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .where(eq(students.userId, userId));

        if (!row) return undefined;
        return { ...row.student, user: sanitizeUser(row.user) };
    }

    async createStudent(student: InsertStudent): Promise<Student> {
        const encryptedStudent = {
            ...student,
            nationalId: student.nationalId ? encrypt(student.nationalId) : null,
            citizenship: student.citizenship ? encrypt(student.citizenship) : null,
            religion: student.religion ? encrypt(student.religion) : null,
            bloodGroup: student.bloodGroup ? encrypt(student.bloodGroup) : null,
        };
        const [newStudent] = await db.insert(students).values(encryptedStudent).returning();
        return newStudent;
    }

    async updateStudentStatus(id: number, status: "approved" | "rejected"): Promise<void> {
        await db.update(students).set({ status }).where(eq(students.id, id));
    }

    async bulkUpdateStudentStatus(ids: number[], status: "approved" | "rejected"): Promise<void> {
        await db.update(students).set({ status }).where(inArray(students.id, ids));
    }

    async bulkDeleteStudents(ids: number[]): Promise<void> {
        await db.update(students).set({ deletedAt: new Date() }).where(inArray(students.id, ids));
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

        return rows.map(row => ({ ...row.teacher, user: sanitizeUser(row.user) }));
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
    async getClasses(classTeacherId?: number): Promise<(Class & { classTeacher: Teacher | null })[]> {
        const query = db
            .select({
                class: classes,
                teacher: teachers
            })
            .from(classes)
            .leftJoin(teachers, eq(classes.classTeacherId, teachers.id));

        if (classTeacherId) {
            query.where(eq(classes.classTeacherId, classTeacherId));
        }

        const rows = await query;
        return rows.map(row => ({ ...row.class, classTeacher: row.teacher }));
    }

    async getSubjects(): Promise<Subject[]> {
        return await db.select().from(subjects).orderBy(subjects.name);
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

    async getAttendance(classId?: number, date?: string, studentId?: number, academicPeriodId?: number): Promise<Attendance[]> {
        let conditions = [];
        if (date) conditions.push(eq(attendance.date, date));
        if (studentId) conditions.push(eq(attendance.studentId, studentId));
        if (academicPeriodId) conditions.push(eq(attendance.academicPeriodId, academicPeriodId));

        const query = db.select().from(attendance);

        if (classId) {
            const studentIdsInClass = db.select({ id: students.id })
                .from(students)
                .where(eq(students.classId, classId));
            conditions.push(inArray(attendance.studentId, studentIdsInClass));
        }

        if (conditions.length > 0) {
            query.where(and(...conditions));
        }

        return await query;
    }

    async updateDailyAttendance(id: number, present: boolean): Promise<Attendance> {
        const status = present ? 'present' : 'absent';
        const [updated] = await db.update(attendance)
            .set({ status: status as any })
            .where(eq(attendance.id, id))
            .returning();
        return updated;
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

    async getAttendanceStats(): Promise<{ attendanceRate: number; attendanceWeeklyChange: number; totalRecords: number }> {
        const [total] = await db.select({ count: sql<number>`count(*)` }).from(attendance);
        const totalRecords = Number(total?.count || 0);

        if (totalRecords === 0) {
            return { attendanceRate: 0, attendanceWeeklyChange: 0, totalRecords: 0 };
        }

        const [attended] = await db.select({ count: sql<number>`count(*)` })
            .from(attendance)
            .where(sql`${attendance.status} IN ('present', 'late')`);

        const attendedCount = Number(attended?.count || 0);
        const attendanceRate = Math.round((attendedCount / totalRecords) * 100);

        // Calculate weekly change
        const today = new Date();
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);
        const twoWeeksAgo = new Date(today);
        twoWeeksAgo.setDate(today.getDate() - 14);

        const todayStr = today.toISOString().split('T')[0];
        const oneWeekAgoStr = oneWeekAgo.toISOString().split('T')[0];
        const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

        // Simpler weekly query (could be optimized)
        const [thisWeekTotal] = await db.select({ count: sql<number>`count(*)` })
            .from(attendance)
            .where(sql`${attendance.date} BETWEEN ${oneWeekAgoStr} AND ${todayStr}`);

        const [thisWeekAttended] = await db.select({ count: sql<number>`count(*)` })
            .from(attendance)
            .where(sql`${attendance.date} BETWEEN ${oneWeekAgoStr} AND ${todayStr} AND ${attendance.status} IN ('present', 'late')`);

        const [lastWeekTotal] = await db.select({ count: sql<number>`count(*)` })
            .from(attendance)
            .where(sql`${attendance.date} BETWEEN ${twoWeeksAgoStr} AND ${oneWeekAgoStr}`);

        const [lastWeekAttended] = await db.select({ count: sql<number>`count(*)` })
            .from(attendance)
            .where(sql`${attendance.date} BETWEEN ${twoWeeksAgoStr} AND ${oneWeekAgoStr} AND ${attendance.status} IN ('present', 'late')`);

        const thisWeekRate = Number(thisWeekTotal?.count || 0) > 0
            ? Math.round((Number(thisWeekAttended?.count || 0) / Number(thisWeekTotal?.count || 1)) * 100)
            : 0;

        const lastWeekRate = Number(lastWeekTotal?.count || 0) > 0
            ? Math.round((Number(lastWeekAttended?.count || 0) / Number(lastWeekTotal?.count || 1)) * 100)
            : 0;

        const attendanceWeeklyChange = thisWeekRate - lastWeekRate;

        return { attendanceRate, attendanceWeeklyChange, totalRecords };
    }
}
