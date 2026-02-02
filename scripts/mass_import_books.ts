
import { storage } from "../server/storage";
import { insertLibraryItemSchema } from "../shared/schema";

const SUBJECTS = [
    "computer_science",
    "information_technology",
    "software_engineering",
    "computer_engineering",
    "programming",
    "coding",
    "artificial_intelligence",
    "web_development",
    "data_science",
    "cybersecurity"
];

const TARGET_COUNT = 1000;

interface OpenLibraryBook {
    title: string;
    author_name?: string[];
    isbn?: string[];
    cover_i?: number;
    first_publish_year?: number;
    number_of_pages_median?: number;
    subject?: string[];
    key: string;
}

// Helper to delay execution (rate limiting)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchBooks(subject: string, offset: number): Promise<OpenLibraryBook[]> {
    console.log(`Fetching books for subject: ${subject} (offset: ${offset})...`);
    try {
        const response = await fetch(`https://openlibrary.org/search.json?subject=${subject}&limit=50&offset=${offset}`, {
            headers: {
                "User-Agent": "SchoolManagementSystem/1.0 (admin@school.edu)"
            }
        });
        if (!response.ok) {
            console.error(`Failed to fetch: ${response.statusText}`);
            return [];
        }
        const data = await response.json();
        return data.docs || [];
    } catch (error) {
        console.error(`Error fetching subject ${subject}:`, error);
        return [];
    }
}

async function main() {
    console.log(`Starting Mass Import (Target: ${TARGET_COUNT})...`);

    let totalImported = 0;

    // Cycle through subjects to get variety
    let subjectIndex = 0;
    let offsets: Record<string, number> = {};

    // Initialize offsets
    SUBJECTS.forEach(s => offsets[s] = 0);

    while (totalImported < TARGET_COUNT) {
        const subject = SUBJECTS[subjectIndex];
        const offset = offsets[subject];

        const books = await fetchBooks(subject, offset);

        if (books.length === 0) {
            console.log(`No more books found for subject: ${subject}`);
            // Move to next subject, but if all empty, break? 
            // For simplicity, just skip this subject for now
        }

        let subjectImportedCount = 0;

        for (const book of books) {
            if (totalImported >= TARGET_COUNT) break;

            if (!book.title || !book.key) continue;

            // Generate ISBN if missing
            const isbn = (book.isbn && book.isbn.length > 0) ? book.isbn[0] : `OL-${book.key.replace("/works/", "")}`;

            // Check existence
            const existing = await storage.getBookByISBN(isbn);
            if (existing) {
                // console.log(`Skipping existing: ${book.title}`); // reduce log spam
                continue;
            }

            const bookData = {
                isbn: isbn,
                title: book.title,
                author: book.author_name ? book.author_name[0] : "Unknown",
                subject: subject,
                coverUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : undefined,
                publishedDate: book.first_publish_year ? book.first_publish_year.toString() : undefined,
                pageCount: book.number_of_pages_median,
                description: book.subject ? book.subject.slice(0, 5).join(", ") : subject,
                quantity: 3,
                availableQuantity: 3,
                location: "Main Library",
            };

            try {
                const parsed = insertLibraryItemSchema.parse(bookData);
                await storage.createLibraryItem(parsed);
                // console.log(`Imported: ${book.title}`); // reduce log spam
                totalImported++;
                subjectImportedCount++;
            } catch (e) {
                // Ignore validation errors
            }
        }

        console.log(`Examples imported: ${subjectImportedCount} from this batch. Total: ${totalImported}/${TARGET_COUNT}`);

        // Increment offset for next time we visit this subject
        offsets[subject] += 50; // increment by limit

        // Rotate subject
        subjectIndex = (subjectIndex + 1) % SUBJECTS.length;

        // Be nice to API
        await delay(500);
    }

    console.log(`Mass Import complete! Total added: ${totalImported}`);
    process.exit(0);
}

main();
