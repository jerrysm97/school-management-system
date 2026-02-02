// server/services/library.service.ts
import { db } from "../db";
import { eq, and, or, sql, lt } from "drizzle-orm";
import {
    libraryItems,
    libraryLoans,
    type LibraryItem,
    type LibraryLoan,
    type InsertLibraryItem,
    type InsertLibraryLoan
} from "@shared/schema";

export class LibraryService {

    /**
     * Get all library items with optional search
     * Free for all authenticated users
     */
    async getAllBooks(search?: string): Promise<LibraryItem[]> {
        if (search) {
            const lowerSearch = `%${search.toLowerCase()}%`;
            return await db.select().from(libraryItems).where(
                or(
                    sql`lower(${libraryItems.title}) LIKE ${lowerSearch}`,
                    sql`lower(${libraryItems.author}) LIKE ${lowerSearch}`,
                    sql`lower(${libraryItems.isbn}) LIKE ${lowerSearch}`
                )
            );
        }
        return await db.select().from(libraryItems);
    }

    /**
     * Get a single book by ID
     * Free for all authenticated users
     */
    async getBook(id: number): Promise<LibraryItem | undefined> {
        const [book] = await db.select().from(libraryItems).where(eq(libraryItems.id, id));
        return book;
    }

    /**
     * Create a new book
     * Admin/Staff only (enforced at route level)
     */
    async createBook(data: InsertLibraryItem): Promise<LibraryItem> {
        // Ensure availableCopies matches totalCopies for new books
        const bookData = {
            ...data,
            availableCopies: data.totalCopies || 1
        };
        const [book] = await db.insert(libraryItems).values(bookData).returning();
        return book;
    }

    /**
     * Update a book
     * Admin/Staff only (enforced at route level)
     */
    async updateBook(id: number, data: Partial<InsertLibraryItem>): Promise<LibraryItem> {
        const [updated] = await db.update(libraryItems)
            .set(data)
            .where(eq(libraryItems.id, id))
            .returning();
        return updated;
    }

    /**
     * Borrow a book - Free for all authenticated users
     * Uses transaction to ensure atomic copy decrement
     */
    async borrowBook(userId: string, itemId: number): Promise<LibraryLoan> {
        return await db.transaction(async (tx) => {
            // 1. Check availability
            const [book] = await tx.select().from(libraryItems).where(eq(libraryItems.id, itemId));

            if (!book) {
                throw new Error("Book not found");
            }

            // Handle null availableCopies (use totalCopies as fallback)
            const availableCopies = book.availableCopies ?? book.totalCopies ?? 1;

            if (availableCopies < 1) {
                throw new Error("No copies available for borrowing");
            }

            // 2. Check if user already has this book borrowed
            const existingLoan = await tx.select().from(libraryLoans).where(
                and(
                    eq(libraryLoans.itemId, itemId),
                    eq(libraryLoans.userId, userId),
                    or(
                        eq(libraryLoans.status, 'active'),
                        eq(libraryLoans.status, 'overdue')
                    )
                )
            );

            if (existingLoan.length > 0) {
                throw new Error("You already have this book borrowed");
            }

            // 3. Decrement available copies
            await tx.update(libraryItems)
                .set({ availableCopies: availableCopies - 1 })
                .where(eq(libraryItems.id, itemId));

            // 4. Create loan record (default 14 days loan period)
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 14);

            const [loan] = await tx.insert(libraryLoans)
                .values({
                    itemId,
                    userId,
                    checkoutDate: new Date().toISOString().split('T')[0],
                    dueDate: dueDate.toISOString().split('T')[0],
                    status: 'active'
                })
                .returning();

            return loan;
        });
    }

    /**
     * Return a book
     * Restores available copy count
     */
    async returnBook(loanId: number): Promise<LibraryLoan> {
        return await db.transaction(async (tx) => {
            // 1. Get the loan
            const [loan] = await tx.select().from(libraryLoans).where(eq(libraryLoans.id, loanId));

            if (!loan) {
                throw new Error("Loan not found");
            }

            if (loan.returnDate) {
                throw new Error("Book already returned");
            }

            // 2. Update loan status
            const [updatedLoan] = await tx.update(libraryLoans)
                .set({
                    returnDate: new Date().toISOString().split('T')[0],
                    status: 'returned'
                })
                .where(eq(libraryLoans.id, loanId))
                .returning();

            // 3. Increment book copies
            const [book] = await tx.select().from(libraryItems).where(eq(libraryItems.id, loan.itemId));
            if (book) {
                await tx.update(libraryItems)
                    .set({ availableCopies: book.availableCopies + 1 })
                    .where(eq(libraryItems.id, loan.itemId));
            }

            return updatedLoan;
        });
    }

    /**
     * Get loans for a specific user
     * Users can only see their own loans
     */
    async getUserLoans(userId: string, activeOnly: boolean = false): Promise<LibraryLoan[]> {
        const conditions = [eq(libraryLoans.userId, userId)];

        if (activeOnly) {
            conditions.push(eq(libraryLoans.status, 'active'));
        }

        return await db.select().from(libraryLoans).where(and(...conditions));
    }

    /**
     * Get all loans (Admin view)
     */
    async getAllLoans(activeOnly: boolean = false): Promise<LibraryLoan[]> {
        if (activeOnly) {
            return await db.select().from(libraryLoans).where(eq(libraryLoans.status, 'active'));
        }
        return await db.select().from(libraryLoans);
    }

    /**
     * Get overdue loans
     * For admin notifications and fine calculation
     */
    async getOverdueLoans(): Promise<LibraryLoan[]> {
        const today = new Date().toISOString().split('T')[0];

        return await db.select().from(libraryLoans).where(
            and(
                eq(libraryLoans.status, 'active'),
                sql`${libraryLoans.dueDate} < ${today}`
            )
        );
    }

    /**
     * Update overdue status for all loans
     * Should be called periodically (e.g., daily cron job)
     */
    async updateOverdueStatus(): Promise<number> {
        const today = new Date().toISOString().split('T')[0];

        const result = await db.update(libraryLoans)
            .set({ status: 'overdue' })
            .where(
                and(
                    eq(libraryLoans.status, 'active'),
                    sql`${libraryLoans.dueDate} < ${today}`
                )
            )
            .returning();

        return result.length;
    }

    /**
     * Get book with loan information
     * Enriches book data with current availability
     */
    async getBookWithLoans(id: number): Promise<{ book: LibraryItem; activeLoans: LibraryLoan[] } | undefined> {
        const book = await this.getBook(id);
        if (!book) return undefined;

        const activeLoans = await db.select().from(libraryLoans).where(
            and(
                eq(libraryLoans.itemId, id),
                eq(libraryLoans.status, 'active')
            )
        );

        return { book, activeLoans };
    }
}
