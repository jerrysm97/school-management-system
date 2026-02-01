
import { storage } from "../server/storage";
import { insertLibraryBookSchema } from "../shared/schema";

// Open Library API: https://openlibrary.org/dev/docs/api/search
// We will fetch books by subject.

const SUBJECTS = ["computer_science", "programming", "science", "fiction", "history", "art", "medicine", "business"];

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

async function fetchBooks(subject: string): Promise<OpenLibraryBook[]> {
    console.log(`Fetching books for subject: ${subject}...`);
    try {
        const response = await fetch(`https://openlibrary.org/search.json?subject=${subject}&limit=10`, {
            headers: {
                "User-Agent": "SchoolManagementSystem/1.0 (admin@school.edu)"
            }
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch books: ${response.statusText}`);
        }
        const data = await response.json();
        console.log(`Fetched ${data.docs?.length} books for ${subject}`);
        return data.docs || [];
    } catch (error) {
        console.error(`Error fetching subject ${subject}:`, error);
        return [];
    }
}

async function main() {
    console.log("Starting Open Library Import...");

    let totalImported = 0;

    for (const subject of SUBJECTS) {
        const books = await fetchBooks(subject);

        for (const book of books) {
            // We need at least a Title. ISBN is optional (we can generate one from Key)
            if (!book.title || !book.key) {
                continue;
            }

            // Use the first ISBN or generate one
            const isbn = (book.isbn && book.isbn.length > 0) ? book.isbn[0] : `OL-${book.key.replace("/works/", "")}`;

            // Check if exists
            const existing = await storage.getBookByISBN(isbn);
            if (existing) {
                console.log(`Skipping existing book: ${book.title} (${isbn})`);
                continue;
            }

            // Construct book object
            const bookData = {
                isbn: isbn,
                title: book.title,
                author: book.author_name ? book.author_name[0] : "Unknown",
                subject: subject,
                coverUrl: book.cover_i ? `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg` : undefined,
                publishedDate: book.first_publish_year ? book.first_publish_year.toString() : undefined,
                pageCount: book.number_of_pages_median,
                description: book.subject ? book.subject.slice(0, 5).join(", ") : undefined,
                quantity: 5,
                availableQuantity: 5,
                location: "Main Library",
            };

            // Validate/Parse with schema (optional, but good practice)
            try {
                const parsed = insertLibraryBookSchema.parse(bookData);
                await storage.createBook(parsed);
                console.log(`Imported: ${book.title}`);
                totalImported++;
            } catch (e) {
                console.error(`Failed to import ${book.title}:`, e);
            }
        }
    }

    console.log(`Import complete. Total books imported: ${totalImported}`);
    process.exit(0);
}

main();
