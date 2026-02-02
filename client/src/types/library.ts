// client/src/types/library.ts
// Typed interfaces for the Digital Library module

/** Book data returned from Open Library search */
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

/** Response from digital content access endpoint */
export interface DigitalContentResponse {
    readUrl: string;
    format: string;
    expiresAt: string;
    title: string;
}

/** Extended library item with digital content fields */
export interface LibraryItemExtended {
    id: number;
    title: string;
    author: string;
    isbn: string | null;
    coverUrl: string | null;
    publicationYear: number | null;
    pageCount: number | null;
    totalCopies: number;
    availableCopies: number;
    locationStack: string | null;
    callNumber: string | null;
    publisher: string | null;
    description: string | null;
    itemType: string;
    createdAt: string;
    // Digital content fields
    bookFormat: "physical" | "digital" | "both";
    digitalFormat: string | null;
    contentUrl: string | null;
    openLibraryKey: string | null;
    openLibraryEditionKey: string | null;
    internetArchiveId: string | null;
    previewUrl: string | null;
    isPublicDomain: boolean;
    subjects: string[];
    languages: string[];
    // Computed helper
    canRead?: boolean;
}

/** Library loan record */
export interface LibraryLoan {
    id: number;
    itemId: number;
    userId: string;
    checkoutDate: string;
    dueDate: string;
    returnDate: string | null;
    status: "active" | "returned" | "overdue" | "lost";
    fineAmount: number;
}
