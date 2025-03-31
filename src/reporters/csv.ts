import type IUserStats from "../types/IUserStats";

/**
 * Format the stats as CSV and print to stdout
 */
function formatCsv(stats: IUserStats[]): void {
    // Print header
    console.log('User name;Files changed;Lines added;Lines deleted;Total lines (delta);Add./Del. ratio (1:n);Commit count');

    // Print each user's stats
    for (const user of stats) {
        console.log(
            `${escapeField(user.userName)};` +
            `${user.filesChanged};` +
            `${user.linesAdded};` +
            `${user.linesDeleted};` +
            `${user.totalDelta};` +
            `${user.ratio.toFixed(6)};` +
            `${user.commitCount}`
        );
    }
}

/**
 * Escape special characters in CSV fields
 */
function escapeField(field: string): string {
    // If the field contains semicolons, quotes, or newlines, wrap it in quotes
    if (field.includes(';') || field.includes('"') || field.includes('\n')) {
        // Double any existing quotes
        return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
}

export default formatCsv;
