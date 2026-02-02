// server/services/library.service.ts
import { db } from "../db";
import { eq, and, or, sql } from "drizzle-orm";
import {
    libraryItems,
    libraryLoans,
    type LibraryItem,
    type LibraryLoan,
    type InsertLibraryItem,
    type InsertLibraryLoan
} from "@shared/schema";

// ============================================
// STRICT TYPE DEFINITIONS (No `any` allowed)
// ============================================

/** Open Library Search API response structure */
interface OpenLibrarySearchDoc {
    key: string;                    // e.g., "/works/OL15626917W"
    title: string;
    author_name?: string[];
    first_publish_year?: number;
    isbn?: string[];
    cover_i?: number;
    number_of_pages_median?: number;
    subject?: string[];
    language?: string[];
    ia?: string[];                  // Internet Archive identifiers
    public_scan_b?: boolean;        // Is this public domain?
    has_fulltext?: boolean;
    publisher?: string[];
}

interface OpenLibrarySearchResponse {
    numFound: number;
    docs: OpenLibrarySearchDoc[];
}

/** Cleaned book data from Open Library */
export interface OpenLibraryBook {
    openLibraryKey: string;
    title: string;
    author: string;
    isbn: string | null;
    coverUrl: string | null;
    publishedYear: number | null;
    pageCount: number | null;
    subjects: string[];
    languages: string[];
    internetArchiveId: string | null;
    isPublicDomain: boolean;
    previewUrl: string | null;
    canRead: boolean;
    publisher: string | null;
}

/** Response for digital content access */
export interface DigitalContentResponse {
    readUrl: string;
    format: string;
    expiresAt: Date;
    title: string;
}

export class LibraryService {

    // ============================================
    // OPEN LIBRARY INTEGRATION METHODS
    // ============================================

    /**
     * Search Open Library with strict typing and error handling
     * Gracefully handles API failures with timeouts
     */
    async searchOpenLibrary(query: string): Promise<OpenLibraryBook[]> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
            const response = await fetch(
                `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=20`,
                {
                    headers: { "User-Agent": "SchoolManagementSystem/1.0 (admin@school.edu)" },
                    signal: controller.signal
                }
            );

            if (!response.ok) {
                throw new Error(`Open Library API returned ${response.status}`);
            }

            const data: OpenLibrarySearchResponse = await response.json();

            return data.docs.map((doc): OpenLibraryBook => ({
                openLibraryKey: doc.key,
                title: doc.title,
                author: doc.author_name?.[0] ?? "Unknown Author",
                isbn: doc.isbn?.[0] ?? null,
                coverUrl: doc.cover_i
                    ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`
                    : null,
                publishedYear: doc.first_publish_year ?? null,
                pageCount: doc.number_of_pages_median ?? null,
                subjects: doc.subject?.slice(0, 10) ?? [],
                languages: doc.language ?? ["en"],
                internetArchiveId: doc.ia?.[0] ?? null,
                isPublicDomain: doc.public_scan_b ?? false,
                previewUrl: doc.ia?.[0]
                    ? `https://archive.org/details/${doc.ia[0]}`
                    : null,
                canRead: !!(doc.has_fulltext && doc.ia?.length),
                publisher: doc.publisher?.[0] ?? null,
            }));
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error("Open Library request timed out. Please try again.");
            }
            throw new Error(`Failed to search Open Library: ${(error as Error).message}`);
        } finally {
            clearTimeout(timeout);
        }
    }

    /**
     * Import a book from Open Library into local database
     * Checks for duplicates using Open Library key
     */
    async importFromOpenLibrary(data: OpenLibraryBook): Promise<LibraryItem> {
        // Check for duplicate using Open Library key
        const existing = await db.select()
            .from(libraryItems)
            .where(eq(libraryItems.openLibraryKey, data.openLibraryKey))
            .limit(1);

        if (existing.length > 0) {
            throw new Error(`Book "${data.title}" already exists in catalog`);
        }

        const bookData: InsertLibraryItem = {
            title: data.title,
            author: data.author,
            isbn: data.isbn,
            coverUrl: data.coverUrl,
            publicationYear: data.publishedYear,
            pageCount: data.pageCount,
            publisher: data.publisher,
            bookFormat: data.canRead ? "both" : "physical",
            digitalFormat: data.canRead ? "html" : null, // Internet Archive uses HTML reader
            openLibraryKey: data.openLibraryKey,
            internetArchiveId: data.internetArchiveId,
            previewUrl: data.previewUrl,
            isPublicDomain: data.isPublicDomain,
            subjects: data.subjects,
            languages: data.languages,
            totalCopies: 1,
            availableCopies: 1,
            itemType: "book",
        };

        const [book] = await db.insert(libraryItems).values(bookData).returning();
        return book;
    }

    /**
     * Get digital reading URL for authenticated users
     * Ensures only authenticated users can access digital content
     */
    async getDigitalContent(bookId: number, userId: string): Promise<DigitalContentResponse> {
        const book = await this.getBook(bookId);

        if (!book) {
            throw new Error("Book not found");
        }

        if (book.bookFormat === "physical") {
            throw new Error("This book is not available in digital format");
        }

        if (!book.internetArchiveId && !book.contentUrl) {
            throw new Error("No digital content available for this book");
        }

        // For Internet Archive books, construct embedded reader URL
        if (book.internetArchiveId) {
            return {
                readUrl: `https://archive.org/embed/${book.internetArchiveId}`,
                format: "html",
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                title: book.title,
            };
        }

        // For self-hosted content, return the URL
        return {
            readUrl: book.contentUrl!,
            format: book.digitalFormat ?? "pdf",
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            title: book.title,
        };
    }

    /**
     * Get books available for digital reading
     */
    async getDigitalBooks(search?: string): Promise<LibraryItem[]> {
        if (search) {
            const lowerSearch = `%${search.toLowerCase()}%`;
            return await db.select()
                .from(libraryItems)
                .where(
                    and(
                        or(
                            eq(libraryItems.bookFormat, "digital"),
                            eq(libraryItems.bookFormat, "both")
                        ),
                        or(
                            sql`lower(${libraryItems.title}) LIKE ${lowerSearch}`,
                            sql`lower(${libraryItems.author}) LIKE ${lowerSearch}`
                        )
                    )
                );
        }

        return await db.select()
            .from(libraryItems)
            .where(
                or(
                    eq(libraryItems.bookFormat, "digital"),
                    eq(libraryItems.bookFormat, "both")
                )
            );
    }

    // ============================================
    // EXISTING METHODS (Physical + Digital Library)
    // ============================================

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
                    .set({ availableCopies: (book.availableCopies ?? 0) + 1 })
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
