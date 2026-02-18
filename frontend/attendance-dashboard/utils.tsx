export function getCurrentDate() {
    // Create a new Date object for the current date and time
    const today = new Date();

    // Get individual components
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(today.getDate()).padStart(2, '0');

    // Format as YYYY-MM-DD
    const formattedDate = `${year}-${month}-${day}`;

    return formattedDate; // Returns: "2026-02-18" (for example)
}