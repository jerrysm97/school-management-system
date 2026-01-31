import { eq, isNull, and } from "drizzle-orm";
import { Request, Response, NextFunction } from "express";

// Soft delete middleware
export const withSoftDelete = (req: Request, res: Response, next: NextFunction) => {
    // Can be used to inject global filters if using a query builder that supports it
    // For Drizzle, we mostly use helper functions
    next();
};

// Helper for Drizzle queries
export function excludeDeleted<T>(table: any) {
    return isNull(table.deletedAt);
}

// Helper to include soft deleted (for admins)
export function withDeleted(condition: any, showDeleted: boolean = false) {
    if (showDeleted) return condition;
    return and(condition, isNull(condition.deletedAt)); // Logic needs refinement based on query context
}
