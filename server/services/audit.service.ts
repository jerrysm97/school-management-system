import { db } from "../db";
import {
    auditLogs,
    fiscalPeriodLocks,
    InsertAuditLog,
    AuditLog
} from "@shared/schema";
import { eq, and, between, sql, desc } from "drizzle-orm";
import { Request } from "express";

// Extract client info from request
function getClientInfo(req?: Request): { ipAddress?: string; userAgent?: string } {
    if (!req) return {};
    return {
        ipAddress: req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown'
    };
}

export class AuditService {
    // =========================================================================
    // CORE AUDIT LOGGING
    // =========================================================================

    /**
     * Log an action to the audit trail
     * This is the main entry point for all audit logging
     */
    async log(params: {
        userId?: number;
        action: "create" | "update" | "delete" | "login" | "logout" | "view" | "export" | "approve" | "reject";
        tableName: string;
        recordId?: number;
        oldValue?: Record<string, any>;
        newValue?: Record<string, any>;
        metadata?: Record<string, any>;
        req?: Request;
    }): Promise<AuditLog> {
        const { userId, action, tableName, recordId, oldValue, newValue, metadata, req } = params;
        const clientInfo = getClientInfo(req);

        const [log] = await db.insert(auditLogs).values({
            userId,
            action,
            tableName,
            recordId,
            oldValue: oldValue || null,
            newValue: newValue || null,
            metadata: metadata || {},
            ipAddress: clientInfo.ipAddress,
            userAgent: clientInfo.userAgent
        }).returning();

        console.log(`[Audit] ${action.toUpperCase()} on ${tableName}${recordId ? `#${recordId}` : ''} by user ${userId || 'system'}`);
        return log;
    }

    // Convenience methods for common operations
    async logCreate(tableName: string, recordId: number, newValue: Record<string, any>, userId?: number, req?: Request): Promise<AuditLog> {
        return this.log({ userId, action: "create", tableName, recordId, newValue, req });
    }

    async logUpdate(tableName: string, recordId: number, oldValue: Record<string, any>, newValue: Record<string, any>, userId?: number, req?: Request): Promise<AuditLog> {
        return this.log({ userId, action: "update", tableName, recordId, oldValue, newValue, req });
    }

    async logDelete(tableName: string, recordId: number, oldValue: Record<string, any>, userId?: number, req?: Request): Promise<AuditLog> {
        return this.log({ userId, action: "delete", tableName, recordId, oldValue, req });
    }

    async logLogin(userId: number, success: boolean, req?: Request): Promise<AuditLog> {
        return this.log({
            userId,
            action: "login",
            tableName: "users",
            recordId: userId,
            metadata: { success },
            req
        });
    }

    async logLogout(userId: number, req?: Request): Promise<AuditLog> {
        return this.log({ userId, action: "logout", tableName: "users", recordId: userId, req });
    }

    async logExport(userId: number, tableName: string, filters?: Record<string, any>, req?: Request): Promise<AuditLog> {
        return this.log({ userId, action: "export", tableName, metadata: { filters }, req });
    }

    // =========================================================================
    // AUDIT LOG QUERIES
    // =========================================================================

    async getAuditLogs(params: {
        tableName?: string;
        recordId?: number;
        userId?: number;
        action?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        offset?: number;
    }): Promise<AuditLog[]> {
        const { tableName, recordId, userId, action, startDate, endDate, limit = 50, offset = 0 } = params;

        let query = db.select().from(auditLogs).$dynamic();

        const conditions: any[] = [];
        if (tableName) conditions.push(eq(auditLogs.tableName, tableName));
        if (recordId) conditions.push(eq(auditLogs.recordId, recordId));
        if (userId) conditions.push(eq(auditLogs.userId, userId));
        if (action) conditions.push(eq(auditLogs.action, action as any));
        if (startDate && endDate) {
            conditions.push(between(auditLogs.createdAt, startDate, endDate));
        }

        if (conditions.length > 0) {
            query = query.where(and(...conditions));
        }

        return await query
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit)
            .offset(offset);
    }

    // Get audit history for a specific record
    async getRecordHistory(tableName: string, recordId: number): Promise<AuditLog[]> {
        return await db.select()
            .from(auditLogs)
            .where(and(
                eq(auditLogs.tableName, tableName),
                eq(auditLogs.recordId, recordId)
            ))
            .orderBy(desc(auditLogs.createdAt));
    }

    // Get user activity
    async getUserActivity(userId: number, limit = 100): Promise<AuditLog[]> {
        return await db.select()
            .from(auditLogs)
            .where(eq(auditLogs.userId, userId))
            .orderBy(desc(auditLogs.createdAt))
            .limit(limit);
    }

    // =========================================================================
    // FISCAL PERIOD MANAGEMENT
    // =========================================================================

    async getFiscalPeriods() {
        return await db.select().from(fiscalPeriodLocks)
            .orderBy(desc(fiscalPeriodLocks.startDate));
    }

    async createFiscalPeriod(params: {
        periodName: string;
        startDate: string;
        endDate: string;
    }) {
        const [period] = await db.insert(fiscalPeriodLocks)
            .values({
                ...params,
                isLocked: false
            })
            .returning();
        return period;
    }

    async lockFiscalPeriod(periodId: number, userId: number): Promise<boolean> {
        await db.update(fiscalPeriodLocks)
            .set({
                isLocked: true,
                lockedBy: userId,
                lockedAt: new Date()
            })
            .where(eq(fiscalPeriodLocks.id, periodId));

        // Log the lock action
        await this.log({
            userId,
            action: "approve",
            tableName: "fiscal_period_locks",
            recordId: periodId,
            metadata: { event: "period_locked" }
        });

        return true;
    }

    async unlockFiscalPeriod(periodId: number, userId: number, reason: string): Promise<boolean> {
        await db.update(fiscalPeriodLocks)
            .set({
                isLocked: false,
                notes: reason
            })
            .where(eq(fiscalPeriodLocks.id, periodId));

        // Log the unlock action (this is critical - should rarely happen)
        await this.log({
            userId,
            action: "reject",
            tableName: "fiscal_period_locks",
            recordId: periodId,
            metadata: { event: "period_unlocked", reason }
        });

        return true;
    }

    // Check if a date falls within a locked period
    async isDateLocked(date: string | Date): Promise<boolean> {
        const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];

        const lockedPeriods = await db.select()
            .from(fiscalPeriodLocks)
            .where(and(
                eq(fiscalPeriodLocks.isLocked, true),
                sql`${fiscalPeriodLocks.startDate} <= ${dateStr}`,
                sql`${fiscalPeriodLocks.endDate} >= ${dateStr}`
            ));

        return lockedPeriods.length > 0;
    }
}

export const auditService = new AuditService();
