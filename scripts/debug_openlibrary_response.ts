
async function main() {
    const subject = "computer_science";
    console.log(`Fetching 1 book for subject: ${subject}...`);
    try {
        const response = await fetch(`https://openlibrary.org/search.json?subject=${subject}&limit=1`, {
            headers: {
                "User-Agent": "SchoolManagementSystem/1.0 (admin@school.edu)"
            }
        });
        const data = await response.json();
        if (data.docs && data.docs.length > 0) {
            console.log("Book Data:", JSON.stringify(data.docs[0], null, 2));
        } else {
            console.log("No books found.");
        }
    } catch (error) {
        console.error("Error:", error);
    }
}
main();
