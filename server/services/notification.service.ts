import { db } from "../db";
import {
    notifications,
    notificationTemplates,
    notificationPreferences,
    fees,
    students,
    users,
    InsertNotification
} from "@shared/schema";
import { eq, and, lt, isNull, sql } from "drizzle-orm";

// Template variable replacement
function replaceTemplateVariables(template: string, variables: Record<string, string | number>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return result;
}

export class NotificationService {
    // Create a single notification
    async createNotification(data: InsertNotification): Promise<void> {
        await db.insert(notifications).values(data);
    }

    // Get user's unread notifications
    async getUnreadNotifications(userId: string) {
        return await db.select().from(notifications)
            .where(and(
                eq(notifications.userId, userId),
                isNull(notifications.readAt)
            ))
            .orderBy(sql`${notifications.createdAt} DESC`)
            .limit(50);
    }

    // Get all notifications for user (paginated)
    async getNotifications(userId: string, limit = 20, offset = 0) {
        return await db.select().from(notifications)
            .where(eq(notifications.userId, userId))
            .orderBy(sql`${notifications.createdAt} DESC`)
            .limit(limit)
            .offset(offset);
    }

    // Mark notification as read
    async markAsRead(notificationId: number, userId: string): Promise<void> {
        await db.update(notifications)
            .set({ readAt: new Date(), status: "read" })
            .where(and(
                eq(notifications.id, notificationId),
                eq(notifications.userId, userId)
            ));
    }

    // Mark all as read
    async markAllAsRead(userId: string): Promise<void> {
        await db.update(notifications)
            .set({ readAt: new Date(), status: "read" })
            .where(and(
                eq(notifications.userId, userId),
                isNull(notifications.readAt)
            ));
    }

    // Get unread count
    async getUnreadCount(userId: string): Promise<number> {
        const result = await db.select({ count: sql<number>`count(*)` })
            .from(notifications)
            .where(and(
                eq(notifications.userId, userId),
                isNull(notifications.readAt)
            ));
        return Number(result[0]?.count || 0);
    }

    // =========================================================================
    // AUTOMATED FEE NOTIFICATIONS
    // =========================================================================

    // Send fee reminder to a student
    async sendFeeReminder(studentId: string, feeId: number, dueDate: string, amount: number): Promise<void> {
        // Get student's user ID
        const studentResult = await db.select({
            userId: students.userId,
            name: users.name,
            email: users.email
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .where(eq(students.id, studentId))
            .limit(1);

        if (studentResult.length === 0) return;

        const student = studentResult[0];

        // Create in-app notification
        await this.createNotification({
            userId: student.userId,
            type: "fee_reminder",
            title: "Fee Payment Reminder",
            message: `Dear ${student.name}, your fee of ₹${amount.toLocaleString()} is due on ${dueDate}. Please ensure timely payment to avoid late fees.`,
            link: "/fees",
            channel: "in_app",
            status: "pending",
            metadata: { feeId, amount, dueDate }
        });

        console.log(`[NotificationService] Fee reminder sent to user ${student.userId}`);
    }

    // Send overdue fee alert
    async sendOverdueAlert(studentId: string, feeId: number, amount: number, daysOverdue: number): Promise<void> {
        const studentResult = await db.select({
            userId: students.userId,
            name: users.name
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .where(eq(students.id, studentId))
            .limit(1);

        if (studentResult.length === 0) return;

        const student = studentResult[0];

        await this.createNotification({
            userId: student.userId,
            type: "fee_overdue",
            title: "⚠️ Fee Payment Overdue",
            message: `Dear ${student.name}, your fee of ₹${amount.toLocaleString()} is ${daysOverdue} days overdue. Please pay immediately to avoid additional penalties.`,
            link: "/fees",
            channel: "in_app",
            status: "pending",
            metadata: { feeId, amount, daysOverdue }
        });

        console.log(`[NotificationService] Overdue alert sent to user ${student.userId}`);
    }

    // Send payment confirmation
    async sendPaymentConfirmation(studentId: string, amount: number, receiptNumber?: string): Promise<void> {
        const studentResult = await db.select({
            userId: students.userId,
            name: users.name
        })
            .from(students)
            .innerJoin(users, eq(students.userId, users.id))
            .where(eq(students.id, studentId))
            .limit(1);

        if (studentResult.length === 0) return;

        const student = studentResult[0];

        await this.createNotification({
            userId: student.userId,
            type: "payment_received",
            title: "✅ Payment Received",
            message: `Thank you, ${student.name}! We have received your payment of ₹${amount.toLocaleString()}.${receiptNumber ? ` Receipt: ${receiptNumber}` : ''}`,
            link: "/fees",
            channel: "in_app",
            status: "pending",
            metadata: { amount, receiptNumber }
        });

        console.log(`[NotificationService] Payment confirmation sent to user ${student.userId}`);
    }

    // =========================================================================
    // BATCH NOTIFICATION JOBS (Called by scheduler)
    // =========================================================================

    // Process all fees due in the next 7 days
    async processUpcomingFeeReminders(): Promise<number> {
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(today.getDate() + 7);

        const upcomingFees = await db.select({
            feeId: fees.id,
            studentId: fees.studentId,
            amount: fees.amount,
            dueDate: fees.dueDate
        })
            .from(fees)
            .where(and(
                eq(fees.status, "pending"),
                sql`${fees.dueDate} BETWEEN ${today.toISOString().split('T')[0]} AND ${nextWeek.toISOString().split('T')[0]}`
            ));

        let count = 0;
        for (const fee of upcomingFees) {
            await this.sendFeeReminder(fee.studentId, fee.feeId, fee.dueDate, fee.amount);
            count++;
        }

        console.log(`[NotificationService] Processed ${count} upcoming fee reminders`);
        return count;
    }

    // Process all overdue fees
    async processOverdueFeeAlerts(): Promise<number> {
        const today = new Date().toISOString().split('T')[0];

        const overdueFees = await db.select({
            feeId: fees.id,
            studentId: fees.studentId,
            amount: fees.amount,
            dueDate: fees.dueDate
        })
            .from(fees)
            .where(and(
                eq(fees.status, "pending"),
                lt(fees.dueDate, today)
            ));

        let count = 0;
        for (const fee of overdueFees) {
            const daysOverdue = Math.floor(
                (new Date().getTime() - new Date(fee.dueDate).getTime()) / (1000 * 60 * 60 * 24)
            );
            await this.sendOverdueAlert(fee.studentId, fee.feeId, fee.amount, daysOverdue);
            count++;
        }

        console.log(`[NotificationService] Processed ${count} overdue fee alerts`);
        return count;
    }
}

export const notificationService = new NotificationService();
